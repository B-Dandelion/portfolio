#!/usr/bin/env python3
"""Check the static site over HTTP, including GitHub Pages subpath hosting.

Python standard library only. --external checks public HTTP links as well;
network/auth failures are reported separately and exit nonzero for review.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
import tempfile
from threading import Thread
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urljoin, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.issues = set(), [], []
        self.h1_count = 0
        self.has_lang = False
        self.has_main = False
        self.title = False
        self.description = False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                self.issues.append(f"duplicate id: {attrs['id']}")
            self.ids.add(attrs['id'])
        if tag == 'html':
            self.has_lang = attrs.get('lang') == 'ko'
        if tag == 'main':
            self.has_main = attrs.get('id') == 'main'
        if tag == 'h1':
            self.h1_count += 1
        if tag == 'title':
            self.title = True
        if tag == 'meta' and attrs.get('name') == 'description':
            self.description = bool(attrs.get('content'))
        if tag == 'img' and 'alt' not in attrs:
            self.issues.append('image without alt')
        if tag == 'a' and attrs.get('target') == '_blank':
            if not {'noopener', 'noreferrer'} <= set(attrs.get('rel', '').split()):
                self.issues.append('new-tab link missing rel protection')
        for attribute in ('href', 'src'):
            if attribute in attrs:
                self.refs.append(attrs[attribute])


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def get(url):
    # Encode non-ASCII paths while preserving existing URL escapes.
    safe_url = quote(url, safe=":/?#[]@!$&'()*+,;=%")
    with urlopen(Request(safe_url, headers={'User-Agent': 'PortfolioLinkCheck/1.0'}), timeout=25) as response:
        return response.status, response.headers, response.read()


def check_external(url):
    try:
        status, _, _ = get(url)
        return status, url
    except (HTTPError, URLError, TimeoutError) as error:
        return str(error), url


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--external', action='store_true')
    args = parser.parse_args()
    pages = {p.name: Document(p.read_text()) for p in ROOT.glob('*.html')}
    errors, external, checked = [], set(), set()
    for name, doc in pages.items():
        errors.extend(f'{name}: {issue}' for issue in doc.issues)
        for valid, label in [(doc.has_lang, 'Korean language'), (doc.has_main, 'main / skip target'),
                             (doc.h1_count == 1, 'one h1'), (doc.title, 'title'), (doc.description, 'description')]:
            if not valid:
                errors.append(f'{name}: missing/invalid {label}')
    # Mirror /portfolio/ deployment without requiring the checkout's folder name.
    with tempfile.TemporaryDirectory(prefix='portfolio-http-') as tmp:
        (Path(tmp) / 'portfolio').symlink_to(ROOT, target_is_directory=True)
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=tmp))
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f'http://127.0.0.1:{server.server_port}/portfolio/'
        try:
            for name, doc in pages.items():
                status, _, data = get(base + name)
                if status != 200 or data != (ROOT / name).read_bytes():
                    errors.append(f'{name}: HTTP content differs')
                for ref in doc.refs:
                    url = urljoin(base + name, ref)
                    parsed = urlsplit(url)
                    if parsed.scheme not in ('http', 'https'):
                        continue
                    if parsed.netloc != urlsplit(base).netloc:
                        external.add(url.split('#')[0])
                        continue
                    if not parsed.path.startswith('/portfolio/'):
                        errors.append(f'{name}: link escapes GitHub Pages subpath: {ref}')
                        continue
                    target = unquote(parsed.path.removeprefix('/portfolio/')) or 'index.html'
                    if parsed.fragment and target in pages and unquote(parsed.fragment) not in pages[target].ids:
                        errors.append(f'{name}: missing anchor: {ref}')
                    if url not in checked:
                        try:
                            status, _, data = get(url)
                            if status != 200 or not data:
                                errors.append(f'{name}: invalid response for {ref}')
                        except (HTTPError, URLError) as error:
                            errors.append(f'{name}: {ref}: {error}')
                        checked.add(url)
            # CSS can introduce local assets without HTML references.
            for ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)', (ROOT / 'styles.css').read_text()):
                parsed = urlsplit(urljoin(base + 'styles.css', ref))
                if parsed.netloc == urlsplit(base).netloc:
                    try:
                        get(parsed.geturl())
                    except (HTTPError, URLError) as error:
                        errors.append(f'CSS: {ref}: {error}')
                else:
                    external.add(parsed.geturl())
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
    if args.external:
        for status, url in ThreadPoolExecutor(max_workers=6).map(check_external, sorted(external)):
            print(f'EXTERNAL {status} {url}')
            if status != 200:
                errors.append(f'external link requires review: {url}: {status}')
    for error in errors:
        print('FAIL:', error)
    print(f'{len(pages)} pages; {len(checked)} unique local HTTP targets; '
          f'{len(external)} external URLs discovered; {len(errors)} failures')
    return 1 if errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
