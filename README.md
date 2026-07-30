# HelloWorld 미니홈피

싸이월드 스타일 미니홈피. 원래 **Spring MVC + JSP + MyBatis + MySQL / Maven + Tomcat** 으로 만들었던 것을
**Next.js (App Router) + TypeScript** 로 옮긴 버전입니다.

디자인(CSS·이미지·사운드)과 기능은 그대로 두고 실행 구조만 바꿨습니다.

```bash
npm install
npm run dev      # http://localhost:3000
```

DB 설정이 필요 없습니다. 붙여둔 시드 데이터로 바로 로그인해서 전체 기능을 둘러볼 수 있습니다.

### 체험 계정

로그인 화면의 **체험 계정으로 로그인** 버튼을 누르면 바로 들어갑니다.

| 이메일 | 비밀번호 | 닉네임 | 비고 |
| --- | --- | --- | --- |
| `demo@gmail.com` | `1234` | 제인 | 체험 계정. 공지사항 작성 권한 있음 |
| `minho@gmail.com` | `1234` | 민호 | 제인과 일촌 |
| `soyul@gmail.com` | `1234` | 소율 | 제인에게 일촌 신청 대기중 |
| `dain@gmail.com` | `1234` | 다인 | 민호와 일촌 |

미니홈피는 메인 화면에서 **내 미니홈피** 버튼을 누르면 새 창으로 열립니다.

---

## 무엇이 바뀌었나

| 예전 | 지금 |
| --- | --- |
| Maven + Tomcat (`pom.xml`, war 배포) | npm + Next.js (`npm run dev` / `build` / `start`) |
| JSP 53개 (`WEB-INF/views`) | React Server/Client Component (`app/`, `components/`) |
| Spring `@Controller` | App Router 페이지 + Route Handler |
| MyBatis 매퍼 XML 17개 | `lib/db/repo.ts` 의 도메인 함수 |
| MySQL (AWS RDS 직결) | 인메모리 시드(기본) / Supabase(선택) |
| `HttpSession` + 서버 세션 | 서명된 httpOnly 쿠키 (`jose` JWT) |
| jQuery + `$.ajax` | `fetch` + React 상태 |
| ajaxTab.js 로 `.bookcover` 갈아끼우기 | Next.js 클라이언트 라우팅 + 공용 레이아웃 |
| 아임포트 실결제 | 목(mock) 결제 |

**그대로 둔 것**: `public/resources` 아래 CSS·이미지·BGM·폰트 전부, 화면 마크업과 클래스 이름,
SmartEditor2 에디터, jQuery UI 달력(다이어리), 그리고 `/mnHome/mainView/{닉네임}` 같은 URL.

비밀번호 해시도 구 `SHA256.java` 와 동일한 방식(SHA-256 소문자 hex)이라 예전 DB 데이터를 그대로 붙일 수 있습니다.

---

## 폴더 구조

```
app/
  page.tsx                  메인 (구 home.jsp)
  idx/                      /index/... 로 노출되는 회원 관련 화면·API   ※ 아래 설명 참고
  notice/                   공지사항
  store/                    상점 (미니미·스킨·메뉴·도토리·BGM)
  mnHome/
    (frame)/                미니홈피 본체 — 공용 레이아웃(스킨/BGM/하단바) 안에서 렌더링
    (popup)/                새 창으로 뜨는 화면 (프로필 수정, 미니룸 편집 …)
    <이름>/route.ts         미니홈피 AJAX 엔드포인트
  api/mnHome/chrome/        미니홈피 바깥 프레임용 데이터
components/                 화면 컴포넌트 (index / notice / store / minihome)
lib/
  db/
    types.ts                테이블 타입 (매퍼 XML 기준으로 재구성)
    seed.ts                 시드 데이터 (단일 출처)
    store.ts                저장소 어댑터 (메모리 / Supabase)
    repo.ts                 구 DAO·Service 에 대응하는 도메인 함수
    format.ts               MySQL DATE_FORMAT 재현
  session.ts                쿠키 세션 / 방문 이력 / 장바구니
  sanitize.ts               사용자 작성 HTML 정리 (XSS 방지)
  upload.ts                 이미지 업로드 저장
  minihome.ts               미니홈피 공통 조회 (서버 전용)
  minihome-view.ts          색상 헬퍼 등 (클라이언트 겸용)
public/resources/           구 webapp/resources 를 그대로 복사 (135MB)
supabase/
  schema.sql                Postgres 스키마
  seed.sql                  시드 (seed.ts 에서 자동 생성)
```

