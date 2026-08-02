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

-- '일촌 ON' 정확도. 마지막 생존 신호 시각.
alter table "loginStatus"
  add column if not exists "last_seen" timestamptz not null default now();

-- 방명록 글별 공개범위 (1 = 전체공개, 2 = 일촌공개, 0 = 비밀글)
alter table "visit"
  add column if not exists "openScope" smallint not null default 1;

-- 미니홈피 전체 공개 여부 (1 = 공개, 0 = 비공개 → 일촌만 입장)
alter table "user"
  add column if not exists "homeOpenScope" smallint not null default 1;

-- '오늘 방문자' 가 자정에 리셋되도록. 이 숫자가 어느 날 것인지 같이 저장한다.
alter table "visitCnt"
  add column if not exists "cnt_date" date;

-- 광장 채팅 기록 (새로고침·재입장 때 지난 대화를 볼 수 있게)
create table if not exists "plazaChat" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null references "user"("userNickname") on update cascade on delete cascade,
  "content"      text        not null,
  "create_date"  timestamptz not null default now()
);
create index if not exists "plazaChat_seq_idx" on "plazaChat" ("seq" desc);
alter table "plazaChat" enable row level security;

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

-- 도트 미니미 22종을 상점에 등록 (광장에서 숫자키로 특수 동작이 되는 미니미).
-- 이미 들어 있는 건 건너뛰므로 여러 번 실행해도 중복되지 않는다.
insert into "store" ("category", "productName", "contentPath", "productPrice")
select v."category", v."productName", v."contentPath", v."productPrice"
from (values
  ('minimi', '아구몬', '/resources/images/minimi/agumonIcon.gif', '30'),
  ('minimi', '에어드라몬', '/resources/images/minimi/airdramonIcon.gif', '30'),
  ('minimi', '베르제브몬 블래스트', '/resources/images/minimi/beelzebumonBlastIcon.gif', '30'),
  ('minimi', '치비몬', '/resources/images/minimi/chibimonIcon.gif', '30'),
  ('minimi', '드리모게몬', '/resources/images/minimi/drimogemonIcon.gif', '30'),
  ('minimi', '듀크몬', '/resources/images/minimi/dukemonIcon.gif', '30'),
  ('minimi', '에테몬', '/resources/images/minimi/etemonIcon.gif', '30'),
  ('minimi', '팬텀몬', '/resources/images/minimi/fantomonIcon.gif', '30'),
  ('minimi', '갈고몬', '/resources/images/minimi/galgomonIcon.gif', '30'),
  ('minimi', '게코몬', '/resources/images/minimi/gekomonIcon.gif', '30'),
  ('minimi', '기기몬', '/resources/images/minimi/gigimonIcon.gif', '30'),
  ('minimi', '그레이몬', '/resources/images/minimi/greymonIcon.gif', '30'),
  ('minimi', '임프몬', '/resources/images/minimi/impmonIcon.gif', '30'),
  ('minimi', '코로몬', '/resources/images/minimi/koromonIcon.gif', '30'),
  ('minimi', '마린엔젤몬', '/resources/images/minimi/marinAngemonIcon.gif', '30'),
  ('minimi', '오메가몬 X', '/resources/images/minimi/omegamonXIcon.gif', '30'),
  ('minimi', '파닥몬', '/resources/images/minimi/patamonIcon.gif', '30'),
  ('minimi', '테리어몬', '/resources/images/minimi/terriermonIcon.gif', '30'),
  ('minimi', '토게몬', '/resources/images/minimi/togemonIcon.gif', '30'),
  ('minimi', '츠노몬', '/resources/images/minimi/tsunomonIcon.gif', '30'),
  ('minimi', '브이몬', '/resources/images/minimi/vmonIcon.gif', '30'),
  ('minimi', '워그레이몬 X', '/resources/images/minimi/warGreymonXIcon.gif', '30')
) as v("category", "productName", "contentPath", "productPrice")
where not exists (
  select 1 from "store" s where s."contentPath" = v."contentPath"
);

