# 진민경 · 앱·웹 개발 포트폴리오

Flutter 모바일 앱과 Next.js 웹 서비스의 설계·개발·배포·운영 경험을 소개하는 정적 웹사이트입니다. 별도 패키지 설치나 빌드 없이 GitHub Pages의 `/portfolio/` 경로에서 동작합니다.

- 주요 프로젝트: **포레스트링**, **INC 홈페이지**
- 추가 프로젝트: COURTIFY, DCC
- 개발 기록: 포레스트링 2년 운영 회고

## 로컬 실행

```bash
cd /path/to/portfolio
python3 -m http.server 8000 --bind 127.0.0.1
```

브라우저에서 로컬 서버를 열면 됩니다. 데이터베이스, API 키, 환경 변수는 필요하지 않습니다. 시스템 글꼴을 사용하므로 외부 폰트 요청도 없습니다.

## 구조

```text
index.html             # 소개 · 주요/추가 프로젝트 · 최근 글 · About
forestring.html        # 포레스트링 사례: 역할, DB 이전, 수업권·권한, 운영
inc.html               # INC 홈페이지 사례: 기능, 저장 구조, 실패 처리, 이관
writing.html           # 개발 기록 목록
journal-2years.html    # 기존 운영 회고 본문
styles.css             # 디자인 토큰 · 공통 레이아웃 · 반응형 · 인쇄
assets/                # 파비콘과 기존 이미지 (구버전 앱 화면은 미노출)
tools/check_site.py    # 표준 라이브러리 기반 HTTP·링크·문서 구조 검사
tools/check_browser.py # 선택: Playwright + axe-core 브라우저 검사
```

의도적으로 정적 HTML/CSS를 유지합니다. 메뉴와 푸터는 각 페이지의 HTML에 있으며, 공통 변경 시 다섯 페이지를 함께 수정합니다. JavaScript가 꺼져 있어도 탐색·목차·모든 콘텐츠를 이용할 수 있습니다.

## 검사

```bash
python3 tools/check_site.py
python3 tools/check_site.py --external
```

검사 도구는 임시 서버를 열어 실제 `/portfolio/` 하위 경로에서 페이지·리소스·앵커를 요청합니다. 언어·제목·본문 건너뛰기 대상·이미지 alt·중복 ID도 검사합니다. `--external`은 외부 HTTP 링크까지 검사하며 네트워크·인증 문제도 실패로 보고합니다. 외부 서비스 기능이나 로그인 이후 동작까지 보증하는 검사는 아닙니다.

추가 브라우저 검사는 로컬 서버를 실행한 상태에서 수행합니다. Playwright와 Chromium, axe-core가 필요하며 사이트 자체의 실행 의존성은 아닙니다. 현재 클라우드 환경에는 Python Playwright와 `/usr/bin/chromium`이 설치되어 있습니다. axe-core는 체크아웃 밖에 설치합니다.

```bash
npm install --prefix /tmp/portfolio-audit --ignore-scripts --no-audit --no-fund axe-core@4.10.3
python3 tools/check_browser.py --base-url http://127.0.0.1:8000/ \
  --axe-path /tmp/portfolio-audit/node_modules/axe-core/axe.min.js
```

[검증 결과와 한계](docs/VALIDATION.md), [설명에 사용한 소스 근거](docs/CONTENT-SOURCES.md), [필요한 최신 화면 목록](docs/SCREENSHOTS.md)을 참고하세요.

## 개발 기록 추가

1. `journal-2years.html`을 복사해 의미 있는 파일명으로 새 글을 만듭니다.
2. 문서 제목·설명·`h1`·작성일·주제를 바꾸고, 본문 섹션마다 고유 `id`를 부여합니다.
3. `.article-aside` 목차 링크를 새 섹션에 맞춥니다. 본문은 `.article-content.prose`를 유지합니다.
4. `writing.html`의 `.journal-list`에 `.journal-entry`를 추가합니다. 발행일은 `<time datetime="YYYY-MM-DD">`로 작성합니다.
5. 메인의 `.latest-note`도 최신 글로 갱신합니다. 링크 검사와 모바일 화면 검사를 실행합니다.

새 이미지는 의미 있는 파일명·대체 텍스트·고유 크기(`width`, `height`)를 지정하고 `<figure>`와 `<figcaption>`으로 설명 옆에 배치합니다. 본문 중간 이미지는 `loading="lazy"`를 사용합니다. 운영 앱 화면은 버전·촬영일과 개인정보 비식별화를 확인한 후 추가합니다.

## 디자인 기준

- 회백색 `#FAFCFD`, 본문 `#20343D`, Ice Blue `#C7EEFA`, 링크 `#145E79`
- 시스템 글꼴과 명확한 제목 위계, 본문 최대 700–720px
- 주요 프로젝트는 역할·기능·판단·결과 순서로 설명하고, 작은 프로젝트는 행으로 표시
- 키보드 포커스, 본문 건너뛰기, 모바일 목차, 감소된 모션 설정, 인쇄 스타일 지원
- [Emil Kowalski](https://emilkowal.ski/)의 간결한 정보 구성, [Brittany Chiang](https://brittanychiang.com/)의 탐색 구조, [Lee Robinson](https://leerob.com/)의 글 중심 목록을 참고하되 레이아웃이나 자산을 복제하지 않음

이 변경은 작업 브랜치와 PR로 검토합니다. 검토 전 `main` 병합이나 공개 사이트 배포를 실행하지 않습니다.