### `app/idx` 가 `/index` 로 보이는 이유

App Router 에서 세그먼트 이름을 그대로 `index` 로 두면 루트 페이지의 빌드 산출물과 이름이 부딪혀
프리렌더가 깨집니다(`clientReferenceManifest` invariant). 그래서 폴더는 `app/idx` 로 두고
`next.config.mjs` 의 rewrite 로 `/index/:path*` 를 연결했습니다. **브라우저에 보이는 URL 은 예전 그대로**입니다.

---

## 데이터베이스

지금은 **DB 를 붙이지 않은 상태**가 기본값입니다. `lib/db/seed.ts` 의 시드가 메모리에 올라가고,
글쓰기·구매·설정 변경이 전부 정상 동작합니다. 다만 **서버를 재시작하면 초기화**됩니다.

### Supabase 붙이기

1. Supabase 프로젝트 생성
2. SQL Editor 에서 `supabase/schema.sql` 실행 → 이어서 `supabase/seed.sql` 실행
   - 실행할 때 물어보면 **"Run without RLS"** 를 고르세요. `schema.sql` 이 RLS 를 직접 켭니다 (아래 RLS 항목 참고)
   - `seed.sql` 에는 테스트 계정뿐 아니라 **상점 상품과 BGM 목록**도 들어있습니다. 건너뛰면 상점이 빕니다.
3. Project Settings → API 에서 `Project URL` 과 **`service_role`** 키 복사 (`anon` 아님)
4. `.env.example` 을 `.env.local` 로 복사하고 채우기

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

두 값이 모두 설정되면 `lib/db/store.ts` 가 자동으로 Supabase 어댑터로 전환합니다.
도메인 로직(`repo.ts`)은 손댈 필요가 없습니다.

시드를 바꾸고 싶으면 `lib/db/seed.ts` 를 고친 뒤 `npm run seed:sql` 로 `supabase/seed.sql` 을 다시 뽑습니다.

### RLS

앱이 서버에서 `service_role` 키로만 붙는데, 이 키는 RLS 를 무시합니다.
따라서 **RLS 를 켜도 앱은 그대로 동작하고**, 정책을 하나도 안 만든 상태가 곧
"service_role 외 전부 차단" 이라 지금 원하는 그림입니다.
(RLS 를 끄면 공개용 `anon` 키만 있으면 누구나 테이블을 통째로 읽고 쓸 수 있습니다)

`schema.sql` 마지막에 24개 테이블 전부 `enable row level security` 를 넣어 뒀습니다.
그래서 SQL Editor 가 물어볼 때는 **"Run without RLS"** 를 고르면 됩니다.

> 에디터의 "Run and enable RLS" 를 고르면 `ALTER TABLE user ENABLE ROW LEVEL SECURITY;` 가
> 자동으로 붙는데, 따옴표가 없어서 예약어인 `user` 에서 `syntax error at or near "user"` 가 납니다.

> 컬럼명은 구 코드와 1:1 로 맞추려고 camelCase 를 큰따옴표로 감싸 그대로 유지했습니다.
>
> 참고: 저장소에 있던 `Table_Script` 는 매퍼보다 오래된 버전이라 `friends`, `friendCMT`, `bgm`,
> `userBgm`, `miniroom*`, `miniHomeTitle` 등이 빠져 있었습니다. 스키마는 매퍼 XML 의 실제 쿼리를
> 기준으로 재구성했습니다.

---

## 알아둘 점

- **결제**: 도토리 충전은 목 결제입니다. 화면과 흐름(상품 선택 → 결제 수단 → 충전 완료)은 그대로 두고
  PG 호출만 건너뜁니다. 실제 아임포트를 다시 붙이려면 `components/store/OrderClient.tsx` 의
  `requestPay()` 안에서 SDK 를 호출하고 성공 콜백에서 폼을 제출하면 됩니다.
