# GOLDSTREAM — 회사 홈페이지

영화·드라마 제작사 **골드스트림엔터테인먼트**(대표 김정환)의 홈페이지.
정적 사이트 + GitHub Pages 호스팅(goldstream.kr). 빌드 도구 없음.

- 라이브: https://goldstream.kr/
- 편집기: https://goldstream.kr/admin.html

## 2026-10 전면 리뉴얼

화이트톤, 화면 꽉 찬 첫 화면, 아주 큰 제목, 메뉴 네 개(ABOUT · WORK · PARTNERS · CONTACT).
참고: DIVISION(상단 로고/메뉴 배치), ICONOCLAST(번호 페이저 + 진행선, 자동 넘김).
LOCATION · CAMPAIGN · SPONSORSHIP · IMPACT · BRAND · SHOP 페이지는 삭제했고, 옛 주소는 홈으로 넘어갑니다.

## 구조

```
index.html      홈 (입자 인트로 1장 + 작품 슬라이드 8장, 자동 넘김)
works.html      작품 목록 (ALL / FILM / SERIES, 클릭하면 상세 팝업)
about.html      회사·대표 소개
partners.html   협력사
contact.html    연락처
admin.html      웹 편집기 (GitHub 토큰으로 content.json과 이미지 저장)
location.html 등  옛 주소 → index.html 리다이렉트 스텁
data/content.json   편집 가능한 모든 내용 (편집기가 쓰는 구조 그대로 유지)
css/style.css       사이트 스타일 (새로 작성)
css/admin.css       편집기 전용 스타일 (옛 style.css)
js/site.js          content.json → 화면
js/intro.js         홈 1번 슬라이드 입자 인트로
js/admin.js         편집기
assets/img/hero/    작품별 가로 스틸 (PC 슬라이드), 포스터는 works[].image
assets/fonts/       PretendardVariable.woff2 (사이트 글꼴은 이것 하나)
```

## 편집기 쓰는 법

1. `admin.html` 열기
2. 처음 한 번만 GitHub Fine-grained 토큰 등록 (Repository access → goldstream-site, Contents: Read and write)
3. 글·이미지 수정 후 **저장하기** → 약 1분 뒤 반영

편집기의 BUSINESS 칸(로케이션·캠페인·협찬)은 새 사이트에서 쓰지 않습니다. 저장해도 화면에 영향 없음.

## 캐시 무효화 (자동)

CSS/JS는 HTML에서 `?v=<내용해시>`로 참조되고, `scripts/stamp-assets.sh`가 커밋 직전 자동으로 갱신합니다.
새로 clone 하면 한 번만: `git config core.hooksPath .githooks`

## 로컬 미리보기

`.claude/launch.json`의 `static-preview`(포트 8420).
