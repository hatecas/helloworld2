-- =====================================================================
-- HelloWorld 미니홈피 — Supabase(Postgres) 스키마
--
-- 구 MySQL 스키마(src/main/resources/Table_Script)는 매퍼보다 오래된
-- 버전이라 friends / friendCMT / bgm / userBgm / miniroom* / miniHomeTitle
-- 등이 빠져 있었다. 여기서는 MyBatis 매퍼 XML 의 실제 쿼리를 기준으로
-- 재구성했다.
--
-- 컬럼명은 구 코드/JSP 와 1:1 로 맞추기 위해 camelCase 를 큰따옴표로
-- 감싸 그대로 유지한다. PostgREST(supabase-js) 는 그대로 조회 가능하다.
--
-- 적용:  Supabase 대시보드 > SQL Editor 에 붙여넣고 실행
-- =====================================================================

begin;

drop table if exists "forestRecord"        cascade;
drop table if exists "plazaChat"           cascade;
drop table if exists "notiRead"            cascade;
drop table if exists "loginLog"            cascade;
drop table if exists "loginStatus"         cascade;
drop table if exists "friendCMT"           cascade;
drop table if exists "friends"             cascade;
drop table if exists "visitCnt"            cascade;
drop table if exists "visit"               cascade;
drop table if exists "albumCMT"            cascade;
drop table if exists "album"               cascade;
drop table if exists "diaryCMT"            cascade;
drop table if exists "diary"               cascade;
drop table if exists "boardCMT"            cascade;
drop table if exists "board"               cascade;
drop table if exists "notice"              cascade;
drop table if exists "miniroomMinimi"      cascade;
drop table if exists "miniroomBackground"  cascade;
drop table if exists "miniHomeTitle"       cascade;
drop table if exists "profile"             cascade;
drop table if exists "userBgm"             cascade;
drop table if exists "bgm"                 cascade;
drop table if exists "store"               cascade;
drop table if exists "userStorage"         cascade;
drop table if exists "dotoriU"             cascade;
drop table if exists "dotoriC"             cascade;
drop table if exists "dotori"              cascade;
drop table if exists "user"                cascade;

-- ---------------------------------------------------------------- 회원
create table "user" (
  "userEmail"     varchar(100) primary key,
  "userPassword"  varchar(100) not null,          -- SHA-256 hex (구 SHA256.java 와 동일)
  "userName"      varchar(50)  not null,
  "userNickname"  varchar(50)  not null unique,
  "userGender"    varchar(10)  not null,
  "userBirth"     date         not null,
  "userPhone"     varchar(20)  not null unique,
  "createDate"    timestamptz  not null default now(),
  "userAvailable" varchar(1)   not null default 'N',
  -- 미니홈피 전체 공개 여부. 0 = 비공개(일촌만 입장), 1 = 공개
  "homeOpenScope" smallint     not null default 1
);

create table "dotori" (
  "userNickname"  varchar(50) primary key
                  references "user"("userNickname") on update cascade on delete cascade,
  "currentDotori" integer not null default 0
);

create table "dotoriC" (
  "seq"                serial primary key,
  "userNickname"       varchar(50) not null
                       references "user"("userNickname") on update cascade on delete cascade,
  "dotoriCharge"       integer     not null default 0,
  "dotoriChargeDate"   timestamptz not null default now(),
  "dotoriChargeMethod" varchar(100),
  "dotoriPrice"        varchar(20)
);

create table "dotoriU" (
  "seq"           serial primary key,
  "userNickname"  varchar(50) not null
                  references "user"("userNickname") on update cascade on delete cascade,
  "dotoriUse"     integer     not null default 0,
  "dotoriUseFor"  varchar(200),
  "dotoriUseDate" timestamptz not null default now()
);

-- ------------------------------------------------------- 아이템 / 상점
create table "store" (
  "seq"          serial primary key,
  "category"     varchar(50)  not null,           -- minimi | skin | menu
  "productName"  varchar(100) not null,
  "contentPath"  varchar(200) not null,           -- 이미지 경로 또는 색상값
  "productPrice" varchar(20)  not null default '0'
);

create table "userStorage" (
  "seq"         serial primary key,
  "userNickname" varchar(50) not null
                references "user"("userNickname") on update cascade on delete cascade,
  "category"    varchar(50)  not null,
  "productName" varchar(100) not null,
  "contentPath" varchar(200) not null,
  "buy_date"    timestamptz  not null default now(),
  "allocation"  smallint     not null default 0    -- 1 = 현재 적용중
);
create index on "userStorage" ("userNickname", "category");