- **BGM**: 미니홈피 탭을 옮겨도 음악이 끊기지 않습니다. 예전에 ajaxTab.js 가 `.bookcover` 안쪽만
  갈아끼우던 것을, 지금은 `app/mnHome/(frame)/layout.tsx` 가 바깥 프레임을 유지하는 방식으로 재현했습니다.
  다만 브라우저 자동재생 정책 때문에 **첫 재생은 ▶ 버튼을 한 번 눌러야** 시작될 수 있습니다.
- **업로드**: 화면과 DB 는 예전 그대로 파일명만 다루고(`/resources/images/download/{파일명}`),
  실제 저장 위치만 환경에 따라 달라집니다. Supabase 가 설정돼 있으면 Storage 의 `uploads` 버킷,
  아니면 예전처럼 `public/resources/images/download/` 폴더입니다. 자세한 건 아래 배포 항목 참고.
- **SmartEditor2 사진첨부**: `/smarteditorMultiImageUpload` 엔드포인트는 구 컨트롤러 그대로 살려 뒀지만,
  같이 들어있는 SE2 샘플 업로더가 PHP 파일을 가리키고 있어 예전에도 연결돼 있지 않았습니다.
  이미지 첨부는 사진첩 쪽을 쓰세요.
- **다이어리 달력**: 구 화면 그대로 jQuery UI datepicker 를 씁니다(CDN). 스크립트를 못 불러오면
  기본 `<input type="date">` 로 자동 대체됩니다.
- **관리자**: 공지 작성/수정/삭제 권한은 구 `NoticeController` 와 동일하게 닉네임 `제인`, `관리자` 에게만
  있습니다. (`lib/db/repo.ts` 의 `ADMIN_NICKNAMES`)

---

## 이전하면서 손본 것

원본을 그대로 옮기기만 하면 문제가 되는 부분들을 함께 정리했습니다.

- **비밀번호 찾기의 계정 탈취 구멍 차단** — 구 `MemberController.findPw` 는 폼으로 받은 이메일을
  그대로 믿고 비밀번호를 바꿨습니다. 본인확인 단계와 변경 단계가 묶여 있지 않아서,
  `POST /index/member/findPw` 한 번이면 **아무 계정이나 탈취**할 수 있었습니다.
  이제 본인확인을 통과해야만 5분짜리 재설정 티켓(httpOnly 쿠키)이 발급되고,
  변경 대상 계정은 그 티켓에서만 읽습니다. 티켓은 한 번 쓰면 폐기됩니다.
- **개인정보를 URL 에서 제거** — 아이디 찾기·비밀번호 찾기 결과가 이메일을 쿼리로 넘기고 있었습니다.
  (`?findId=someone@gmail.com` — 주소창·브라우저 기록·서버 로그·리퍼러에 그대로 남습니다)
  짧게 사는 httpOnly 쿠키로 옮겼습니다.
- **XSS 차단** — 게시판·다이어리·공지 본문은 SmartEditor2 가 만든 HTML 을 그대로 렌더링합니다.
  구 코드는 검사 없이 저장·출력해서 남의 미니홈피에 스크립트를 심을 수 있었습니다.
  이제 저장 시점에 `lib/sanitize.ts` 가 허용 태그만 남깁니다.
  (`<script>` 는 통째로 제거, `onerror` 같은 이벤트 속성도 제거, 서식·이미지·링크는 유지)
  방명록·자기소개처럼 평문으로 받는 값도 태그를 제거합니다.
- **권한을 서버에서도 확인** — 구 컨트롤러들은 "수정/삭제 버튼을 안 보여주는" 방식으로만 막았습니다.
  본인 글만 수정·삭제, 일촌만 일촌평 작성, 관리자만 공지 작성 등을 라우트 핸들러에서도 검사합니다.
- **`SESSION_SECRET` 강제** — 프로덕션(`npm run start`)에서 이 값이 없으면 로그인이 되지 않습니다.
  개발용 기본 키로 서명하면 누구나 로그인 쿠키를 위조할 수 있어서입니다.
