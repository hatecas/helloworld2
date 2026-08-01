# CHANGELOG

미니홈피(helloworld2) 개선 작업 정리.

## ⚠️ 배포 시 Supabase에 실행해야 하는 SQL (한 번만)

새 기능들은 아래 스키마가 있어야 동작합니다. **Supabase → SQL Editor**에서 실행하세요.

```sql
-- 방명록 주인장 답글
alter table "visit"
  add column if not exists "reply" text,
  add column if not exists "reply_date" timestamptz;

-- 게시판 댓글 답글(대댓글)
alter table "boardCMT"
  add column if not exists "parentSeq" integer references "boardCMT"("seq") on delete cascade;

-- 다이어리 댓글 답글(대댓글)
alter table "diaryCMT"
  add column if not exists "parentSeq" integer references "diaryCMT"("seq") on delete cascade;

-- 알림 읽음 기록 (쿠키 → DB). 이게 있어야 다른 PC 에서도 읽음이 유지된다.
create table if not exists "notiRead" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null references "user"("userNickname") on update cascade on delete cascade,
  "notiId"       varchar(60) not null,
  "read_date"    timestamptz not null default now(),
  unique ("userNickname", "notiId")
);
create index if not exists "notiRead_userNickname_idx" on "notiRead" ("userNickname");
alter table "notiRead" enable row level security;

-- 사진첩 댓글 테이블
create table if not exists "albumCMT" (
  "seq"          serial primary key,
  "albumSeq"     integer not null references "album"("seq") on delete cascade,
  "userNickname" varchar(50) not null references "user"("userNickname") on update cascade on delete cascade,
  "content"      text        not null,
  "create_date"  timestamptz not null default now(),
  "update_date"  timestamptz not null default now(),
  "openScope"    smallint    not null default 1,
  "parentSeq"    integer     references "albumCMT"("seq") on delete cascade
);
create index if not exists "albumCMT_albumSeq_idx" on "albumCMT" ("albumSeq");
alter table "albumCMT" enable row level security;

-- BGM 이름 교정 ('1年이 지나도/거미' → '벌써 1년/브라운아이드소울')
update "bgm"     set "title" = '벌써 1년', "artist" = '브라운아이드소울'
  where "contentPath" = '/resources/sounds/Already1Year.mp3';
update "userBgm" set "title" = '벌써 1년', "artist" = '브라운아이드소울'
  where "contentPath" = '/resources/sounds/Already1Year.mp3';
```

> 알림 목록 자체는 여전히 기존 테이블에서 파생합니다(이벤트 테이블 없음).
> 위 `notiRead` 는 "읽었다"는 사실만 저장합니다. 표를 새로 만드는 것이라
> 적용 직후 한 번은 기존 알림이 전부 안 읽음으로 뜹니다 — **모두 읽음** 한 번 누르면 정리됩니다.

---

## 기능 추가

### 알림 (우측 상단 🔔)
- 안 읽은 알림이 있으면 빨간 배지, **모두 읽음** 버튼, 알림을 누르면 **목록에서 사라진다**.
- 대상:
  - 내 게시판/사진첩/다이어리 **댓글**, **일촌평**, **방명록**, 받은 **일촌 신청**
  - **일촌(수락된 친구)이 올린 새 콘텐츠** — 게시글 🆕 / 사진 🖼️ / 다이어리 ✨
- 알림은 이벤트 테이블 없이 기존 데이터에서 파생, **읽음 기록은 `notiRead` 테이블**(계정 단위).

### 방명록
- 미니홈피 주인이 방문글에 **답글**(방문글과 동일한 미니미+날짜 레이아웃), "비밀로하기" 제거.

### 게시판 / 사진첩 / 다이어리 댓글
- 댓글에 **답글(대댓글)** — 부모 댓글 아래 └> 세로 들여쓰기(공용 `CommentThread`).
- **다이어리 댓글에도 답글**과 **본인 댓글 삭제** 추가(`/mnHome/diaryCommentDelete`).
  원댓글을 지우면 딸린 답글도 함께 사라진다.
- 사진첩에 댓글 기능 신규 추가.
- 게시판 목록에 글별 **댓글 수** 컬럼.

### 일촌 현황
- **받은신청 / 보낸신청** 탭에 건수 **빨간 배지**(0건이면 표시 안 함).

### BGM
- 내 미니홈피 진입 시 **자동 재생**, 다른 홈 방문 시 정지.
- '벌써 1년'(브라운아이드소울) 메타데이터 교정.

### 광장 (`/plaza`) — 실시간 다중 접속
- 내 **미니미로 방향키(또는 WASD)** 이동, 모바일은 화면 방향 버튼.
- 여러 명이 같은 화면에 모이고 **실시간 채팅** — 머리 위 말풍선(5초) + 아래 채팅 로그.
- `Enter` 로 채팅창 열기 → 보내면 다시 이동 가능(입력 중에는 방향키가 안 먹는다).
- 접속/이탈은 자동 반영, 앞뒤 겹침은 y 좌표 순서로 정렬.
- 배경(하늘·잔디·분수·나무·벤치·가로등)은 **이미지 없이 CSS 로** 그렸다. 새 에셋 필요 없음.
- 로그인 필요. 들어가는 길 3곳: 메인 화면 헤더의 **광장** 메뉴와 프로필 아래 **🌳 광장** 버튼,
  미니홈피 하단바의 **🌳 광장**, 포털(상점·공지·찾아오는 길) 헤더의 **광장**.

