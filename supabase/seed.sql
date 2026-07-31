-- =====================================================================
-- HelloWorld 미니홈피 — 시드 데이터
-- lib/db/seed.ts 에서 자동 생성됨. 직접 수정하지 말고 seed.ts 를 고친 뒤
--   npm run seed:sql
-- 을 다시 실행할 것.
--
-- 적용: schema.sql 을 먼저 실행한 뒤 이 파일을 실행한다.
-- 시드 계정 비밀번호는 모두 1234 이다.
-- =====================================================================

begin;

-- user (4)
insert into "user" ("userEmail", "userPassword", "userName", "userNickname", "userGender", "userBirth", "userPhone", "createDate", "userAvailable") values
  ('demo@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '한제인', '제인', 'F', '1995-04-12', '010-1234-5678', '2026-01-11T14:57:17.136Z', 'Y'),
  ('minho@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '강민호', '민호', 'M', '1996-09-01', '010-2222-3333', '2026-01-21T14:57:17.136Z', 'Y'),
  ('soyul@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '배소율', '소율', 'F', '1997-02-20', '010-4444-5555', '2026-01-31T14:57:17.136Z', 'Y'),
  ('dain@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '문다인', '다인', 'F', '1998-11-30', '010-6666-7777', '2026-02-10T14:57:17.136Z', 'Y');

-- dotori (4)
insert into "dotori" ("userNickname", "currentDotori") values
  ('제인', 250),
  ('민호', 120),
  ('소율', 80),
  ('다인', 40);

-- dotoriC (4)
insert into "dotoriC" ("userNickname", "dotoriCharge", "dotoriChargeDate", "dotoriChargeMethod", "dotoriPrice") values
  ('제인', 100, '2026-01-11T14:57:17.136Z', '회원가입 축하 포인트', '0'),
  ('민호', 100, '2026-01-21T14:57:17.136Z', '회원가입 축하 포인트', '0'),
  ('소율', 100, '2026-01-31T14:57:17.136Z', '회원가입 축하 포인트', '0'),
  ('다인', 100, '2026-02-10T14:57:17.136Z', '회원가입 축하 포인트', '0');

-- store (94)
insert into "store" ("seq", "category", "productName", "contentPath", "productPrice") values
  (1, 'minimi', '발록', '/resources/images/minimi/balokIcon.gif', '5'),
  (2, 'minimi', '블록 골렘', '/resources/images/minimi/blockGolemIcon.gif', '10'),
  (3, 'minimi', '파란 버섯', '/resources/images/minimi/blueMushroomIcon.gif', '15'),
  (4, 'minimi', '부기', '/resources/images/minimi/boogieIcon.gif', '20'),
  (5, 'minimi', '책 읽는 토끼', '/resources/images/minimi/bookRabbitIcon.gif', '5'),
  (6, 'minimi', '브라운 테디', '/resources/images/minimi/brownTeddyIcon.gif', '10'),
  (7, 'minimi', '버블 피쉬', '/resources/images/minimi/bubbleFishIcon.gif', '15'),
  (8, 'minimi', '버니', '/resources/images/minimi/bunnyIcon.gif', '20'),
  (9, 'minimi', '다크 예티', '/resources/images/minimi/darkYetiIcon.gif', '5'),
  (10, 'minimi', '드레이크', '/resources/images/minimi/drakeIcon.gif', '10'),
  (11, 'minimi', '오리 가족', '/resources/images/minimi/duckyFamilyIcon.gif', '15'),
  (12, 'minimi', '엘리자', '/resources/images/minimi/elizaIcon.gif', '20'),
  (13, 'minimi', '이블아이', '/resources/images/minimi/evileyeIcon.gif', '5'),
  (14, 'minimi', '엑스텀프', '/resources/images/minimi/extumpIcon.gif', '10'),
  (15, 'minimi', '요정', '/resources/images/minimi/fairyIcon.gif', '15'),
  (16, 'minimi', '플라워 피쉬', '/resources/images/minimi/flowerFishIcon.gif', '20'),
  (17, 'minimi', '고블린', '/resources/images/minimi/goblinIcon.gif', '5'),
  (18, 'minimi', '고비', '/resources/images/minimi/gobyIcon.gif', '10'),
  (19, 'minimi', '그레이', '/resources/images/minimi/greiIcon.gif', '15'),
  (20, 'minimi', '그루핀', '/resources/images/minimi/grupinIcon.gif', '20'),
  (21, 'minimi', '구미호', '/resources/images/minimi/gumihoIcon.gif', '5'),
  (22, 'minimi', '헥터', '/resources/images/minimi/hectorIcon.gif', '10'),
  (23, 'minimi', '헬리콥터', '/resources/images/minimi/helicopterIcon.gif', '15'),
  (24, 'minimi', '호랑', '/resources/images/minimi/horangIcon.gif', '20'),
  (25, 'minimi', '뿔 고블린', '/resources/images/minimi/hornGoblinIcon.gif', '5'),
  (26, 'minimi', '자쿰', '/resources/images/minimi/jakumIcon.gif', '10'),
  (27, 'minimi', '주니어 불독', '/resources/images/minimi/juniorBulldogIcon.gif', '15'),
  (28, 'minimi', '주니어 다크 예티', '/resources/images/minimi/juniorDarkYetiIcon.gif', '20'),
  (29, 'minimi', '주니어 물범', '/resources/images/minimi/juniorSealIcon.gif', '5'),
  (30, 'minimi', '크래피', '/resources/images/minimi/krappyIcon.gif', '10'),
  (31, 'minimi', '레이스', '/resources/images/minimi/laceIcon.gif', '15'),
  (32, 'minimi', '리게이터', '/resources/images/minimi/ligatorIcon.gif', '20'),
  (33, 'minimi', '루시다', '/resources/images/minimi/lucidaIcon.gif', '5'),
  (34, 'minimi', '마션', '/resources/images/minimi/martianIcon.gif', '10'),
  (35, 'minimi', '마스크 피쉬', '/resources/images/minimi/maskFishIcon.gif', '15'),
  (36, 'minimi', '미믹', '/resources/images/minimi/mimicIcon.gif', '20'),
  (37, 'minimi', '네이키', '/resources/images/minimi/nakeyIcon.gif', '5'),
  (38, 'minimi', '네펜데스', '/resources/images/minimi/nependeathIcon.gif', '10'),
  (39, 'minimi', '노바', '/resources/images/minimi/Nova_2Icon.gif', '15'),
  (40, 'minimi', '문어', '/resources/images/minimi/octopusIcon.gif', '20'),
  (41, 'minimi', '주황 버섯', '/resources/images/minimi/orangeMushroomIcon.gif', '5'),
  (42, 'minimi', '파풀라투스', '/resources/images/minimi/papulatusIcon.gif', '10'),
  (43, 'minimi', '페페', '/resources/images/minimi/PepeIcon.gif', '15'),
  (44, 'minimi', '피아누스', '/resources/images/minimi/pianusIcon.gif', '20'),
  (45, 'minimi', '핀붐', '/resources/images/minimi/pinboomIcon.gif', '5'),
  (46, 'minimi', '뿌빠', '/resources/images/minimi/poopaIcon.gif', '10'),
  (47, 'minimi', '쥐돌이', '/resources/images/minimi/ratsIcon.gif', '15'),
  (48, 'minimi', '빨간 달팽이', '/resources/images/minimi/redSnailIcon.gif', '20'),
  (49, 'minimi', '리본 돼지', '/resources/images/minimi/ribbonPigIcon.gif', '5'),
  (50, 'minimi', '리칸슬로프', '/resources/images/minimi/rikanslofIcon.gif', '10'),
  (51, 'minimi', '리셀 스퀴드', '/resources/images/minimi/risellSquidIcon.gif', '15'),
  (52, 'minimi', '로보', '/resources/images/minimi/roboIcon.gif', '20'),
  (53, 'minimi', '루팡', '/resources/images/minimi/rupanIcon.gif', '5'),
  (54, 'minimi', '스쿠버 페페', '/resources/images/minimi/scubaPepeIcon.gif', '10'),
  (55, 'minimi', '시클', '/resources/images/minimi/seacleIcon.gif', '15'),
  (56, 'minimi', '상어', '/resources/images/minimi/sharkIcon.gif', '20'),
  (57, 'minimi', '슬라임', '/resources/images/minimi/slimeIcon.gif', '5'),
  (58, 'minimi', '소울 테디', '/resources/images/minimi/soulTeddyIcon.gif', '10'),
  (59, 'minimi', '스파커', '/resources/images/minimi/sparkerIcon.gif', '15'),
  (60, 'minimi', '스타 픽시', '/resources/images/minimi/starPixieIcon.gif', '20'),
  (61, 'minimi', '스티지', '/resources/images/minimi/steazyIcon.gif', '5'),
  (62, 'minimi', '스톤 볼', '/resources/images/minimi/stoneBallIcon.gif', '10'),
  (63, 'minimi', '스톤 골렘', '/resources/images/minimi/stonGolemIcon.gif', '15'),
  (64, 'minimi', '타우로마시스', '/resources/images/minimi/tauromasisIcon.gif', '20'),
  (65, 'minimi', '틱톡', '/resources/images/minimi/ticktockIcon.gif', '5'),
  (66, 'minimi', '타이머', '/resources/images/minimi/timerIcon.gif', '10'),
  (67, 'minimi', '토이 트로이', '/resources/images/minimi/toyTrojanIcon.gif', '15'),
  (68, 'minimi', '벌처', '/resources/images/minimi/vultureIcon.gif', '20'),
  (69, 'minimi', '와일드 카고', '/resources/images/minimi/wildCargoIcon.gif', '5'),
  (70, 'minimi', '원로 그레이', '/resources/images/minimi/wonroGreiIcon.gif', '10'),
  (71, 'minimi', '좀비', '/resources/images/minimi/zombiIcon.gif', '15'),
  (72, 'minimi', '기본 미니미', '/resources/images/default/defaultMinimiIcon.gif', '0'),
  (73, 'skin', '기본 스킨', 'rgb(42, 140, 168)', '0'),
  (74, 'skin', '검정', 'black', '10'),
  (75, 'skin', '빨강', 'red', '10'),
  (76, 'skin', '노랑', 'yellow', '10'),
  (77, 'skin', '초록', 'green', '10'),
  (78, 'skin', '회색', 'grey', '10'),
  (79, 'skin', '라임', 'lime', '10'),
  (80, 'skin', '하양', 'white', '10'),
  (81, 'skin', '보라', 'purple', '10'),
  (82, 'skin', '파랑', 'blue', '10'),
  (83, 'skin', '네이비', 'navy', '10'),
  (84, 'menu', '기본 메뉴', 'rgb(42, 140, 168)', '0'),
  (85, 'menu', '검정', 'black', '10'),
  (86, 'menu', '빨강', 'red', '10'),
  (87, 'menu', '노랑', 'yellow', '10'),
  (88, 'menu', '초록', 'green', '10'),
  (89, 'menu', '회색', 'grey', '10'),
  (90, 'menu', '라임', 'lime', '10'),
  (91, 'menu', '하양', 'white', '10'),
  (92, 'menu', '보라', 'purple', '10'),
  (93, 'menu', '파랑', 'blue', '10'),
  (94, 'menu', '네이비', 'navy', '10');
select setval(pg_get_serial_sequence('"store"', 'seq'), (select max("seq") from "store"));

-- userStorage (21)
insert into "userStorage" ("userNickname", "category", "productName", "contentPath", "buy_date", "allocation") values
  ('제인', 'minimi', '기본 미니미', '/resources/images/default/defaultMinimiIcon.gif', '2026-01-11T14:57:17.136Z', 1),
  ('제인', 'skin', '기본 스킨', 'rgb(42, 140, 168)', '2026-01-11T14:57:17.136Z', 1),
  ('제인', 'menu', '기본 메뉴', 'rgb(42, 140, 168)', '2026-01-11T14:57:17.136Z', 1),
  ('민호', 'minimi', '기본 미니미', '/resources/images/default/defaultMinimiIcon.gif', '2026-01-11T14:57:17.136Z', 1),
  ('민호', 'skin', '기본 스킨', 'rgb(42, 140, 168)', '2026-01-11T14:57:17.136Z', 1),
  ('민호', 'menu', '기본 메뉴', 'rgb(42, 140, 168)', '2026-01-11T14:57:17.136Z', 1),
  ('소율', 'minimi', '기본 미니미', '/resources/images/default/defaultMinimiIcon.gif', '2026-01-11T14:57:17.136Z', 1),
  ('소율', 'skin', '기본 스킨', 'rgb(42, 140, 168)', '2026-01-11T14:57:17.136Z', 1),
  ('소율', 'menu', '기본 메뉴', 'rgb(42, 140, 168)', '2026-01-11T14:57:17.136Z', 1),
  ('다인', 'minimi', '기본 미니미', '/resources/images/default/defaultMinimiIcon.gif', '2026-01-11T14:57:17.136Z', 1),
  ('다인', 'skin', '기본 스킨', 'rgb(42, 140, 168)', '2026-01-11T14:57:17.136Z', 1),
  ('다인', 'menu', '기본 메뉴', 'rgb(42, 140, 168)', '2026-01-11T14:57:17.136Z', 1),
  ('제인', 'skin', '빨강', 'red', '2026-07-10T14:57:17.136Z', 0),
  ('제인', 'menu', '빨강', 'red', '2026-07-10T14:57:17.136Z', 0),
  ('제인', 'skin', '네이비', 'navy', '2026-07-10T14:57:17.136Z', 0),
  ('제인', 'menu', '네이비', 'navy', '2026-07-10T14:57:17.136Z', 0),
  ('제인', 'skin', '보라', 'purple', '2026-07-10T14:57:17.136Z', 0),
  ('제인', 'menu', '보라', 'purple', '2026-07-10T14:57:17.136Z', 0),
  ('제인', 'minimi', '슬라임', '/resources/images/minimi/slimeIcon.gif', '2026-07-15T14:57:17.136Z', 0),
  ('제인', 'minimi', '주황 버섯', '/resources/images/minimi/orangeMushroomIcon.gif', '2026-07-15T14:57:17.136Z', 0),
  ('제인', 'minimi', '스타 픽시', '/resources/images/minimi/starPixieIcon.gif', '2026-07-15T14:57:17.136Z', 0);

-- bgm (14)
insert into "bgm" ("seq", "title", "artist", "runningTime", "bgmPrice", "contentPath") values
  (1, '벌써 1년', '브라운아이드소울', '04:12', '15', '/resources/sounds/Already1Year.mp3'),
  (2, '가시', 'Buzz', '04:05', '15', '/resources/sounds/buzz-gasi.mp3'),
  (3, '고백', '델리스파이스', '03:41', '15', '/resources/sounds/Confession.mp3'),
  (4, 'Rising Sun', '동방신기', '05:02', '15', '/resources/sounds/dongbangsinki-risingSun.mp3'),
  (5, '응급실', 'izi', '04:23', '15', '/resources/sounds/EmergencyRoom.mp3'),
  (6, 'For You', '에메랄드 캐슬', '04:30', '15', '/resources/sounds/ForYou.mp3'),
  (7, 'I Believe', '신승훈', '04:16', '15', '/resources/sounds/IBelieve.mp3'),
  (8, 'Never Ending Story', '부활', '04:52', '15', '/resources/sounds/NeverEndingStory.mp3'),
  (9, '한잔의 추억', '이장희', '03:22', '15', '/resources/sounds/OneDrink.mp3'),
  (10, '다시 사랑한다 말할까', '김동률', '04:47', '15', '/resources/sounds/ShouldIsayILoveAgain.mp3'),
  (11, 'Miracle', '슈퍼주니어', '03:38', '15', '/resources/sounds/superJunior-miracle.mp3'),
  (12, '가시나무', '시인과 촌장', '04:01', '15', '/resources/sounds/Thorn.mp3'),
  (13, 'Bo Peep Bo Peep', '티아라', '03:29', '15', '/resources/sounds/tiara-boPeepBoPeep.mp3'),
  (14, 'Timeless', 'SG워너비', '04:35', '15', '/resources/sounds/Timeless.mp3');
select setval(pg_get_serial_sequence('"bgm"', 'seq'), (select max("seq") from "bgm"));

-- userBgm (5)
insert into "userBgm" ("userNickname", "title", "artist", "runningTime", "contentPath", "allocation") values
  ('제인', '벌써 1년', '브라운아이드소울', '04:12', '/resources/sounds/Already1Year.mp3', 1),
  ('제인', '가시', 'Buzz', '04:05', '/resources/sounds/buzz-gasi.mp3', 1),
  ('제인', '고백', '델리스파이스', '03:41', '/resources/sounds/Confession.mp3', 0),
  ('제인', 'Rising Sun', '동방신기', '05:02', '/resources/sounds/dongbangsinki-risingSun.mp3', 0),
  ('민호', 'Never Ending Story', '부활', '04:52', '/resources/sounds/NeverEndingStory.mp3', 1);

-- profile (4)
insert into "profile" ("userNickname", "image", "msg", "create_date", "update_date") values
  ('제인', 'defaultProfile.png', '체험 계정입니다.
글도 써 보고 미니룸도 꾸며 보세요.', '2026-06-30T14:57:17.136Z', '2026-06-30T14:57:17.136Z'),
  ('민호', 'defaultProfile.png', '오늘도 코딩 중.', '2026-06-30T14:57:17.136Z', '2026-06-30T14:57:17.136Z'),
  ('소율', 'defaultProfile.png', '음악과 함께하는 하루', '2026-06-30T14:57:17.136Z', '2026-06-30T14:57:17.136Z'),
  ('다인', 'defaultProfile.png', '사진 찍는 걸 좋아합니다.', '2026-06-30T14:57:17.136Z', '2026-06-30T14:57:17.136Z');

-- miniHomeTitle (4)
insert into "miniHomeTitle" ("userNickname", "title", "update_date") values
  ('제인', '제인의 미니홈피에 오신 걸 환영합니다.', '2026-07-20T14:57:17.136Z'),
  ('민호', '민호의 미니홈피', '2026-07-20T14:57:17.136Z'),
  ('소율', '소율의 작은 방', '2026-07-20T14:57:17.136Z'),
  ('다인', '다인의 사진 창고', '2026-07-20T14:57:17.136Z');

-- miniroomBackground (4)
insert into "miniroomBackground" ("userNickname", "backgroundName", "backgroundPath") values
  ('제인', 'defaultBg', '/resources/images/default/defaultBg.jpg'),
  ('민호', 'defaultBg', '/resources/images/default/defaultBg.jpg'),
  ('소율', 'defaultBg', '/resources/images/default/defaultBg.jpg'),
  ('다인', 'defaultBg', '/resources/images/default/defaultBg.jpg');

-- miniroomMinimi (4)
insert into "miniroomMinimi" ("userNickname", "minimiName", "minimiPath", "minimiLeft", "minimiTop") values
  ('제인', 'defaultMinimiIcon', '/resources/images/default/defaultMinimiIcon.gif', '390px', '163px'),
  ('민호', 'defaultMinimiIcon', '/resources/images/default/defaultMinimiIcon.gif', '390px', '163px'),
  ('소율', 'defaultMinimiIcon', '/resources/images/default/defaultMinimiIcon.gif', '390px', '163px'),
  ('다인', 'defaultMinimiIcon', '/resources/images/default/defaultMinimiIcon.gif', '390px', '163px');

-- notice (7)
insert into "notice" ("seq", "writer", "title", "content", "create_date", "update_date", "del_yn") values
  (1, '관리자', 'HelloWorld 오픈 안내', 'HelloWorld 미니홈피 서비스가 정식 오픈했습니다.
많은 이용 부탁드립니다.', '2026-07-23T14:57:17.136Z', '2026-07-23T14:57:17.136Z', 'N'),
  (2, '관리자', '도토리 충전 이벤트', '이번 달 도토리 충전 시 10% 추가 적립 이벤트를 진행합니다.', '2026-07-24T14:57:17.136Z', '2026-07-24T14:57:17.136Z', 'N'),
  (3, '관리자', 'BGM 신곡 업데이트', '추억의 명곡 14곡이 새로 추가되었습니다. 상점에서 확인해 주세요.', '2026-07-25T14:57:17.136Z', '2026-07-25T14:57:17.136Z', 'N'),
  (4, '관리자', '미니미 신상 입고', '미니미 70여 종이 상점에 새로 들어왔습니다.', '2026-07-26T14:57:17.136Z', '2026-07-26T14:57:17.136Z', 'N'),
  (5, '관리자', '서버 점검 안내', '매주 화요일 새벽 2시 ~ 4시 정기 점검이 진행됩니다.', '2026-07-27T14:57:17.136Z', '2026-07-27T14:57:17.136Z', 'N'),
  (6, '관리자', '개인정보 처리방침 개정 안내', '개인정보 처리방침이 일부 개정되었습니다.', '2026-07-28T14:57:17.136Z', '2026-07-28T14:57:17.136Z', 'N'),
  (7, '관리자', '일촌 신청 기능 개선', '일촌 신청 및 수락 흐름이 더 편해졌습니다.', '2026-07-29T14:57:17.136Z', '2026-07-29T14:57:17.136Z', 'N');
select setval(pg_get_serial_sequence('"notice"', 'seq'), (select max("seq") from "notice"));

-- board (6)
insert into "board" ("seq", "userNickname", "title", "content", "imagePath", "hits", "create_date", "update_date", "del_yn", "openScope") values
  (1, '제인', '첫 게시글입니다', '미니홈피 게시판 기능을 테스트해 봅니다.<br>잘 동작하네요!', '', 3, '2026-07-30T14:57:17.136Z', '2026-07-30T14:57:17.136Z', 'N', 1),
  (2, '제인', '주말에 다녀온 카페', '분위기가 정말 좋았어요. 다음에 또 가려고요.', '', 5, '2026-07-29T14:57:17.136Z', '2026-07-29T14:57:17.136Z', 'N', 1),
  (3, '제인', '요즘 듣는 노래', 'BGM 으로 걸어둔 곡들 추천합니다.', '', 11, '2026-07-26T14:57:17.136Z', '2026-07-26T14:57:17.136Z', 'N', 1),
  (4, '민호', 'Next.js 로 옮기는 중', 'Spring MVC 로 만들었던 걸 통째로 옮기고 있습니다.', '', 3, '2026-07-30T14:57:17.136Z', '2026-07-30T14:57:17.136Z', 'N', 1),
  (5, '민호', '오늘의 회고', '생각보다 JSP 가 많았다...', '', 15, '2026-07-24T14:57:17.136Z', '2026-07-24T14:57:17.136Z', 'N', 1),
  (6, '다인', '사진 정리', '사진첩에 사진 몇 장 올렸어요.', '', 7, '2026-07-28T14:57:17.136Z', '2026-07-28T14:57:17.136Z', 'N', 1);
select setval(pg_get_serial_sequence('"board"', 'seq'), (select max("seq") from "board"));

-- boardCMT (2)
insert into "boardCMT" ("boardSeq", "userNickname", "content", "create_date", "update_date", "openScope") values
  (1, '민호', '오 잘 되네요!', '2026-07-30T11:57:17.136Z', '2026-07-30T11:57:17.136Z', 1),
  (1, '제인', '감사합니다 :)', '2026-07-30T13:57:17.136Z', '2026-07-30T13:57:17.136Z', 1);

-- diary (4)
insert into "diary" ("seq", "userNickname", "title", "content", "hits", "create_date", "update_date", "diary_date", "del_yn", "openScope") values
  (1, '제인', '오늘의 일기', '미니홈피를 다시 만들었다. 옛날 생각이 많이 났다.', 0, '2026-07-30T14:57:17.136Z', '2026-07-30T14:57:17.136Z', '2026-07-30', 'n', 1),
  (2, '제인', '어제의 일기', '오랜만에 친구들과 통화했다.', 0, '2026-07-29T14:57:17.136Z', '2026-07-29T14:57:17.136Z', '2026-07-29', 'n', 1),
  (3, '제인', '지난 주말', '집에서 푹 쉬었다.', 0, '2026-07-27T14:57:17.136Z', '2026-07-27T14:57:17.136Z', '2026-07-27', 'n', 1),
  (4, '민호', '이사 완료', '드디어 마이그레이션 끝!', 0, '2026-07-30T14:57:17.136Z', '2026-07-30T14:57:17.136Z', '2026-07-30', 'n', 1);
select setval(pg_get_serial_sequence('"diary"', 'seq'), (select max("seq") from "diary"));

-- diaryCMT (1)
insert into "diaryCMT" ("diarySeq", "userNickname", "content", "create_date", "openScope") values
  (1, '민호', '나도 그때 생각난다 ㅎㅎ', '2026-07-30T12:57:17.136Z', 1);

-- album (3)
insert into "album" ("seq", "userNickname", "title", "content", "imagePath", "create_date", "update_date", "del_yn", "openScope") values
  (1, '제인', '강아지 사진', '산책 나갔다가 찍었어요.', 'albumPuppy.jpg', '2026-07-29T14:57:17.136Z', '2026-07-29T14:57:17.136Z', 'N', 1),
  (2, '제인', '첫 앨범', '기본 앨범 이미지입니다.', 'albumImg1.jpg', '2026-07-25T14:57:17.136Z', '2026-07-25T14:57:17.136Z', 'N', 1),
  (3, '다인', '고양이', '동네 고양이', 'albumPuppy.jpg', '2026-07-28T14:57:17.136Z', '2026-07-28T14:57:17.136Z', 'N', 1);
select setval(pg_get_serial_sequence('"album"', 'seq'), (select max("seq") from "album"));

-- visit (3)
insert into "visit" ("userNickname", "targetNickname", "content", "create_date", "update_date") values
  ('민호', '제인', '방명록 첫 글!
자주 놀러올게요.', '2026-07-29T14:57:17.136Z', '2026-07-29T14:57:17.136Z'),
  ('다인', '제인', '홈피 잘 보고 갑니다 :)', '2026-07-28T14:57:17.136Z', '2026-07-28T14:57:17.136Z'),
  ('제인', '민호', '나도 방문 도장 쾅', '2026-07-30T14:57:17.136Z', '2026-07-30T14:57:17.136Z');

-- visitCnt (4)
insert into "visitCnt" ("userNickname", "todayCnt", "totalCnt") values
  ('제인', 3, 128),
  ('민호', 5, 165),
  ('소율', 7, 202),
  ('다인', 9, 239);

-- friends (3)
insert into "friends" ("userNickname", "friendNickname", "fStatus", "del_yn", "createDate") values
  ('제인', '민호', 1, 'N', '2026-05-31T14:57:17.136Z'),
  ('다인', '민호', 1, 'N', '2026-06-15T14:57:17.136Z'),
  ('소율', '제인', 0, 'N', '2026-07-28T14:57:17.136Z');

-- friendCMT (2)
insert into "friendCMT" ("userNickname", "friendNickname", "content", "createDate", "del_yn") values
  ('민호', '제인', '일촌평 1호 남기고 갑니다 :)', '2026-07-25T14:57:17.136Z', 'n'),
  ('제인', '민호', '홈피 예쁘게 잘 꾸몄네!', '2026-07-27T14:57:17.136Z', 'n');

-- loginStatus (4)
insert into "loginStatus" ("userNickname", "status") values
  ('제인', '1'),
  ('민호', '1'),
  ('소율', '0'),
  ('다인', '0');

commit;