- **로그인 게이트를 미들웨어로** — 미니홈피 화면은 `middleware.ts` 가 렌더링 전에 세션을 확인합니다.
  페이지 안에서 `redirect()` 만 부르면 `loading.tsx` 때문에 응답이 스트리밍으로 나가기 시작해
  서버가 307 을 못 내고, JS 가 꺼진 클라이언트에는 빈 껍데기가 노출됐습니다.
- **쿼리 범위 축소** — 일촌 관계·댓글·회원 조회가 테이블을 통째로 읽던 부분을 조건절로 내렸습니다.
  (`Store.selectOr` / `Store.selectIn`)
- **에러 화면** — 없는 주소나 렌더링 실패 시 Next.js 기본 화면 대신 프로젝트 디자인(`error.css`)을 씁니다.
  (`app/not-found.tsx`, `app/error.tsx`)
- **탭 전환 로딩** — 미니홈피 탭을 옮기는 동안 책 안쪽에 로딩 이미지가 뜹니다. 바깥 프레임과 BGM 은 그대로입니다.
- **문서 메타데이터** — 화면마다 `<title>` 이 붙고(`상점 · 미니미 · 헬로월드`), 모바일 축소를 막는 viewport 를 넣었습니다.

### 포털 화면 리디자인

미니홈피 안쪽(책 프레임 · 미니룸 · 메뉴탭 · BGM 플레이어)은 이 서비스의 정체성이라 **그대로 뒀고**,
바깥 껍데기(로그인 · 상점 · 공지 · 지도)만 정리했습니다.

- 화면을 꽉 채우던 `width: 90%` 를 `max-width: 1120px` 중앙 정렬로 변경
- 로고가 컨테이너의 50% 를 차지하던 것을 고정 크기로
- 주황색 단색 띠(인사말 바 · 공지 헤더 · 상점 헤더)를 걷어내고 타이포 중심으로 정리
- 카드/입력/버튼에 일관된 라운드·그림자·포커스 링 적용 (CSS 변수로 토큰화)
- 상품 목록을 고정 퍼센트 너비에서 반응형 그리드로, 장바구니는 sticky 로
- 인사담당자용 테스트 계정 모달 삭제 → 로그인 카드 안의 **체험 계정으로 로그인** 버튼으로 대체
- 900px / 640px 브레이크포인트 추가

`@keyframes fade` 블록이 닫히지 않아 그 아래 규칙 10여 개(`.popup`, `.bottom-fix`, `.confirm-group` 등)가
통째로 무시되고 있던 것도 함께 고쳤습니다.

**회원가입 · 아이디/비밀번호 찾기**도 같은 톤으로 정리했습니다. 입력칸에 포커스 링을 주고,
중복확인 버튼·약관 상자·성별 선택을 카드 안으로 넣었습니다.
(구 화면은 클릭할 때마다 라벨이 주황색 굵게 변했는데, 포커스 표시로 대체했습니다)

**미니홈피**는 책 프레임 · 미니룸 · 메뉴탭의 개념을 그대로 두고 마감과 배치를 다듬었습니다.

- **BGM 플레이어를 우측 상단으로** — 예전에는 책 오른쪽 중앙에 회색 상자로 붙어 있어서
  책을 왼쪽으로 밀어 두는 보정값(`main-frame left:53%` / `bookcover left:40%`)이 필요했습니다.
  플레이어를 위로 올리고 가운데 정렬로 되돌리면서 **책을 960×510 → 1080×600 으로 키웠습니다.**
  플레이어도 반투명 알약 모양으로 다시 만들고 재생/일시정지를 한 버튼으로 합쳤습니다.
- 링크에 마우스를 올리면 글자가 굵어지며 레이아웃이 밀리던 것 → 색 변화로
- 메뉴탭의 검은 1px 테두리 → 그림자 + 살짝 밀려나는 hover
- 하단 바: 단색 회색 → 그라데이션, 버튼에 hover 영역
- 화면마다 제각각이던 버튼·체크박스·입력칸·표를 `frame.css` 의 공통 컨트롤 한 벌로 통일
  (BGM 목록의 주황 hover, 10px 동그란 체크박스 같은 것들)