create table "bgm" (
  "seq"         serial primary key,
  "title"       varchar(100) not null,
  "artist"      varchar(100) not null,
  "runningTime" varchar(20)  not null,
  "bgmPrice"    varchar(20)  not null default '0',
  "contentPath" varchar(200) not null
);

create table "userBgm" (
  "seq"         serial primary key,
  "userNickname" varchar(50) not null
                references "user"("userNickname") on update cascade on delete cascade,
  "title"       varchar(100) not null,
  "artist"      varchar(100) not null,
  "runningTime" varchar(20)  not null,
  "contentPath" varchar(200) not null,
  "allocation"  smallint     not null default 0    -- 1 = 플레이리스트에 등록
);
create index on "userBgm" ("userNickname");

-- -------------------------------------------------------- 프로필 / 홈피
create table "profile" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null
                 references "user"("userNickname") on update cascade on delete cascade,
  "image"        varchar(500),                     -- 파일명 또는 'noneFile'
  "msg"          varchar(500),
  "create_date"  timestamptz not null default now(),
  "update_date"  timestamptz not null default now()
);
create index on "profile" ("userNickname", "create_date" desc);

create table "miniHomeTitle" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null unique
                 references "user"("userNickname") on update cascade on delete cascade,
  "title"        varchar(200) not null,
  "update_date"  timestamptz  not null default now()
);

create table "miniroomBackground" (
  "userNickname"   varchar(50) primary key
                   references "user"("userNickname") on update cascade on delete cascade,
  "backgroundName" varchar(100) not null,
  "backgroundPath" varchar(200) not null
);

create table "miniroomMinimi" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null
                 references "user"("userNickname") on update cascade on delete cascade,
  "minimiName"   varchar(100) not null,
  "minimiPath"   varchar(200) not null,
  "minimiLeft"   varchar(20)  not null,            -- "390px"
  "minimiTop"    varchar(20)  not null             -- "163px"
);
create index on "miniroomMinimi" ("userNickname");

-- ------------------------------------------------------------- 컨텐츠
create table "notice" (
  "seq"         serial primary key,
  "writer"      varchar(50)   not null,
  "title"       varchar(200)  not null,
  "content"     text          not null,
  "create_date" timestamptz   not null default now(),
  "update_date" timestamptz   not null default now(),
  "del_yn"      varchar(1)    not null default 'N'
);

create table "board" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null
                 references "user"("userNickname") on update cascade on delete cascade,
  "title"        varchar(200) not null,
  "content"      text         not null,
  "imagePath"    text         not null default '',
  "hits"         integer      not null default 0,
  "create_date"  timestamptz  not null default now(),
  "update_date"  timestamptz  not null default now(),
  "del_yn"       varchar(1)   not null default 'N',
  "openScope"    smallint     not null default 1
);
create index on "board" ("userNickname", "seq" desc);

create table "boardCMT" (
  "seq"          serial primary key,
  "boardSeq"     integer not null references "board"("seq") on delete cascade,
  "userNickname" varchar(50) not null
                 references "user"("userNickname") on update cascade on delete cascade,
  "content"      text        not null,
  "create_date"  timestamptz not null default now(),
  "update_date"  timestamptz not null default now(),
  "openScope"    smallint    not null default 1,
  -- 답글이면 부모 댓글 seq
  "parentSeq"    integer     references "boardCMT"("seq") on delete cascade
);
create index on "boardCMT" ("boardSeq");

create table "diary" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null
                 references "user"("userNickname") on update cascade on delete cascade,
  "title"        varchar(200) not null,
  "content"      text         not null,
  "hits"         integer      not null default 0,
  "create_date"  timestamptz  not null default now(),
  "update_date"  timestamptz  not null default now(),
  "diary_date"   date         not null,
  "del_yn"       varchar(1)   not null default 'n',
  "openScope"    smallint     not null default 1,
  unique ("userNickname", "diary_date")
);

create table "diaryCMT" (
  "seq"          serial primary key,
  "diarySeq"     integer not null references "diary"("seq") on delete cascade,
  "userNickname" varchar(50) not null
                 references "user"("userNickname") on update cascade on delete cascade,
  "content"      text        not null,
  "create_date"  timestamptz not null default now(),
  "openScope"    smallint    not null default 1,
  -- 답글(대댓글)이면 부모 댓글의 seq
  "parentSeq"    integer     references "diaryCMT"("seq") on delete cascade
);
create index on "diaryCMT" ("diarySeq");

