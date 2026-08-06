# Web Viewer — 논문 AR 뷰어 (아티바이브 대체)

논문의 도판을 핸드폰 카메라로 비추면 대응하는 영상이 그 위에 재생되는 웹 AR.
앱 설치 없이 브라우저에서 작동한다 (MindAR.js 기반, 전부 무료·오픈소스).

두 개의 화면으로 나뉜다:

- **공개 뷰어** (`index.html`) — 일반 사용자가 QR·링크로 접속. 카메라를 켜고
  등록된 도판을 비추면 영상이 재생된다.
- **관리자 페이지** (`admin.html`) — 운영자가 로그인해서 이미지+영상을 올리고
  짝을 지어 저장·발행한다. **더 이상 코드를 고치거나 빌드할 필요가 없다.**

콘텐츠(이미지·영상)는 코드가 아니라 **Supabase 클라우드**에 저장되므로,
관리자 페이지에서 올리면 QR로 접속한 누구에게나 즉시 반영된다.

## 처음 한 번: 설정

클라우드 저장소(Supabase) 설정이 필요하다 — [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 참고.
요약하면:

1. Supabase 무료 프로젝트 생성 → `site/config.js` 에 URL·anon 키 입력
2. 안내된 SQL로 테이블·저장소 버킷·권한 생성
3. 관리자 계정(이메일/비밀번호) 하나 생성

## 평소 사용법

### 콘텐츠 등록 (관리자)
1. 배포 주소의 `/admin.html` 로 접속 → 로그인
2. **도판 추가**: 인식할 이미지 + 재생할 영상을 골라 업로드
3. **발행하기** 클릭 — 브라우저가 이미지들로 인식 데이터(`targets.mind`)를
   만들어 클라우드에 올린다. (추가·삭제한 뒤에는 꼭 한 번 눌러야 반영)

### 사용 (일반 관람자)
- 배포 주소로 접속 → **카메라 시작** → 도판을 비추면 영상 재생.
- 이 주소를 QR코드로 만들어 논문에 싣는다.

## 로컬 미리보기
```bash
npm run serve   # → http://localhost:8642
```
※ 카메라는 HTTPS에서만 켜지므로, 실제 카메라 테스트는 배포본(HTTPS)에서 한다.

## 배포
배포 주소: **https://junyyyong.github.io/illeong/** (GitHub Pages, 저장소 [Junyyyong/illeong](https://github.com/Junyyyong/illeong))

```bash
git add -A && git commit -m "..."
git push          # main 브랜치(소스) 갱신
npm run deploy    # site/ → gh-pages 브랜치로 발행
```

> 콘텐츠(이미지·영상)를 바꿀 때는 재배포가 필요 없다 — 관리자 페이지에서
> 올리면 끝. 재배포는 코드(뷰어/관리자 화면 자체)를 바꿨을 때만 한다.

## 구조
```
site/
  index.html    공개 뷰어 (카메라 + AR)
  admin.html    관리자 페이지 (업로드·발행)
  config.js     Supabase 접속 정보 (본인 값 입력)
  vendor/       MindAR·A-Frame 라이브러리 (컴파일러 포함)
tools/serve.mjs 로컬 미리보기 서버
SUPABASE_SETUP.md  클라우드 최초 설정 안내
```
콘텐츠(도판 이미지·영상, 인식 데이터 `targets.mind`)는 저장소가 아니라
Supabase 클라우드에 저장된다.

## 참고
- 이미지가 많아지면(15장 이상) 인식·컴파일 속도가 느려질 수 있다.
- 영상은 H.264 mp4 권장. 첫 화면의 "카메라 시작" 터치로 소리 재생 제한이 풀린다.