-- GIF 로 받아 규격만 맞춘 미니미 (특수 동작 없음). 위와 같이 중복되지 않는다.
insert into "store" ("category", "productName", "contentPath", "productPrice")
select v."category", v."productName", v."contentPath", v."productPrice"
from (values
  ('minimi', '마리오', '/resources/images/minimi/marioIcon.gif', '20'),
  ('minimi', '요시', '/resources/images/minimi/yoshiIcon.gif', '20'),
  ('minimi', '피카츄', '/resources/images/minimi/pikachuIcon.gif', '20'),
  ('minimi', '피카츄 (모자)', '/resources/images/minimi/pikachuDotIcon.gif', '20'),
  ('minimi', '라프라스', '/resources/images/minimi/laprasIcon.gif', '20'),
  ('minimi', '가브몬', '/resources/images/minimi/gabumonIcon.gif', '20')
) as v("category", "productName", "contentPath", "productPrice")
where not exists (
  select 1 from "store" s where s."contentPath" = v."contentPath"
);

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

### 공개범위 (전체공개 / 일촌공개 / 나만보기)
- **다이어리 · 사진첩 · 게시판 · 방명록** 모든 글에 글별 공개범위. 공용 `ScopePicker` 하나로 통일.
  기존 `openScope` 컬럼을 그대로 쓰고 **2 = 일촌공개** 를 더했다 (옛 글은 그대로 유효).
- **미니홈피 전체 공개/비공개** (관리 화면). 비공개면 일촌이 아닌 사람은 어느 탭으로 들어와도
  안내 화면만 보이고 글이 하나도 안 보인다. 일촌신청 버튼은 남겨 둔다.
- 판정 로직은 `lib/db/visibility.ts` 한 곳에만 둔다. 조회 경로가 여러 군데라
  각자 조건을 쓰면 한 곳만 빠뜨려도 새어 나가기 때문.
- 목록뿐 아니라 **주소를 직접 아는 경우에도** 막는다. 검증:

  | | 전체공개 | 일촌공개 | 나만보기 |
  |---|---|---|---|
  | 주인 | 보임 | 보임 | 보임 |
  | 일촌 | 보임 | 보임 | 404 |
  | 남 | 보임 | 404 | 404 |

- `getDiaryCmt` 는 seq 만 주면 검사 없이 댓글을 돌려주던 곳이라 함께 막았다.

### 광장 (`/plaza`) — 실시간 다중 접속
- 내 **미니미로 방향키(또는 WASD)** 이동, **ALT 로 점프**.
- 여러 명이 같은 화면에 모이고 **실시간 채팅** — 머리 위 말풍선(8초) + 아래 채팅 로그.
- **지난 대화가 남는다** — 새로고침하거나 나중에 들어와도 앞의 대화를 볼 수 있다(`plazaChat`).
  저장할 때 닉네임을 세션에서 채우므로 **로그는 사칭할 수 없다**.
- **채팅 속 URL 은 링크**로 바뀐다(파란 밑줄, 새 창). `http/https` 만 링크로 만들고
  `javascript:` 같은 스킴은 절대 걸지 않는다. 태그가 섞여 들어와도 글자로만 보인다.
- 남이 채팅을 보내면 **띠링 알림음**. mp3 없이 WebAudio 로 두 음을 합성한다(에셋 0). 🔔 버튼으로 끌 수 있고 선택은 기억된다.
- `Enter` 로 채팅창 열기 → 보내면 계속 대화, **빈 칸에서 Enter 를 다시 누르면 빠져나와** WASD 로 돌아간다.
  (입력칸에서 난 키는 전역 핸들러가 아예 건드리지 않는다. 예전엔 blur 직후 같은 Enter 이벤트가
  window 까지 올라가 곧바로 다시 포커스돼, 빠져나온 것처럼 보이지 않았다)
- **숫자키로 특수 동작** — 도트 미니미를 입고 있으면 `1` 웃음 · `2` 포효 · `3` 잠.
  남들 화면에도 보인다. (아래 '미니미 — 도트 시트 팩' 참고)
- 접속/이탈 자동 반영, 앞뒤 겹침은 y 좌표 순서로 정렬.
- **한 계정은 한 자리** — 창을 여러 개 열어도 캐릭터가 하나만 선다.
  같은 브라우저의 다른 탭은 `BroadcastChannel` 로 즉시, 다른 기기는 realtime `claim` 으로 잡는다.
  **나중에 접속한 쪽이 이긴다** — 죽은 탭이 자리를 영영 막지 않도록. 물러난 창에는
  안내와 '여기서 다시 접속' 버튼이 뜬다.
