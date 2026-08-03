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
  ('demo@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '한제인', '제인', 'F', '1995-04-12', '010-1234-5678', '2026-01-15T15:23:47.102Z', 'Y'),
  ('minho@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '강민호', '민호', 'M', '1996-09-01', '010-2222-3333', '2026-01-25T15:23:47.102Z', 'Y'),
  ('soyul@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '배소율', '소율', 'F', '1997-02-20', '010-4444-5555', '2026-02-04T15:23:47.102Z', 'Y'),
  ('dain@gmail.com', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '문다인', '다인', 'F', '1998-11-30', '010-6666-7777', '2026-02-14T15:23:47.102Z', 'Y');

-- dotori (4)
insert into "dotori" ("userNickname", "currentDotori") values
  ('제인', 250),
  ('민호', 120),
  ('소율', 80),
  ('다인', 40);

-- dotoriC (4)
insert into "dotoriC" ("userNickname", "dotoriCharge", "dotoriChargeDate", "dotoriChargeMethod", "dotoriPrice") values
  ('제인', 100, '2026-01-15T15:23:47.102Z', '회원가입 축하 포인트', '0'),
  ('민호', 100, '2026-01-25T15:23:47.102Z', '회원가입 축하 포인트', '0'),
  ('소율', 100, '2026-02-04T15:23:47.102Z', '회원가입 축하 포인트', '0'),
  ('다인', 100, '2026-02-14T15:23:47.102Z', '회원가입 축하 포인트', '0');

-- store (122)
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
  (73, 'minimi', '아구몬', '/resources/images/minimi/agumonIcon.gif', '30'),
  (74, 'minimi', '에어드라몬', '/resources/images/minimi/airdramonIcon.gif', '30'),
  (75, 'minimi', '베르제브몬 블래스트', '/resources/images/minimi/beelzebumonBlastIcon.gif', '30'),
  (76, 'minimi', '치비몬', '/resources/images/minimi/chibimonIcon.gif', '30'),
  (77, 'minimi', '드리모게몬', '/resources/images/minimi/drimogemonIcon.gif', '30'),
  (78, 'minimi', '듀크몬', '/resources/images/minimi/dukemonIcon.gif', '30'),
  (79, 'minimi', '에테몬', '/resources/images/minimi/etemonIcon.gif', '30'),
  (80, 'minimi', '팬텀몬', '/resources/images/minimi/fantomonIcon.gif', '30'),
  (81, 'minimi', '갈고몬', '/resources/images/minimi/galgomonIcon.gif', '30'),
  (82, 'minimi', '게코몬', '/resources/images/minimi/gekomonIcon.gif', '30'),
  (83, 'minimi', '기기몬', '/resources/images/minimi/gigimonIcon.gif', '30'),
  (84, 'minimi', '그레이몬', '/resources/images/minimi/greymonIcon.gif', '30'),
  (85, 'minimi', '임프몬', '/resources/images/minimi/impmonIcon.gif', '30'),
  (86, 'minimi', '코로몬', '/resources/images/minimi/koromonIcon.gif', '30'),
  (87, 'minimi', '마린엔젤몬', '/resources/images/minimi/marinAngemonIcon.gif', '30'),
  (88, 'minimi', '오메가몬 X', '/resources/images/minimi/omegamonXIcon.gif', '30'),
  (89, 'minimi', '파닥몬', '/resources/images/minimi/patamonIcon.gif', '30'),
  (90, 'minimi', '테리어몬', '/resources/images/minimi/terriermonIcon.gif', '30'),
  (91, 'minimi', '토게몬', '/resources/images/minimi/togemonIcon.gif', '30'),
  (92, 'minimi', '츠노몬', '/resources/images/minimi/tsunomonIcon.gif', '30'),
  (93, 'minimi', '브이몬', '/resources/images/minimi/vmonIcon.gif', '30'),
  (94, 'minimi', '워그레이몬 X', '/resources/images/minimi/warGreymonXIcon.gif', '30'),
  (95, 'minimi', '마리오', '/resources/images/minimi/marioIcon.gif', '20'),
  (96, 'minimi', '요시', '/resources/images/minimi/yoshiIcon.gif', '20'),
  (97, 'minimi', '피카츄', '/resources/images/minimi/pikachuIcon.gif', '20'),
  (98, 'minimi', '피카츄 (모자)', '/resources/images/minimi/pikachuDotIcon.gif', '20'),
  (99, 'minimi', '라프라스', '/resources/images/minimi/laprasIcon.gif', '20'),
  (100, 'minimi', '가브몬', '/resources/images/minimi/gabumonIcon.gif', '20'),
  (101, 'skin', '기본 스킨', 'rgb(42, 140, 168)', '0'),
  (102, 'skin', '검정', 'black', '10'),
  (103, 'skin', '빨강', 'red', '10'),
  (104, 'skin', '노랑', 'yellow', '10'),
  (105, 'skin', '초록', 'green', '10'),
  (106, 'skin', '회색', 'grey', '10'),
  (107, 'skin', '라임', 'lime', '10'),
  (108, 'skin', '하양', 'white', '10'),
  (109, 'skin', '보라', 'purple', '10'),
  (110, 'skin', '파랑', 'blue', '10'),
  (111, 'skin', '네이비', 'navy', '10'),
  (112, 'menu', '기본 메뉴', 'rgb(42, 140, 168)', '0'),
  (113, 'menu', '검정', 'black', '10'),
  (114, 'menu', '빨강', 'red', '10'),
  (115, 'menu', '노랑', 'yellow', '10'),
  (116, 'menu', '초록', 'green', '10'),
  (117, 'menu', '회색', 'grey', '10'),
  (118, 'menu', '라임', 'lime', '10'),
  (119, 'menu', '하양', 'white', '10'),
  (120, 'menu', '보라', 'purple', '10'),
  (121, 'menu', '파랑', 'blue', '10'),
  (122, 'menu', '네이비', 'navy', '10');
select setval(pg_get_serial_sequence('"store"', 'seq'), (select max("seq") from "store"));

-- userStorage (21)
insert into "userStorage" ("userNickname", "category", "productName", "contentPath", "buy_date", "allocation") values
  ('제인', 'minimi', '기본 미니미', '/resources/images/default/defaultMinimiIcon.gif', '2026-01-15T15:23:47.102Z', 1),
  ('제인', 'skin', '기본 스킨', 'rgb(42, 140, 168)', '2026-01-15T15:23:47.102Z', 1),
  ('제인', 'menu', '기본 메뉴', 'rgb(42, 140, 168)', '2026-01-15T15:23:47.102Z', 1),
  ('민호', 'minimi', '기본 미니미', '/resources/images/default/defaultMinimiIcon.gif', '2026-01-15T15:23:47.102Z', 1),
  ('민호', 'skin', '기본 스킨', 'rgb(42, 140, 168)', '2026-01-15T15:23:47.102Z', 1),
  ('민호', 'menu', '기본 메뉴', 'rgb(42, 140, 168)', '2026-01-15T15:23:47.102Z', 1),
  ('소율', 'minimi', '기본 미니미', '/resources/images/default/defaultMinimiIcon.gif', '2026-01-15T15:23:47.102Z', 1),
  ('소율', 'skin', '기본 스킨', 'rgb(42, 140, 168)', '2026-01-15T15:23:47.102Z', 1),
  ('소율', 'menu', '기본 메뉴', 'rgb(42, 140, 168)', '2026-01-15T15:23:47.102Z', 1),
  ('다인', 'minimi', '기본 미니미', '/resources/images/default/defaultMinimiIcon.gif', '2026-01-15T15:23:47.102Z', 1),
  ('다인', 'skin', '기본 스킨', 'rgb(42, 140, 168)', '2026-01-15T15:23:47.102Z', 1),
  ('다인', 'menu', '기본 메뉴', 'rgb(42, 140, 168)', '2026-01-15T15:23:47.102Z', 1),
  ('제인', 'skin', '빨강', 'red', '2026-07-14T15:23:47.102Z', 0),
  ('제인', 'menu', '빨강', 'red', '2026-07-14T15:23:47.102Z', 0),
  ('제인', 'skin', '네이비', 'navy', '2026-07-14T15:23:47.102Z', 0),
  ('제인', 'menu', '네이비', 'navy', '2026-07-14T15:23:47.102Z', 0),
  ('제인', 'skin', '보라', 'purple', '2026-07-14T15:23:47.102Z', 0),
  ('제인', 'menu', '보라', 'purple', '2026-07-14T15:23:47.102Z', 0),
  ('제인', 'minimi', '슬라임', '/resources/images/minimi/slimeIcon.gif', '2026-07-19T15:23:47.102Z', 0),
  ('제인', 'minimi', '주황 버섯', '/resources/images/minimi/orangeMushroomIcon.gif', '2026-07-19T15:23:47.102Z', 0),
  ('제인', 'minimi', '스타 픽시', '/resources/images/minimi/starPixieIcon.gif', '2026-07-19T15:23:47.102Z', 0);

-- bgm (35)
insert into "bgm" ("seq", "title", "artist", "runningTime", "bgmPrice", "contentPath") values
  (1, '벌써 1년', '브라운아이드소울', '03:28', '15', '/resources/sounds/Already1Year.mp3'),
  (2, '가시', 'Buzz', '04:02', '15', '/resources/sounds/buzz-gasi.mp3'),
  (3, '고백', '델리스파이스', '05:25', '15', '/resources/sounds/Confession.mp3'),
  (4, 'Rising Sun', '동방신기', '04:40', '15', '/resources/sounds/dongbangsinki-risingSun.mp3'),
  (5, '응급실', 'izi', '03:44', '15', '/resources/sounds/EmergencyRoom.mp3'),
  (6, 'For You', '에메랄드 캐슬', '04:06', '15', '/resources/sounds/ForYou.mp3'),
  (7, 'I Believe', '신승훈', '04:43', '15', '/resources/sounds/IBelieve.mp3'),
  (8, 'Never Ending Story', '부활', '04:15', '15', '/resources/sounds/NeverEndingStory.mp3'),
  (9, '한잔의 추억', '이장희', '04:51', '15', '/resources/sounds/OneDrink.mp3'),
  (10, '다시 사랑한다 말할까', '김동률', '04:48', '15', '/resources/sounds/ShouldIsayILoveAgain.mp3'),
  (11, 'Miracle', '슈퍼주니어', '02:57', '15', '/resources/sounds/superJunior-miracle.mp3'),
  (12, '가시나무', '시인과 촌장', '04:02', '15', '/resources/sounds/Thorn.mp3'),
  (13, 'Bo Peep Bo Peep', '티아라', '03:45', '15', '/resources/sounds/tiara-boPeepBoPeep.mp3'),
  (14, 'Timeless', 'SG워너비', '03:55', '15', '/resources/sounds/Timeless.mp3'),
  (15, '사랑 안해', '백지영', '04:13', '15', '/resources/sounds/baekjiyoung-iWontLove.mp3'),
  (16, '낙원 (Feat. 이재훈)', '싸이', '03:42', '15', '/resources/sounds/psy-paradise.mp3'),
  (17, 'Fly (Feat. Amin.J)', '에픽하이', '03:21', '15', '/resources/sounds/epikhigh-fly.mp3'),
  (18, '천하무적', 'MC몽', '03:30', '15', '/resources/sounds/mcmong-invincible.mp3'),
  (19, 'I Love U Oh Thank U (Feat. 김태우)', 'MC몽', '04:13', '15', '/resources/sounds/mcmong-iLoveUOhThankU.mp3'),
  (20, '아이스크림', 'MC몽', '03:36', '15', '/resources/sounds/mcmong-iceCream.mp3'),
  (21, '못된 여자 Ⅱ (With 서인영)', '원투', '03:59', '15', '/resources/sounds/onetwo-badGirl2.mp3'),
  (22, 'Must Have Love', 'SG워너비, 브라운아이드걸스', '04:20', '15', '/resources/sounds/sgwannabe-mustHaveLove.mp3'),
  (23, '해바라기 (Feat. 써니사이드 MJ)', '가비엔제이', '03:41', '15', '/resources/sounds/gavynj-sunflower.mp3'),
  (24, '기억을 걷는 시간', '넬', '05:13', '15', '/resources/sounds/nell-timeWalkingOnMemory.mp3'),
  (25, '사랑했잖아', '린', '04:01', '15', '/resources/sounds/lyn-iLovedYou.mp3'),
  (26, '몽환의 숲 (Feat. 이루마)', '키네틱플로우', '04:05', '15', '/resources/sounds/kineticflow-dreamyForest.mp3'),
  (27, '눈의 꽃', '박효신', '05:40', '15', '/resources/sounds/parkhyoshin-snowFlower.mp3'),
  (28, '밤하늘의 별을 (With KCM & 노누)', '양정승', '03:44', '15', '/resources/sounds/yangjeongseung-starsInTheNight.mp3'),
  (29, '우산 (Feat. 윤하)', '에픽하이', '05:02', '15', '/resources/sounds/epikhigh-umbrella.mp3'),
  (30, '세글자', '엠투엠', '03:52', '15', '/resources/sounds/m2m-threeWords.mp3'),
  (31, '까만안경 (Feat. 데이라이트)', '이루', '04:10', '15', '/resources/sounds/eru-blackGlasses.mp3'),
  (32, '소주 한 잔', '임창정', '04:51', '15', '/resources/sounds/limchangjung-oneShotOfSoju.mp3'),
  (33, '청혼', '노을', '04:27', '15', '/resources/sounds/noel-proposal.mp3'),
  (34, 'Y (Please Tell Me Why)', '프리스타일', '04:40', '15', '/resources/sounds/freestyle-y.mp3'),
  (35, '화분', '알렉스', '04:26', '15', '/resources/sounds/alex-flowerpot.mp3');
select setval(pg_get_serial_sequence('"bgm"', 'seq'), (select max("seq") from "bgm"));

-- userBgm (5)
insert into "userBgm" ("userNickname", "title", "artist", "runningTime", "contentPath", "allocation") values
  ('제인', '벌써 1년', '브라운아이드소울', '03:28', '/resources/sounds/Already1Year.mp3', 1),
  ('제인', '가시', 'Buzz', '04:02', '/resources/sounds/buzz-gasi.mp3', 1),
  ('제인', '고백', '델리스파이스', '05:25', '/resources/sounds/Confession.mp3', 0),
  ('제인', 'Rising Sun', '동방신기', '04:40', '/resources/sounds/dongbangsinki-risingSun.mp3', 0),
  ('민호', 'Never Ending Story', '부활', '04:15', '/resources/sounds/NeverEndingStory.mp3', 1);

-- profile (4)
insert into "profile" ("userNickname", "image", "msg", "create_date", "update_date") values
  ('제인', 'defaultProfile.png', '체험 계정입니다.
글도 써 보고 미니룸도 꾸며 보세요.', '2026-07-04T15:23:47.102Z', '2026-07-04T15:23:47.102Z'),
  ('민호', 'defaultProfile.png', '오늘도 코딩 중.', '2026-07-04T15:23:47.102Z', '2026-07-04T15:23:47.102Z'),
  ('소율', 'defaultProfile.png', '음악과 함께하는 하루', '2026-07-04T15:23:47.102Z', '2026-07-04T15:23:47.102Z'),
  ('다인', 'defaultProfile.png', '사진 찍는 걸 좋아합니다.', '2026-07-04T15:23:47.102Z', '2026-07-04T15:23:47.102Z');

-- miniHomeTitle (4)
insert into "miniHomeTitle" ("userNickname", "title", "update_date") values
  ('제인', '제인의 미니홈피에 오신 걸 환영합니다.', '2026-07-24T15:23:47.102Z'),
  ('민호', '민호의 미니홈피', '2026-07-24T15:23:47.102Z'),
  ('소율', '소율의 작은 방', '2026-07-24T15:23:47.102Z'),
  ('다인', '다인의 사진 창고', '2026-07-24T15:23:47.102Z');

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
많은 이용 부탁드립니다.', '2026-07-27T15:23:47.102Z', '2026-07-27T15:23:47.102Z', 'N'),
  (2, '관리자', '도토리 충전 이벤트', '이번 달 도토리 충전 시 10% 추가 적립 이벤트를 진행합니다.', '2026-07-28T15:23:47.102Z', '2026-07-28T15:23:47.102Z', 'N'),
  (3, '관리자', 'BGM 신곡 업데이트', '추억의 명곡 14곡이 새로 추가되었습니다. 상점에서 확인해 주세요.', '2026-07-29T15:23:47.102Z', '2026-07-29T15:23:47.102Z', 'N'),
  (4, '관리자', '미니미 신상 입고', '미니미 70여 종이 상점에 새로 들어왔습니다.', '2026-07-30T15:23:47.102Z', '2026-07-30T15:23:47.102Z', 'N'),
  (5, '관리자', '서버 점검 안내', '매주 화요일 새벽 2시 ~ 4시 정기 점검이 진행됩니다.', '2026-07-31T15:23:47.102Z', '2026-07-31T15:23:47.102Z', 'N'),
  (6, '관리자', '개인정보 처리방침 개정 안내', '개인정보 처리방침이 일부 개정되었습니다.', '2026-08-01T15:23:47.102Z', '2026-08-01T15:23:47.102Z', 'N'),
  (7, '관리자', '일촌 신청 기능 개선', '일촌 신청 및 수락 흐름이 더 편해졌습니다.', '2026-08-02T15:23:47.102Z', '2026-08-02T15:23:47.102Z', 'N');
select setval(pg_get_serial_sequence('"notice"', 'seq'), (select max("seq") from "notice"));

-- board (6)
insert into "board" ("seq", "userNickname", "title", "content", "imagePath", "hits", "create_date", "update_date", "del_yn", "openScope") values
  (1, '제인', '첫 게시글입니다', '미니홈피 게시판 기능을 테스트해 봅니다.<br>잘 동작하네요!', '', 3, '2026-08-03T15:23:47.102Z', '2026-08-03T15:23:47.102Z', 'N', 1),
  (2, '제인', '주말에 다녀온 카페', '분위기가 정말 좋았어요. 다음에 또 가려고요.', '', 5, '2026-08-02T15:23:47.102Z', '2026-08-02T15:23:47.102Z', 'N', 1),
  (3, '제인', '요즘 듣는 노래', 'BGM 으로 걸어둔 곡들 추천합니다.', '', 11, '2026-07-30T15:23:47.102Z', '2026-07-30T15:23:47.102Z', 'N', 1),
  (4, '민호', 'Next.js 로 옮기는 중', 'Spring MVC 로 만들었던 걸 통째로 옮기고 있습니다.', '', 3, '2026-08-03T15:23:47.102Z', '2026-08-03T15:23:47.102Z', 'N', 1),
  (5, '민호', '오늘의 회고', '생각보다 JSP 가 많았다...', '', 15, '2026-07-28T15:23:47.102Z', '2026-07-28T15:23:47.102Z', 'N', 1),
  (6, '다인', '사진 정리', '사진첩에 사진 몇 장 올렸어요.', '', 7, '2026-08-01T15:23:47.102Z', '2026-08-01T15:23:47.102Z', 'N', 1);
select setval(pg_get_serial_sequence('"board"', 'seq'), (select max("seq") from "board"));

-- boardCMT (2)
insert into "boardCMT" ("boardSeq", "userNickname", "content", "create_date", "update_date", "openScope") values
  (1, '민호', '오 잘 되네요!', '2026-08-03T12:23:47.102Z', '2026-08-03T12:23:47.102Z', 1),
  (1, '제인', '감사합니다 :)', '2026-08-03T14:23:47.102Z', '2026-08-03T14:23:47.102Z', 1);

-- diary (4)
insert into "diary" ("seq", "userNickname", "title", "content", "hits", "create_date", "update_date", "diary_date", "del_yn", "openScope") values
  (1, '제인', '오늘의 일기', '미니홈피를 다시 만들었다. 옛날 생각이 많이 났다.', 0, '2026-08-03T15:23:47.102Z', '2026-08-03T15:23:47.102Z', '2026-08-03', 'n', 1),
  (2, '제인', '어제의 일기', '오랜만에 친구들과 통화했다.', 0, '2026-08-02T15:23:47.102Z', '2026-08-02T15:23:47.102Z', '2026-08-02', 'n', 1),
  (3, '제인', '지난 주말', '집에서 푹 쉬었다.', 0, '2026-07-31T15:23:47.102Z', '2026-07-31T15:23:47.102Z', '2026-07-31', 'n', 1),
  (4, '민호', '이사 완료', '드디어 마이그레이션 끝!', 0, '2026-08-03T15:23:47.102Z', '2026-08-03T15:23:47.102Z', '2026-08-03', 'n', 1);
select setval(pg_get_serial_sequence('"diary"', 'seq'), (select max("seq") from "diary"));

-- diaryCMT (1)
insert into "diaryCMT" ("diarySeq", "userNickname", "content", "create_date", "openScope") values
  (1, '민호', '나도 그때 생각난다 ㅎㅎ', '2026-08-03T13:23:47.102Z', 1);

-- album (3)
insert into "album" ("seq", "userNickname", "title", "content", "imagePath", "create_date", "update_date", "del_yn", "openScope") values
  (1, '제인', '강아지 사진', '산책 나갔다가 찍었어요.', 'albumPuppy.jpg', '2026-08-02T15:23:47.102Z', '2026-08-02T15:23:47.102Z', 'N', 1),
  (2, '제인', '첫 앨범', '기본 앨범 이미지입니다.', 'albumImg1.jpg', '2026-07-29T15:23:47.102Z', '2026-07-29T15:23:47.102Z', 'N', 1),
  (3, '다인', '고양이', '동네 고양이', 'albumPuppy.jpg', '2026-08-01T15:23:47.102Z', '2026-08-01T15:23:47.102Z', 'N', 1);
select setval(pg_get_serial_sequence('"album"', 'seq'), (select max("seq") from "album"));

-- visit (3)
insert into "visit" ("userNickname", "targetNickname", "content", "openScope", "create_date", "update_date") values
  ('민호', '제인', '방명록 첫 글!
자주 놀러올게요.', 1, '2026-08-02T15:23:47.102Z', '2026-08-02T15:23:47.102Z'),
  ('다인', '제인', '홈피 잘 보고 갑니다 :)', 1, '2026-08-01T15:23:47.102Z', '2026-08-01T15:23:47.102Z'),
  ('제인', '민호', '나도 방문 도장 쾅', 1, '2026-08-03T15:23:47.102Z', '2026-08-03T15:23:47.102Z');

-- visitCnt (4)
insert into "visitCnt" ("userNickname", "todayCnt", "totalCnt", "cnt_date") values
  ('제인', 3, 128, '2026-08-03'),
  ('민호', 5, 165, '2026-08-03'),
  ('소율', 7, 202, '2026-08-03'),
  ('다인', 9, 239, '2026-08-03');

-- friends (3)
insert into "friends" ("userNickname", "friendNickname", "fStatus", "del_yn", "createDate", "acceptDate") values
  ('제인', '민호', 1, 'N', '2026-06-04T15:23:47.102Z', '2026-06-04T15:23:47.102Z'),
  ('다인', '민호', 1, 'N', '2026-06-19T15:23:47.102Z', '2026-06-19T15:23:47.102Z'),
  ('소율', '제인', 0, 'N', '2026-08-01T15:23:47.102Z', null);

-- friendCMT (2)
insert into "friendCMT" ("userNickname", "friendNickname", "content", "createDate", "del_yn") values
  ('민호', '제인', '일촌평 1호 남기고 갑니다 :)', '2026-07-29T15:23:47.102Z', 'n'),
  ('제인', '민호', '홈피 예쁘게 잘 꾸몄네!', '2026-07-31T15:23:47.102Z', 'n');

-- loginStatus (4)
insert into "loginStatus" ("userNickname", "status", "last_seen") values
  ('제인', '1', '2026-08-03T15:23:47.102Z'),
  ('민호', '1', '2026-08-03T15:23:47.102Z'),
  ('소율', '0', '2026-07-31T15:23:47.102Z'),
  ('다인', '0', '2026-07-31T15:23:47.102Z');

commit;
