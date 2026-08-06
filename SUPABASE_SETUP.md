# Supabase 설정 (한 번만)

관리자 페이지에서 올린 이미지·영상을 클라우드에 저장하고, QR로 접속한 사람들도
볼 수 있게 하려면 Supabase 프로젝트가 필요합니다. 무료 요금제로 충분합니다.

---

## 1. 프로젝트 만들기

1. https://supabase.com 가입 → **New project** 생성 (지역은 가까운 곳, 예: Northeast Asia).
2. 생성되면 **Project Settings → API** 에서 두 값을 복사:
   - **Project URL**
   - **anon public** key

이 두 값을 `site/config.js` 에 붙여넣습니다:

```js
window.SUPABASE_URL = "https://xxxx.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

> anon 키는 공개돼도 안전합니다(원래 브라우저에 노출되는 값). 실제 쓰기 권한은
> 아래 RLS 정책이 "로그인한 관리자"에게만 허용합니다.

---

## 2. 데이터베이스 테이블 + 정책

**SQL Editor** 에 아래를 붙여넣고 **Run**:

```sql
-- 도판 ↔ 영상 목록
create table if not exists public.targets (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  image_path  text not null,
  video_path  text not null,
  aspect      real not null default 1.4,   -- 이미지 높이/너비 (영상 비율)
  mind_index  int,                          -- 발행 시 targets.mind 안에서의 순번
  created_at  timestamptz not null default now()
);

alter table public.targets enable row level security;

-- 누구나 읽기(공개 뷰어), 로그인한 관리자만 쓰기
create policy "targets read"   on public.targets for select using (true);
create policy "targets insert" on public.targets for insert to authenticated with check (true);
create policy "targets update" on public.targets for update to authenticated using (true);
create policy "targets delete" on public.targets for delete to authenticated using (true);
```

---

## 3. 스토리지 버킷 + 정책

1. **Storage → New bucket** → 이름 `media`, **Public bucket** 체크 → 생성.
2. 다시 **SQL Editor** 에서 아래 실행 (파일도 공개 읽기 / 관리자만 쓰기):

```sql
create policy "media read"   on storage.objects for select using (bucket_id = 'media');
create policy "media insert" on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "media update" on storage.objects for update to authenticated using (bucket_id = 'media');
create policy "media delete" on storage.objects for delete to authenticated using (bucket_id = 'media');
```

---

## 4. 관리자 계정 만들기

1. **Authentication → Users → Add user** → 본인 이메일/비밀번호로 생성
   (Auto Confirm User 켜기).
2. 남이 가입 못 하게: **Authentication → Providers → Email** 에서
   **Allow new users to sign up** 을 끕니다(관리자만 있으면 되므로).

이 이메일/비밀번호로 `admin.html` 에서 로그인합니다.

---

## 5. 끝 — 사용 흐름

- **관리자**: `.../admin.html` 접속 → 로그인 → 이미지+영상 추가/삭제 → **발행** 클릭
  (발행이 이미지들로 인식 데이터를 만들어 올립니다. 추가·삭제 후 꼭 한 번 눌러야 반영).
- **일반 사용자**: `.../` (또는 `index.html`) 접속 → **카메라 시작** →
  등록된 도판을 비추면 영상이 재생됩니다. 이 주소를 QR로 만들어 배포하세요.

> 참고: 카메라는 HTTPS에서만 켜집니다. GitHub Pages(`https://...github.io/...`)는
> HTTPS라 문제없습니다. 로컬 `npm run serve` 는 http라 카메라 테스트가 안 되니
> 배포본에서 확인하세요.