- 스크롤바를 얇게, 무효 CSS(`border: 2px solid color=navy`) 수정

### 알림창 통일

`window.alert` · `window.confirm` 125곳을 프로젝트 디자인의 모달로 바꿨습니다(`lib/ui/dialog.tsx`).
Provider 없이 아무 클라이언트 컴포넌트에서나 `showAlert()` / `showConfirm()` 로 부를 수 있고,
삭제처럼 되돌릴 수 없는 동작은 빨간 버튼(`{ danger: true }`)으로 구분합니다.

팝업 창의 결과 화면(프로필 저장 · 미니미 변경 · 미니룸 저장 · 구매 완료)도 같은 모양으로 합쳤습니다.
업로드 성공 화면에 걸려 있던 **3초짜리 인위적인 로딩 지연**도 제거했습니다.

### 체감 속도

미니홈피 탭을 옮길 때마다 로딩 이미지가 깜빡여서 오히려 느려 보였습니다.
`loading.tsx` 를 없애고, 탭에 마우스를 올리면 미리 받아 두도록(`router.prefetch`) 바꿨습니다.

---

## Vercel 배포

**Root Directory** 는 비워 두면 됩니다(`./`). `package.json` · `app/` · `next.config.mjs` 가
저장소 최상위에 있어 Next.js 로 자동 인식됩니다.

### 환경변수

| 이름 | 필수 | 설명 |
| --- | --- | --- |
| `SESSION_SECRET` | 필수 | 로그인 쿠키 서명 키. **없으면 프로덕션에서 로그인이 되지 않습니다** |
| `SUPABASE_URL` | 필수 | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | 필수 | service_role 키 (`anon` 아님) |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 선택 | 비우면 코드의 기본 키를 씁니다 |

Supabase 두 값도 사실상 필수입니다. 없으면 인메모리 시드로 도는데, 서버리스는 요청마다
인스턴스가 달라서 방금 쓴 글이 다음 요청에 사라집니다.

`NEXT_PUBLIC_SUPABASE_URL` 도 폴백으로 받지만, 이름 때문에 브라우저로 새어나갈 여지가 있으니
**`SUPABASE_URL`** 을 쓰세요. service_role 키에는 절대 `NEXT_PUBLIC_` 을 붙이면 안 됩니다.

### 이미지 업로드

Vercel 은 파일시스템이 읽기 전용이라 예전 방식(`public/` 폴더에 쓰기)으로는 업로드가 동작하지 않습니다.
그래서 Supabase 가 설정돼 있으면 **Storage 의 `uploads` 버킷**에 저장합니다.
버킷은 첫 업로드 때 공개 버킷으로 자동 생성되므로 따로 만들 필요가 없습니다.

읽는 쪽은 화면 코드를 하나도 바꾸지 않았습니다.

- 저장소에 함께 들어있는 옛날 사진 → `public/` 정적 파일로 그대로 응답
- 새로 올린 사진 → 정적 파일에 없으니 `app/resources/images/download/[filename]/route.ts` 로 내려와
  Storage 공개 URL 로 넘겨줍니다

적용 대상은 사진첩 · 프로필 사진 · SmartEditor 이미지 첨부 세 곳입니다.

### 그 외

- `public/` 이 139MB(BGM mp3 61MB)라 배포가 다소 느립니다. 용량이 문제가 되면 mp3 를
  Storage 로 옮기고 `bgm.contentPath` 를 그 URL 로 바꾸면 됩니다.
- BGM 자동재생은 브라우저 정책상 첫 재생만 사용자가 ▶ 를 눌러야 합니다.
- 미니홈피는 `window.open` 으로 열리므로 팝업 차단에 걸릴 수 있습니다. (구 동작 그대로)

---

## 스크립트

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run seed:sql` | `lib/db/seed.ts` → `supabase/seed.sql` 생성 |

> `npm run start` 는 프로덕션 모드라 `.env.local` 에 `SESSION_SECRET` 이 있어야 뜹니다.
> 개발 중(`npm run dev`)에는 없어도 됩니다.