**동작 방식** — Vercel 서버리스는 WebSocket 서버를 띄울 수 없어서, 이미 쓰는
**Supabase Realtime** 채널 하나(`plaza`)에 브라우저가 직접 붙는다.
presence 로 접속자 명단을, broadcast 로 좌표(`pos`)·채팅(`chat`)·신규 인사(`hello`)를 주고받는다.
DB 테이블을 쓰지 않으므로 **마이그레이션이 없다**.

> ⚠️ **환경변수 `SUPABASE_ANON_KEY` 가 필요합니다** (Supabase 대시보드 → Settings → API → `anon public`).
> `.env.local` 과 Vercel 환경변수 양쪽에 넣어 주세요. 없으면 광장은 열리지만 "실시간 미설정"
> 안내가 뜨고 혼자만 걸어다니게 됩니다. 빌드 타임에 박는 `NEXT_PUBLIC_` 방식이 아니라
> 서버에서 읽어 내려주므로 **재빌드 없이 환경변수만 넣고 재시작**하면 됩니다.

- 알려진 한계(프로토타입): 좌표·채팅이 클라이언트끼리 직접 오가므로 서버가 검증하지 않는다.
  마음먹으면 남의 닉네임으로 말할 수 있다. 공개 광장 하나뿐이고 채팅 로그는 저장되지 않는다.

### 아바타 (프로토타입, `/avatar`)
- 레이어드 페이퍼돌: 실제 도트 파트(헤어/눈/의상)를 겹쳐 조합.
- 제작 규격은 `public/resources/images/avatar/SPEC.md` 참고(1024×1536, 부위별 픽셀 크기).
- 저장은 localStorage(프로토타입). base(민머리·맨몸)·추가 파트·프로필/광장 연동은 예정.

## UI 개선
- 헤더 Today/Total 왼쪽 **홈 아이콘**(내 홈 이동).
- 글쓰기: 제목/작성일 **카드형** + 공개설정 **세그먼트 토글**.
- 다이어리/게시판 본문 에디터를 **자체 경량 RichTextEditor**로 교체(SmartEditor 제거).
- 사진첩 업로드: 파일 선택 버튼·정사각 썸네일 그리드.
- 공통 액션 버튼 통일(`.mh-act` / `.mh-btn`).
- **댓글 UI 통일**: 게시판·사진첩·다이어리가 모두 `CommentThread` + `frame.css` 한 벌만 쓴다.
  (board.css / diary.css 가 `.board-comment*` 를 각자 다시 정의해서 탭마다 여백·정렬·글자 크기가
  달랐던 것을 걷어냄)
- **프로필 칸**: 사진 영역이 남는 세로 공간을 전부 가져가 크게, 프로필 멘트는 두 줄로 줄이고
  길면 그 안에서 스크롤. 사진은 `absolute` 로 띄워 **칸 높이를 밀어내지 못하게** 했다
  (`.profile-box { min-height:0; overflow:hidden }`) — 오른쪽 Updated News 칸과 세로가 맞는다.
- **미니홈피 제목**: 제목이 글자 길이만큼만 차지하게 해서 `[수정]` 버튼이 제목 바로 옆에 붙는다.
  버튼/입력창의 흰 배경을 걷어내 페이지 배경 톤에 맞춤.

## 버그 수정
- **날짜 표기를 전부 한국 시간(KST) 기준으로** — 서버(UTC)에서 오전 9시 이전 글이 '어제'로 찍히던 문제.
  `lib/db/format.ts` 한 곳에서 UTC+9 로 변환(달력·글쓰기 작성일 포함).
- 다이어리 작성 직후 안 보이던 문제(서버 UTC vs KST) → 오늘 글 없으면 최신 글 폴백.
- 접속 지연 개선(mainView DB 왕복 병렬화 + 방문수 증가 `after()`).
- **BGM 관리 중복**: 재생목록에 넣은 곡이 '보유 BGM'에도 떠서 두 개로 보이던 문제 수정.
- 인메모리 저장소(DB 미연결 dev 모드)에서 `seq` 없이 들어간 행이 생겨 댓글 삭제가 안 되던 문제
  (`MemoryStore.insert` 의 `'seq' in record` 검사). Supabase 모드는 serial PK 라 영향 없음.
- **알림 읽음이 브라우저마다 따로 놀던 문제** — httpOnly 쿠키에 저장하던 것을 `notiRead` 테이블로
  옮겼다. 다른 PC 에서 접속해도 읽은 알림은 그대로 읽음.
- **읽은 알림이 목록에 계속 남던 문제** — 읽은 알림은 목록에서 아예 빠진다(읽음 표시만 하던 것 수정).
- 프로필 칸이 회색 페이지 밖으로 삐져나가던 문제(사진 확대 후) — 위 UI 개선 항목 참고.

## 모바일 (반응형)
- 1080×660 고정 "책"을 좁은 화면에서 **세로 1단**으로 리플로우, 모바일은 팝업 대신 전체화면 진입.
- 내부 서브 창(미니룸/미니미/프로필 편집)은 모바일에서 새 탭 전체화면.

## 개발 메모
- Windows dev: `.next` 캐시가 Defender/인덱서에 잠기면 `page_client-reference-manifest.js` UNKNOWN 에러 → 코드 문제 아님(폴더를 Downloads 밖으로 or Defender 예외).
- build↔dev 전환 시 `npm run clean`.