create table "album" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null
                 references "user"("userNickname") on update cascade on delete cascade,
  "title"        varchar(200) not null,
  "content"      text         not null default '',
  "imagePath"    text         not null default '',  -- 콤마로 구분된 파일명 목록
  "create_date"  timestamptz  not null default now(),
  "update_date"  timestamptz  not null default now(),
  "del_yn"       varchar(1)   not null default 'N',
  "openScope"    smallint     not null default 1
);
create index on "album" ("userNickname", "seq" desc);

create table "albumCMT" (
  "seq"          serial primary key,
  "albumSeq"     integer not null references "album"("seq") on delete cascade,
  "userNickname" varchar(50) not null
                 references "user"("userNickname") on update cascade on delete cascade,
  "content"      text        not null,
  "create_date"  timestamptz not null default now(),
  "update_date"  timestamptz not null default now(),
  "openScope"    smallint    not null default 1,
  -- 답글이면 부모 댓글 seq
  "parentSeq"    integer     references "albumCMT"("seq") on delete cascade
);
create index on "albumCMT" ("albumSeq");

-- ------------------------------------------------------------- 방명록
create table "visit" (
  "seq"             serial primary key,
  "userNickname"    varchar(50) not null
                    references "user"("userNickname") on update cascade on delete cascade,
  "targetNickname"  varchar(50) not null
                    references "user"("userNickname") on update cascade on delete cascade,
  "content"         text        not null,
  "create_date"     timestamptz not null default now(),
  "update_date"     timestamptz not null default now(),
  -- 1 = 전체공개, 2 = 일촌공개, 0 = 비밀글(주인과 작성자만)
  "openScope"       smallint    not null default 1,
  -- 미니홈피 주인이 방문글에 다는 답글
  "reply"           text,
  "reply_date"      timestamptz
);
create index on "visit" ("targetNickname", "update_date" desc);

create table "visitCnt" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null unique
                 references "user"("userNickname") on update cascade on delete cascade,
  "todayCnt"     integer not null default 0,
  "totalCnt"     integer not null default 0,
  -- todayCnt 가 어느 날의 숫자인지 (KST 기준).
  -- 자정에 리셋해 주는 배치가 없으므로 날짜가 바뀌면 앱이 알아서 0 부터 다시 센다.
  "cnt_date"     date
);

-- --------------------------------------------------------------- 일촌
create table "friends" (
  "seq"            serial primary key,
  "userNickname"   varchar(50) not null            -- 신청한 쪽
                   references "user"("userNickname") on update cascade on delete cascade,
  "friendNickname" varchar(50) not null            -- 신청받은 쪽
                   references "user"("userNickname") on update cascade on delete cascade,
  "fStatus"        smallint    not null default 0, -- 0 대기 / 1 승인 / -1 거절
  "del_yn"         varchar(1)  not null default 'N',
  "createDate"     timestamptz not null default now(),
  -- 일촌이 된(승인된) 시각. 신청만 해 둔 상태면 null.
  -- 일촌의 새 글 알림을 '맺은 뒤' 것만 보내는 기준이다.
  "acceptDate"     timestamptz
);
create index on "friends" ("userNickname");
create index on "friends" ("friendNickname");

create table "friendCMT" (
  "seq"            serial primary key,
  "userNickname"   varchar(50) not null            -- 작성자
                   references "user"("userNickname") on update cascade on delete cascade,
  "friendNickname" varchar(50) not null            -- 일촌평이 달린 홈피 주인
                   references "user"("userNickname") on update cascade on delete cascade,
  "content"        text        not null,
  "createDate"     timestamptz not null default now(),
  "del_yn"         varchar(1)  not null default 'n'
);
create index on "friendCMT" ("friendNickname", "createDate" desc);

-- --------------------------------------------------------- 접속 상태
create table "loginStatus" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null unique
                 references "user"("userNickname") on update cascade on delete cascade,
  "status"       varchar(1) not null default '0',  -- '1' = 로그인함 (명시적 로그아웃 전까지)
  -- 마지막으로 살아있는 신호를 보낸 시각.
  -- status 만으로는 브라우저를 닫거나 PC 를 끈 사람이 영원히 '접속중'으로 남는다.
  -- '일촌 ON' 은 status='1' 이면서 이 값이 최근인 사람만 센다.
  "last_seen"    timestamptz not null default now()
);

create table "loginLog" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null
                 references "user"("userNickname") on update cascade on delete cascade,
  "logDate"      timestamptz not null default now()
);

