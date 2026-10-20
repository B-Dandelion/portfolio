#!/usr/bin/env python3
"""Optional browser regression checks; requires Playwright and axe-core.

Start the static HTTP server first. Example:
  python3 tools/check_browser.py --base-url http://127.0.0.1:8000/ \
    --axe-path /tmp/portfolio-audit/node_modules/axe-core/axe.min.js
"""
import argparse
import json
from pathlib import Path
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

PAGES = ('index.html', 'forestring.html', 'inc.html', 'journal-2years.html', 'writing.html')
WIDTHS = (320, 390, 768, 1024, 1440)
AXE_SCRIPT = '''async () => {
  const result = await axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }
  });
  return {
    violations: result.violations.map(v => ({id: v.id, nodes: v.nodes.map(n => n.target)})),
    passes: result.passes.length,
    incomplete: result.incomplete.map(v => ({id: v.id, nodes: v.nodes.map(n => n.target)}))
  };
}'''


def main():
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument('--base-url', required=True)
    args.add_argument('--axe-path', type=Path, required=True)
    args.add_argument('--chromium', default='/usr/bin/chromium')
    args.add_argument('--report', type=Path, help='Optional JSON result path')
    config = args.parse_args()
    axe = config.axe_path.resolve(strict=True)
    base = config.base_url.rstrip('/') + '/'
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path=config.chromium, args=['--no-sandbox'])
        try:
            for width in WIDTHS:
                context = browser.new_context(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
                for name in PAGES:
                    page = context.new_page()
                    errors, failed_requests = [], []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.on('requestfailed', lambda request: failed_requests.append(request.url))
                    response = page.goto(urljoin(base, name), wait_until='networkidle')
                    assert response.status == 200 and page.title(), (width, name, 'HTTP / title')
                    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), (width, name, 'overflow')
                    assert not errors and not failed_requests, (width, name, errors, failed_requests)
                    page.add_script_tag(path=str(axe))
                    result = {'width': width, 'page': name, **page.evaluate(AXE_SCRIPT)}
                    results.append(result)
                    print(json.dumps(result, ensure_ascii=False), flush=True)
                    assert not result['violations'], result
                    page.keyboard.press('Tab')
                    assert page.locator('.skip-link').evaluate('(el) => el === document.activeElement'), (width, name, 'skip focus')
                    page.keyboard.press('Enter')
                    assert page.evaluate('location.hash === "#main" && document.activeElement.id === "main"'), (width, name, 'skip navigation / focus')
                    assert page.locator('html').evaluate('(el) => getComputedStyle(el).scrollBehavior') == 'auto'
                    for anchor in page.locator('.article-aside a').all():
                        target = anchor.get_attribute('href')
                        anchor.click()
                        top = page.locator(target).bounding_box()['y']
                        assert top >= page.locator('.site-header').bounding_box()['height'] - 1, (width, name, target)
                    page.close()
                context.close()
            context = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
            page = context.new_page()
            page.goto(base)
            page.get_by_role('link', name='개발 과정과 기술적 판단').first.click()
            assert page.get_by_role('heading', level=1).inner_text() == '포레스트링.'
            page.get_by_role('link', name='수업권과 데이터 정합성', exact=True).click()
            assert page.url.endswith('#integrity')
            page.get_by_role('link', name='Writing', exact=True).click()
            page.get_by_role('link', name='1인 앱 개발·출시 후, 2년간 운영하며 배운 것', exact=False).click()
            assert page.url.endswith('/journal-2years.html')
            context.close()
            print('PASS: 25 layouts, axe, skip link, TOC, reduced motion, and JavaScript-disabled navigation')
            print('Incomplete axe checks require manual review; this is not a full accessibility certification.')
        finally:
            browser.close()
            if config.report:
                config.report.write_text(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
