# 진민경 포트폴리오

앱·웹 개발 포트폴리오 사이트입니다. 빌드 도구 없이 정적 HTML과 CSS만으로 만들었고 GitHub Pages로 배포합니다.

**사이트:** https://b-dandelion.github.io/portfolio/

## 담긴 내용

| 페이지 | 내용 |
| --- | --- |
| `index.html` | 소개, 주요 프로젝트, 개발 기록, 기술 스택 |
| `forestring.html` | 포레스트링 케이스 스터디. 2년째 운영 중인 학원 수업 관리 앱(Flutter · Supabase) |
| `inc.html` | INC 홈페이지 케이스 스터디. 권한 기반 자료실 웹사이트(Next.js · R2) |
| `journal-2years.html` | 1인 앱 개발·출시 후 2년간 운영 회고 |
| `writing.html` | 개발 기록 목록 |

## 구조

```text
.
├─ index.html, forestring.html, inc.html, journal-2years.html, writing.html
├─ styles.css            # 모든 페이지가 함께 쓰는 스타일
├─ favicon.svg
└─ assets/
   ├─ og.png             # 링크 공유 미리보기 이미지
   ├─ forestring/        # 학생 앱 현행 화면 (심사용 계정으로 촬영, 이름은 가명)
   ├─ inc/               # INC 웹사이트 현행 화면 (헤드리스 Chrome 2배 해상도 캡처)
   └─ archive/           # 이전 버전 앱 화면 (사이트에서는 사용하지 않음)
```

## 로컬에서 보기

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## 수치 출처

케이스 스터디의 운영 지표는 2026-10-20 기준 운영 DB에서 집계했고, 앱 심사용·테스트 계정은 제외했습니다. INC 지표 중 자료 수는 2026-10-20 운영 DB, API·화면·커밋 수는 2026-10-22 저장소 main, 응답 시간은 공개 사이트에 직접 요청해 잰 값입니다.