-- 읽은 알림.
-- 알림 자체는 기존 테이블(댓글·방명록·일촌신청…)에서 그때그때 파생하므로
-- 이벤트 테이블이 없다. "읽었다"는 사실만 여기에 남긴다.
-- 쿠키에 두던 것을 옮긴 것 — 쿠키는 브라우저마다 따로라 다른 PC 에서 다시 안 읽음으로 떴다.
create table "notiRead" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null
                 references "user"("userNickname") on update cascade on delete cascade,
  "notiId"       varchar(60)  not null,   -- getNotifications 가 만드는 id (예: 'board-12')
  "read_date"    timestamptz  not null default now(),
  unique ("userNickname", "notiId")
);
create index on "notiRead" ("userNickname");

-- 광장 채팅 기록.
-- 실시간 전달은 Realtime broadcast 가 하고, 이 표는 '지난 대화' 를 위해 남긴다.
create table "plazaChat" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null
                 references "user"("userNickname") on update cascade on delete cascade,
  "content"      text        not null,
  "create_date"  timestamptz not null default now()
);
create index on "plazaChat" ("seq" desc);

-- 인내의 숲 등반 기록.
-- 사람마다 맵별로 '가장 빠른 기록' 한 줄만 남긴다(unique) — 광장 팻말에 상위 3명을
-- 새기는데, 기록을 다 쌓으면 한 사람이 1·2·3등을 다 차지해 '3명' 이 아니게 된다.
create table "forestRecord" (
  "seq"          serial primary key,
  "userNickname" varchar(50) not null
                 references "user"("userNickname") on update cascade on delete cascade,
  "map"          varchar(20) not null,   -- 'forest' | 'forest2'
  "ms"           integer     not null,   -- 시작 발판을 떠나 정상까지 (ms)
  "create_date"  timestamptz not null default now(),
  unique ("userNickname", "map")
);
create index on "forestRecord" ("map", "ms");

-- ------------------------------------------------------------------ RLS
-- 정책을 하나도 만들지 않으므로 service_role 을 제외한 모든 접근이 막힌다.
-- 이 앱은 서버에서 service_role 키로만 붙으므로 그대로 동작한다.
--
-- 테이블 이름을 반드시 큰따옴표로 감싼다. user 는 Postgres 예약어라
-- 따옴표 없이 쓰면 syntax error 가 난다.
alter table "user"               enable row level security;
alter table "dotori"             enable row level security;
alter table "dotoriC"            enable row level security;
alter table "dotoriU"            enable row level security;
alter table "store"              enable row level security;
alter table "userStorage"        enable row level security;
alter table "bgm"                enable row level security;
alter table "userBgm"            enable row level security;
alter table "profile"            enable row level security;
alter table "miniHomeTitle"      enable row level security;
alter table "miniroomBackground" enable row level security;
alter table "miniroomMinimi"     enable row level security;
alter table "notice"             enable row level security;
alter table "board"              enable row level security;
alter table "boardCMT"           enable row level security;
alter table "diary"              enable row level security;
alter table "diaryCMT"           enable row level security;
alter table "album"              enable row level security;
alter table "albumCMT"           enable row level security;
alter table "visit"              enable row level security;
alter table "visitCnt"           enable row level security;
alter table "friends"            enable row level security;
alter table "friendCMT"          enable row level security;
alter table "loginStatus"        enable row level security;
alter table "loginLog"           enable row level security;
alter table "notiRead"           enable row level security;
alter table "plazaChat"          enable row level security;
alter table "forestRecord"       enable row level security;

commit;

-- ---------------------------------------------------------------------
-- 이미 만들어 둔 DB 에 나중에 추가된 컬럼 (전체를 다시 만들 필요 없이 이것만 실행)
--
--   -- 일촌 승인 시각. 알림을 '일촌 맺은 뒤' 글만 보내려고 추가.
--   alter table "friends" add column if not exists "acceptDate" timestamptz;
--
-- 값이 비어 있는(이 컬럼 생기기 전에 맺은) 관계는 코드가 createDate 로 대신 본다.
-- 굳이 채워 두고 싶으면:
--   update "friends" set "acceptDate" = "createDate"
--    where "fStatus" = 1 and "acceptDate" is null;
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- RLS 는 위 트랜잭션 안에서 이미 켰다.
--
-- Supabase SQL Editor 가 "Run without RLS / Run and enable RLS" 를 물어보면
-- >>> "Run without RLS" <<< 를 고를 것.
-- 이 스크립트가 알아서 켜기 때문이고, 에디터가 자동으로 붙이는 문장은
-- 테이블 이름에 따옴표를 안 붙여서 예약어인 user 에서 에러가 난다.
--
-- 나중에 브라우저에서 anon 키로 직접 호출할 일이 생기면 그때 테이블별
-- policy 를 설계할 것.
--
--   create policy ... on "user" for select using (...);
-- ---------------------------------------------------------------------