- **좌표 제한 없음** — 예전엔 위쪽이 하늘이라 위로 못 올라갔다. 바닥이 화면 전체를 덮는
  부감 구도로 바꿔 어디로든 걸어다닐 수 있다. 위로 갈수록 안개가 끼고 캐릭터도 조금 작아져 깊이가 생긴다.
- **말풍선이 잘리지 않는다** — 좌우로 넘치면 무대 안쪽으로 밀어 넣고,
  머리 위 여유가 없으면 캐릭터 아래로 뒤집는다.
- 배경(잔디 결·흙길·원형 광장·분수 물결·나무·벤치·가로등·비네트)은 **이미지 없이 CSS 로** 그렸다.
- 로그인 필요. 들어가는 길: 미니홈피 메뉴탭의 **광장**(방명록 밑),
  포털(상점·공지·찾아오는 길) 헤더의 **광장**.

**동작 방식** — Vercel 서버리스는 WebSocket 서버를 띄울 수 없어서, 이미 쓰는
**Supabase Realtime** 채널 하나(`plaza`)에 브라우저가 직접 붙는다.
presence 로 접속자 명단을, broadcast 로 좌표(`pos`)·채팅(`chat`)·신규 인사(`hello`)를 주고받는다.
실시간 전달은 broadcast 가, 지난 대화는 `plazaChat` 표가 맡는다.

> ⚠️ **환경변수 `SUPABASE_ANON_KEY` 가 필요합니다** (Supabase 대시보드 → Settings → API → `anon public`).
> `.env.local` 과 Vercel 환경변수 양쪽에 넣어 주세요. 없으면 광장은 열리지만 "실시간 미설정"
> 안내가 뜨고 혼자만 걸어다니게 됩니다.

- 알려진 한계: 좌표와 말풍선은 클라이언트끼리 직접 오가 서버가 검증하지 않는다(채팅 **기록**은 서버가 닉네임을 채운다).
  공개 광장 하나뿐이다. 화면 방향 버튼을 없앴으므로 **모바일에서는 키보드 없이 이동할 수 없다**.

### 미니미 — 도트 시트 팩 22종
- 상점에 **도트 미니미 22종** 추가. 광장에서 **숫자키로 특수 동작**이 된다.
  `1` 웃음 · `2` 포효 · `3` 잠. 2.2초 재생하고 평소 모습으로 돌아온다.
- **다른 사람 화면에도 보인다.** broadcast 로 그림 경로가 아니라 **동작 이름만** 보내고,
  받는 쪽이 그 사람의 미니미 기준으로 그림을 찾는다. 그래야 같은 '웃음'이라도 미니미마다 다르게 나온다.
- 이모트가 없는 기존 미니미(메이플 몹 73종)는 숫자키를 눌러도 아무 일이 없고 안내도 안 뜬다.

**시트 → GIF 변환** — 도트 스프라이트는 배포처가 거의 다 낱장 GIF 가 아니라 '시트'다.
외부 라이브러리 없이 **GIF89a 를 직접 쓴다**(LZW 포함). 기존 미니미 73개를 디코드해
실측한 규격(320×240 캔버스 · 바닥 정렬 · 캐릭터 높이 192)에 맞춰 얹는다.
```
npm run minimi:pack              시트 전부 → 22종 × 4동작 = 88개 GIF
npm run minimi:pack -- greymon   이름에 걸리는 것만
npm run minimi:gif  <시트.png> --out <이름> --frames 0,1   한 장만
```
- 무엇을 어느 프레임으로 뽑을지는 **`lib/minimi/dot-pack.ts` 한 곳**에 있다.
  상점 목록(seed)·광장 이모트·GIF 생성이 전부 여기를 보므로, 프레임 번호만 고치고
  다시 돌리면 세 곳이 같이 따라온다.
- 시트 22장은 전부 같은 팩이라 12프레임 배치가 같다. 22장을 펼쳐 눈으로 맞춘 값:
  `0,1` 서 있기 · `2,3` 웃음 · `4,5` 잠 · `7,8` 포효.
