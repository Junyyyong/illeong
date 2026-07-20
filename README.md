# 일렁 — 논문 AR 뷰어 (아티바이브 대체)

논문의 도판을 핸드폰 카메라로 비추면 대응하는 영상이 그 위에 재생되는 웹 AR.
앱 설치 없이 브라우저에서 작동한다 (MindAR.js 기반, 전부 무료·오픈소스).

제목·안내 문구는 `site.config.json`에서 바꾼다 (수정 후 `npm run build`).

## 사용법

### 1. 재료 넣기
- `targets/` — 논문에 인쇄될 도판 이미지 (`01.png`, `02.png` …)
- `videos/` — 대응 영상 (`01.mp4`, `02.mp4` …) ← **파일명이 같아야 짝으로 묶임**

### 2. 빌드
```bash
npm run build
```
- `site/` 폴더에 배포용 사이트가 생성된다.
- 타깃 이미지가 바뀌었으면 인식 데이터(`site/targets.mind`)도 자동 재컴파일된다.

### 3. 로컬 미리보기
```bash
npm run serve   # → http://localhost:8642
```
※ 핸드폰 카메라 테스트는 HTTPS가 필요하므로 배포 후에 한다.

### 4. 배포
`site/` 폴더를 GitHub Pages나 Vercel 등 정적 호스팅에 올리면 끝.
배포 URL을 QR코드로 만들어 논문에 싣는다.

## 구조
```
targets/   도판 이미지 (인식 타깃)
videos/    대응 영상
tools/     빌드 스크립트 (build.mjs → compile.mjs 호출)
site/      빌드 결과물 = 배포하는 것 (index.html, targets.mind, vendor/, videos/)
```

## 참고
- 이미지가 많아지면(15장 이상) 인식 속도가 느려질 수 있다 → 장별로 그룹을 나누는 개편 필요.
- 영상은 H.264 mp4 권장. 소리가 있어도 첫 화면의 "카메라 시작" 버튼 터치로 재생 제한이 풀린다.
