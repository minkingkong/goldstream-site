# GOLDSTREAM — 포트폴리오 사이트

영화 제작자 **김정환**이 이끄는 제작사 GOLDSTREAM의 포트폴리오.
정적 사이트 + GitHub Pages 호스팅. 빌드 도구 없음.

- 라이브: https://minkingkong.github.io/goldstream-site/
- 편집기: https://minkingkong.github.io/goldstream-site/admin.html

## 구조

```
index.html      홈 (보라 히어로 + 대표 작품)
works.html      작품 목록 (필터 · Gallery/List · 상세 모달)
about.html      김정환 소개
contact.html    연락처
admin.html      웹 편집기 (텍스트 · 이미지 · 영상)
data/content.json   모든 편집 가능한 내용
css/style.css       스타일 (Pretendard Variable 자체 호스팅)
js/site.js          content.json → 화면 렌더링
js/admin.js         GitHub API 로 content.json / 이미지 저장
assets/fonts/       PretendardVariable.woff2
assets/img/         작품 이미지 (편집기에서 업로드되는 위치)
```

## 사이트 편집 방법

1. `admin.html` 열기
2. **처음 한 번만** GitHub Fine-grained Personal Access Token 등록
   - 생성: https://github.com/settings/personal-access-tokens/new
   - Repository access → Only select repositories → `goldstream-site`
   - Permissions → **Contents: Read and write**
   - 만료일은 원하는 대로 (만료되면 새로 발급해 다시 등록)
   - 생성된 `github_pat_...` 를 편집기 상단에 붙여넣고 **토큰 저장**
   - 토큰은 그 브라우저에만 저장됨 (localStorage). 공용 PC에서는 등록 금지.
3. 텍스트 수정, 이미지 업로드(파일 선택), 영상은 YouTube/Vimeo 링크 입력
4. **저장하기** → GitHub에 커밋 → 약 1분 뒤 사이트 반영

### 영상 첨부

- **권장**: YouTube / Vimeo 링크를 작품의 "영상 URL"에 붙여넣기 → 자동 임베드
- 직접 업로드: `.mp4` / `.webm` 파일도 가능하지만 40MB 이하만. GitHub Pages는
  영상 호스팅에 적합하지 않으므로 긴 영상은 링크를 쓰세요.

## 폰트

imaginus 와 동일하게 **Pretendard Variable** 사용. `assets/fonts/PretendardVariable.woff2`
파일을 저장소에 포함해 자체 호스팅 (CDN 의존 없음).