- **원본 시트는 `_sheets/` 에 남겨 둔다** — 프레임을 다시 고르려면 여기서 다시 뽑으면 된다.
- 방향 주의: 광장은 **원본이 왼쪽을 본다**고 보고 뒤집는다(`e1f938e`). 이 팩은 전부 왼쪽이라
  그대로 쓰지만, 오른쪽을 보는 시트를 넣을 땐 `--flip` 이 필요하다.

### 미니미 — GIF 로 받은 것들 (마리오 · 요시 · 피카츄 …)
- 마리오, 요시, 피카츄, 피카츄(모자), 라프라스, 가브몬 추가. **특수 동작은 없다** —
  원본이 idle 애니메이션 한 벌뿐이라 쓸 자세가 없다(숫자키를 눌러도 아무 일이 없다).

**GIF → 미니미 변환** — 위 시트 팩과 달리 처음부터 애니메이션 GIF 로 배포되는 것들이다.
```
npm run minimi:from-gif -- <입력.gif> --out <이름> [--bg] [--flip] [--max 24]
```
받은 그대로는 못 쓴다. 캔버스가 48×44 부터 500×696 까지 제각각이라 규격에 맞춰 다시 얹는다.
- **원본 도트 배율을 되찾는다.** 도트를 몇 배로 늘려 올린 게 많은데, 그걸 모르고 다시 줄이면
  픽셀이 뭉개진다. 실제로 마리오 20배, 가브몬 10.8배, 요시 9.2배, 피카츄 6.7배였다.
  정수배가 아닌 것도 있어(500px 같은 어중간한 크기로 늘려서) 소수 배율로 다룬다.
  - 세 번 갈아엎었다: ① `s×s` 칸이 균일한지 → 정수배가 아니라 거의 안 걸림
    ② 픽셀이 바뀌는 자리를 격자로 → 걷기 애니메이션은 프레임마다 내용이 달라 흔들림
    ③ **반복 길이의 최빈값(넓이 가중)으로 배율 하나만** → 안정적.
    개수로 세면 안 된다 — 마리오는 블록 사이에 1px 전환 줄이 끼어 `17,1,17,1…` 이라
    1px 이 개수로 이겨 버린다.
- **`--bg`** 투명 정보 없이 흰 배경째 구워진 GIF(mario.gif)용. 가장자리에서 번져 나가므로
  눈·장갑 같은 안쪽 흰색은 남는다. 배경의 52% 를 걷어냈다.
  배율은 **지우기 전에** 잰다 — 지우고 나면 가장자리 블록이 깨져 값이 틀린다.
- **`--max`** 프레임 상한. 피카츄(모자)는 원본이 112프레임이라 16장으로 고르게 솎아냈다.
- GIF 읽기/쓰기는 `scripts/gif.mjs` 로 합쳤다. 프레임 폐기 방법(disposal)과 인터레이스까지
  처리해야 프레임이 겹치거나 조각만 나오지 않는다.
- 원본은 `_src/` 에 남겨 둔다.

### 아바타 (작업 중, `/avatar`)
- 레이어드 페이퍼돌 — 민머리·속옷 차림 **base** 위에 눈·헤어·상의·하의·신발·모자·악세를 겹친다.
- 모든 파트는 같은 1024×1536 캔버스에 제자리로 그린 투명 PNG. 그냥 겹치면 정렬이 맞고
  코드에 좌표 계산이 없다. 기준선은 base 실측값(`scripts/avatar-rig.mjs`) 한 곳에 둔다.
- 겹치는 순서 `base → bottom → top → shoes → eyes → hair → headwear → acc`.
  **eyes 가 hair 보다 아래**여야 앞머리가 눈을 덮는다(예전엔 반대라 눈이 머리 위로 떴다).

**에셋 작업 도구** — 생성 AI 가 뱉는 그림은 크기·위치·배경이 제멋대로라 손으로 맞추면 반드시 어긋난다.
```
npm run avatar:guide     base + 기준선을 얹은 _guide.png (밑에 깔고 그릴 것)
npm run avatar:bg   <파일> [--skin]   배경 제거 (--skin: 딸려온 얼굴 살색까지)
npm run avatar:fit  <파일>            부위별 목표 자리에 축소·이동
npm run avatar:preview                전부 겹친 _preview.png
npm run avatar:check                  캔버스·위치가 규격에 맞는지 검사
```
외부 라이브러리 없이 PNG 를 직접 읽고 쓴다(zlib 만 사용). 팔레트/RGB/회색 PNG 도 받는다.

