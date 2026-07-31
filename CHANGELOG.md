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

> 알림 기능은 추가 SQL이 필요 없습니다(기존 테이블에서 파생 + 읽음 상태는 쿠키).

---

## 기능 추가

### 알림 (우측 상단 🔔)
- 안 읽은 알림이 있으면 빨간 배지, **모두 읽음** 버튼, 알림 클릭 시 개별 읽음 처리(누르면 사라짐).
- 대상:
  - 내 게시판/사진첩/다이어리 **댓글**, **일촌평**, **방명록**, 받은 **일촌 신청**
  - **일촌(수락된 친구)이 올린 새 콘텐츠** — 게시글 🆕 / 사진 🖼️ / 다이어리 ✨
- 이벤트 테이블 없이 기존 데이터에서 파생, 읽음 시각/개별 읽음은 httpOnly 쿠키.

### 방명록
- 미니홈피 주인이 방문글에 **답글**(방문글과 동일한 미니미+날짜 레이아웃), "비밀로하기" 제거.

### 게시판 / 사진첩 댓글
- 댓글에 **답글(대댓글)** — 부모 댓글 아래 └> 세로 들여쓰기(공용 `CommentThread`).
- 사진첩에 댓글 기능 신규 추가.
- 게시판 목록에 글별 **댓글 수** 컬럼.

### BGM
- 내 미니홈피 진입 시 **자동 재생**, 다른 홈 방문 시 정지.
- '벌써 1년'(브라운아이드소울) 메타데이터 교정.

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

## 버그 수정
- 다이어리 작성 직후 안 보이던 문제(서버 UTC vs KST) → 오늘 글 없으면 최신 글 폴백.
- 접속 지연 개선(mainView DB 왕복 병렬화 + 방문수 증가 `after()`).
- **BGM 관리 중복**: 재생목록에 넣은 곡이 '보유 BGM'에도 떠서 두 개로 보이던 문제 수정.

## 모바일 (반응형)
- 1080×660 고정 "책"을 좁은 화면에서 **세로 1단**으로 리플로우, 모바일은 팝업 대신 전체화면 진입.
- 내부 서브 창(미니룸/미니미/프로필 편집)은 모바일에서 새 탭 전체화면.

## 개발 메모
- Windows dev: `.next` 캐시가 Defender/인덱서에 잠기면 `page_client-reference-manifest.js` UNKNOWN 에러 → 코드 문제 아님(폴더를 Downloads 밖으로 or Defender 예외).
- build↔dev 전환 시 `npm run clean`.