- 실제로 이 도구들로 처리한 것들: 체커보드가 구워진 배경 88.7% 제거, 머리카락에 딸려온
  얼굴 살색 25,882px 제거, 얼굴 앞을 가로지르던 머리카락 12,469px 제거, 크기 자동 맞춤.
- 저장은 아직 localStorage. 파트 양산과 프로필/광장 연동은 남아 있다.

## UI 개선
- 상점 한 페이지를 **10개 → 12개**로. 상점은 목록이 아니라 격자(`auto-fill`)라
  10개면 4개씩 깔릴 때 마지막 줄에 2개만 남아 허전했다. 12는 한 줄에 2·3·4·6개
  어느 쪽으로 깔려도 줄이 딱 떨어진다. (게시판·공지 등 목록형 페이지는 10 그대로)
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
- **'일촌 ON' 이 며칠씩 안 꺼지던 문제** — `loginStatus.status` 는 로그아웃 버튼을 눌러야만
  '0' 이 되어, 브라우저를 닫거나 PC 를 끈 사람이 계속 접속중으로 남았다.
  열린 탭이 2분마다 `/api/heartbeat` 로 신호를 보내고, **ON 판정은 `last_seen` 5분 이내**로 바꿨다.
  탭이 화면에 안 보이는 동안은 신호를 보내지 않는다.
- **자동 로그아웃** — 세션이 7일 고정이었다. 이제 마지막 활동 기준 **12시간**(sliding)으로,
  heartbeat 가 들어올 때마다 만료가 밀린다. (`lib/session.ts` 의 `SESSION_IDLE_AGE`)
- **광장에서 좌우가 뒤집혀 보이던 문제** — 미니미 원본 스프라이트가 '왼쪽' 을 보고 있는데
  오른쪽 기준으로 뒤집어서, 왼쪽으로 가면 오른쪽을 보고 있었다.
- **읽은 알림이 목록에 계속 남던 문제** — 읽은 알림은 목록에서 아예 빠진다(읽음 표시만 하던 것 수정).
- **'오늘 방문자' 가 초기화되지 않던 문제** — 올리기만 하고 자정에 0 으로 되돌리는 곳이 없어
  숫자가 계속 쌓였다(구 JSP 의 자정 배치가 사라진 자리). 크론을 두는 대신 그 숫자가
  **어느 날 것인지(`cnt_date`)를 같이 저장**해, 날짜가 바뀌면 0 부터 다시 센다.
  읽을 때도 같은 기준으로 걸러 오늘 아직 아무도 안 왔으면 어제 숫자가 아니라 0 이 보인다.
  누적(TOTAL)은 그대로 이어진다.
- 프로필 칸이 회색 페이지 밖으로 삐져나가던 문제(사진 확대 후) — 위 UI 개선 항목 참고.
- **'미니홈피 찾기' 검색 결과가 안 보이던 문제** — 검색창이 프로필 칸 맨 아래라 결과 목록이
  아래로 열리면서 칸 밖으로 나갔고, 위 수정 때 넣은 `.profile-box { overflow:hidden }` 에 잘렸다.
  결과를 **위로 펼치도록** 바꾸고(칸 안에 251px 여유), 사진이 이미 `absolute` 라 중복 방어였던
  `overflow:hidden` 도 걷어냈다. (칸이 늘어나는 걸 막는 건 `min-height:0` 쪽이다)

## 모바일 (반응형)
- 1080×660 고정 "책"을 좁은 화면에서 **세로 1단**으로 리플로우, 모바일은 팝업 대신 전체화면 진입.
- 내부 서브 창(미니룸/미니미/프로필 편집)은 모바일에서 새 탭 전체화면.

## 개발 메모
- Windows dev: `.next` 캐시가 Defender/인덱서에 잠기면 `page_client-reference-manifest.js` UNKNOWN 에러 → 코드 문제 아님(폴더를 Downloads 밖으로 or Defender 예외).
- build↔dev 전환 시 `npm run clean`.
