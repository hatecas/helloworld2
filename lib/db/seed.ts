// 확장자를 붙여야 scripts/*.mjs 가 node 로 이 파일을 직접 읽을 수 있다 (generate-seed-sql)
import { DOT_MINIMI, iconPath } from '../minimi/dot-pack.ts';
import { GIF_MINIMI, gifMinimiPath } from '../minimi/gif-pack.ts';
import type { Database } from './types';

/**
 * DB 를 아직 붙이지 않은 상태(기본값)에서 앱이 그대로 굴러가도록 하는 시드 데이터.
 * Supabase 를 연결하면 supabase/seed.sql 이 동일한 내용을 넣는다.
 */

const now = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetDays = 0, offsetHours = 0) =>
  new Date(now - offsetDays * DAY - offsetHours * 60 * 60 * 1000).toISOString();
const ymd = (offsetDays = 0) => iso(offsetDays).slice(0, 10);

/** SHA-256('1234') — 구 SHA256.java 와 동일한 소문자 hex */
const PW_1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

/**
 * 스킨 / 메뉴탭 색상. contentPath 에 색상값이, productName 에 표시명이 들어간다.
 * 이름과 가격은 구 store/skin.jsp · store/menu.jsp 의 하드코딩 목록과 그대로 맞췄다.
 */
export const SKIN_COLORS: Array<{ name: string; value: string; price: string }> = [
  { name: '기본 스킨', value: 'rgb(42, 140, 168)', price: '0' },
  { name: '검정', value: 'black', price: '10' },
  { name: '빨강', value: 'red', price: '10' },
  { name: '노랑', value: 'yellow', price: '10' },
  { name: '초록', value: 'green', price: '10' },
  { name: '회색', value: 'grey', price: '10' },
  { name: '라임', value: 'lime', price: '10' },
  { name: '하양', value: 'white', price: '10' },
  { name: '보라', value: 'purple', price: '10' },
  { name: '파랑', value: 'blue', price: '10' },
  { name: '네이비', value: 'navy', price: '10' },
];

export const MENU_COLORS = SKIN_COLORS.map((c) =>
  c.name === '기본 스킨' ? { ...c, name: '기본 메뉴' } : c,
);

/** public/resources/images/minimi 에 실제로 들어있는 파일들 */
const MINIMI_FILES = [
  'balokIcon', 'blockGolemIcon', 'blueMushroomIcon', 'boogieIcon', 'bookRabbitIcon',
  'brownTeddyIcon', 'bubbleFishIcon', 'bunnyIcon', 'darkYetiIcon', 'drakeIcon',
  'duckyFamilyIcon', 'elizaIcon', 'evileyeIcon', 'extumpIcon', 'fairyIcon',
  'flowerFishIcon', 'goblinIcon', 'gobyIcon', 'greiIcon', 'grupinIcon',
  'gumihoIcon', 'hectorIcon', 'helicopterIcon', 'horangIcon', 'hornGoblinIcon',
  'jakumIcon', 'juniorBulldogIcon', 'juniorDarkYetiIcon', 'juniorSealIcon', 'krappyIcon',
  'laceIcon', 'ligatorIcon', 'lucidaIcon', 'martianIcon', 'maskFishIcon',
  'mimicIcon', 'nakeyIcon', 'nependeathIcon', 'Nova_2Icon', 'octopusIcon',
  'orangeMushroomIcon', 'papulatusIcon', 'PepeIcon', 'pianusIcon', 'pinboomIcon',
  'poopaIcon', 'ratsIcon', 'redSnailIcon', 'ribbonPigIcon', 'rikanslofIcon',
  'risellSquidIcon', 'roboIcon', 'rupanIcon', 'scubaPepeIcon', 'seacleIcon',
  'sharkIcon', 'slimeIcon', 'soulTeddyIcon', 'sparkerIcon', 'starPixieIcon',
  'steazyIcon', 'stoneBallIcon', 'stonGolemIcon', 'tauromasisIcon', 'ticktockIcon',
  'timerIcon', 'toyTrojanIcon', 'vultureIcon', 'wildCargoIcon', 'wonroGreiIcon',
  'zombiIcon',
];

/** balokIcon -> 발록 처럼 예쁘게 못 만드는 건 카멜케이스만 풀어서 표기 */
function prettyMinimiName(file: string): string {
  const known: Record<string, string> = {
    balokIcon: '발록', blockGolemIcon: '블록 골렘', blueMushroomIcon: '파란 버섯',
    boogieIcon: '부기', bookRabbitIcon: '책 읽는 토끼', brownTeddyIcon: '브라운 테디',
    bubbleFishIcon: '버블 피쉬', bunnyIcon: '버니', darkYetiIcon: '다크 예티',
    drakeIcon: '드레이크', duckyFamilyIcon: '오리 가족', elizaIcon: '엘리자',
    evileyeIcon: '이블아이', extumpIcon: '엑스텀프', fairyIcon: '요정',
    flowerFishIcon: '플라워 피쉬', goblinIcon: '고블린', gobyIcon: '고비',
    greiIcon: '그레이', grupinIcon: '그루핀', gumihoIcon: '구미호',
    hectorIcon: '헥터', helicopterIcon: '헬리콥터', horangIcon: '호랑',
    hornGoblinIcon: '뿔 고블린', jakumIcon: '자쿰', juniorBulldogIcon: '주니어 불독',
    juniorDarkYetiIcon: '주니어 다크 예티', juniorSealIcon: '주니어 물범',
    krappyIcon: '크래피', laceIcon: '레이스', ligatorIcon: '리게이터',
    lucidaIcon: '루시다', martianIcon: '마션', maskFishIcon: '마스크 피쉬',
    mimicIcon: '미믹', nakeyIcon: '네이키', nependeathIcon: '네펜데스',
    Nova_2Icon: '노바', octopusIcon: '문어', orangeMushroomIcon: '주황 버섯',
    papulatusIcon: '파풀라투스', PepeIcon: '페페', pianusIcon: '피아누스',
    pinboomIcon: '핀붐', poopaIcon: '뿌빠', ratsIcon: '쥐돌이',
    redSnailIcon: '빨간 달팽이', ribbonPigIcon: '리본 돼지', rikanslofIcon: '리칸슬로프',
    risellSquidIcon: '리셀 스퀴드', roboIcon: '로보', rupanIcon: '루팡',
    scubaPepeIcon: '스쿠버 페페', seacleIcon: '시클', sharkIcon: '상어',
    slimeIcon: '슬라임', soulTeddyIcon: '소울 테디', sparkerIcon: '스파커',
    starPixieIcon: '스타 픽시', steazyIcon: '스티지', stoneBallIcon: '스톤 볼',
    stonGolemIcon: '스톤 골렘', tauromasisIcon: '타우로마시스', ticktockIcon: '틱톡',
    timerIcon: '타이머', toyTrojanIcon: '토이 트로이', vultureIcon: '벌처',
    wildCargoIcon: '와일드 카고', wonroGreiIcon: '원로 그레이', zombiIcon: '좀비',
  };
  return known[file] ?? file.replace(/Icon$/, '');
}

/** public/resources/sounds 에 실제로 들어있는 mp3 */
/**
 * 상점 BGM.
 *
 * 파일명은 ASCII 로만 쓴다 — 한글·공백·[] 가 섞이면 주소로 다루기가 번거롭다.
 * (유튜브에서 받은 파일은 scripts 로 정리해 넣는다)
 *
 * 재생시간은 **파일에서 실제로 재서** 넣은 값이다. 예전에는 눈대중으로 적어 둬서
 * 14곡 중 11곡이 어긋나 있었고(최대 104초), 상점·재생목록에 그 숫자가 그대로 보였다.
 */
const BGM_FILES: Array<[title: string, artist: string, runningTime: string, file: string]> = [
  ['벌써 1년', '브라운아이드소울', '03:28', 'Already1Year.mp3'],
  ['가시', 'Buzz', '04:02', 'buzz-gasi.mp3'],
  ['고백', '델리스파이스', '05:25', 'Confession.mp3'],
  ['Rising Sun', '동방신기', '04:40', 'dongbangsinki-risingSun.mp3'],
  ['응급실', 'izi', '03:44', 'EmergencyRoom.mp3'],
  ['For You', '에메랄드 캐슬', '04:06', 'ForYou.mp3'],
  ['I Believe', '신승훈', '04:43', 'IBelieve.mp3'],
  ['Never Ending Story', '부활', '04:15', 'NeverEndingStory.mp3'],
  ['한잔의 추억', '이장희', '04:51', 'OneDrink.mp3'],
  ['다시 사랑한다 말할까', '김동률', '04:48', 'ShouldIsayILoveAgain.mp3'],
  ['Miracle', '슈퍼주니어', '02:57', 'superJunior-miracle.mp3'],
  ['가시나무', '시인과 촌장', '04:02', 'Thorn.mp3'],
  ['Bo Peep Bo Peep', '티아라', '03:45', 'tiara-boPeepBoPeep.mp3'],
  ['Timeless', 'SG워너비', '03:55', 'Timeless.mp3'],

  // ---- 2026-08 추가 ----
  ['사랑 안해', '백지영', '04:13', 'baekjiyoung-iWontLove.mp3'],
  ['낙원 (Feat. 이재훈)', '싸이', '03:42', 'psy-paradise.mp3'],
  ['Fly (Feat. Amin.J)', '에픽하이', '03:21', 'epikhigh-fly.mp3'],
  ['천하무적', 'MC몽', '03:30', 'mcmong-invincible.mp3'],
  ['I Love U Oh Thank U (Feat. 김태우)', 'MC몽', '04:13', 'mcmong-iLoveUOhThankU.mp3'],
  ['아이스크림', 'MC몽', '03:36', 'mcmong-iceCream.mp3'],
  ['못된 여자 Ⅱ (With 서인영)', '원투', '03:59', 'onetwo-badGirl2.mp3'],
  ['Must Have Love', 'SG워너비, 브라운아이드걸스', '04:20', 'sgwannabe-mustHaveLove.mp3'],
  ['해바라기 (Feat. 써니사이드 MJ)', '가비엔제이', '03:41', 'gavynj-sunflower.mp3'],
  ['기억을 걷는 시간', '넬', '05:13', 'nell-timeWalkingOnMemory.mp3'],
  ['사랑했잖아', '린', '04:01', 'lyn-iLovedYou.mp3'],
  ['몽환의 숲 (Feat. 이루마)', '키네틱플로우', '04:05', 'kineticflow-dreamyForest.mp3'],
  ['눈의 꽃', '박효신', '05:40', 'parkhyoshin-snowFlower.mp3'],
  ['밤하늘의 별을 (With KCM & 노누)', '양정승', '03:44', 'yangjeongseung-starsInTheNight.mp3'],
  ['우산 (Feat. 윤하)', '에픽하이', '05:02', 'epikhigh-umbrella.mp3'],
  ['세글자', '엠투엠', '03:52', 'm2m-threeWords.mp3'],
  ['까만안경 (Feat. 데이라이트)', '이루', '04:10', 'eru-blackGlasses.mp3'],
  ['소주 한 잔', '임창정', '04:51', 'limchangjung-oneShotOfSoju.mp3'],
  ['청혼', '노을', '04:27', 'noel-proposal.mp3'],
  ['Y (Please Tell Me Why)', '프리스타일', '04:40', 'freestyle-y.mp3'],
  ['화분', '알렉스', '04:26', 'alex-flowerpot.mp3'],
];

const DEFAULT_MINIMI_PATH = '/resources/images/default/defaultMinimiIcon.gif';
const DEFAULT_BG_PATH = '/resources/images/default/defaultBg.jpg';

interface SeedUser {
  email: string;
  name: string;
  nickname: string;
  gender: 'M' | 'F';
  birth: string;
  phone: string;
  dotori: number;
  profileMsg: string;
  homeTitle: string;
  online: boolean;
}

const SEED_USERS: SeedUser[] = [
  {
    email: 'demo@gmail.com', name: '한제인', nickname: '제인', gender: 'F',
    birth: '1995-04-12', phone: '010-1234-5678', dotori: 250,
    profileMsg: '체험 계정입니다.\n글도 써 보고 미니룸도 꾸며 보세요.',
    homeTitle: '제인의 미니홈피에 오신 걸 환영합니다.', online: true,
  },
  {
    email: 'minho@gmail.com', name: '강민호', nickname: '민호', gender: 'M',
    birth: '1996-09-01', phone: '010-2222-3333', dotori: 120,
    profileMsg: '오늘도 코딩 중.',
    homeTitle: '민호의 미니홈피', online: true,
  },
  {
    email: 'soyul@gmail.com', name: '배소율', nickname: '소율', gender: 'F',
    birth: '1997-02-20', phone: '010-4444-5555', dotori: 80,
    profileMsg: '음악과 함께하는 하루',
    homeTitle: '소율의 작은 방', online: false,
  },
  {
    email: 'dain@gmail.com', name: '문다인', nickname: '다인', gender: 'F',
    birth: '1998-11-30', phone: '010-6666-7777', dotori: 40,
    profileMsg: '사진 찍는 걸 좋아합니다.',
    homeTitle: '다인의 사진 창고', online: false,
  },
];

export function buildSeed(): Database {
  const db: Database = {
    user: [], dotori: [], dotoriC: [], dotoriU: [], userStorage: [], store: [],
    bgm: [], userBgm: [], profile: [], miniHomeTitle: [], miniroomBackground: [],
    miniroomMinimi: [], notice: [], board: [], boardCMT: [], diary: [], diaryCMT: [],
    album: [], albumCMT: [], visit: [], visitCnt: [], friends: [], friendCMT: [], loginStatus: [],
    loginLog: [], notiRead: [], plazaChat: [], forestRecord: [],
  };

  let seq = 1;
  const next = () => seq++;

  // ---- 상점 ----
  MINIMI_FILES.forEach((file, i) => {
    db.store.push({
      seq: next(),
      category: 'minimi',
      productName: prettyMinimiName(file),
      contentPath: `/resources/images/minimi/${file}.gif`,
      productPrice: String(5 + (i % 4) * 5),
    });
  });
  db.store.push({
    seq: next(), category: 'minimi', productName: '기본 미니미',
    contentPath: DEFAULT_MINIMI_PATH, productPrice: '0',
  });
  /*
   * 도트 시트에서 뽑은 미니미 — 광장에서 숫자키로 특수 동작까지 된다.
   * 기존 항목 뒤에 붙여야 앞의 seq 가 밀리지 않는다.
   */
  DOT_MINIMI.forEach((m) => {
    db.store.push({
      seq: next(), category: 'minimi', productName: m.name,
      contentPath: iconPath(m.id), productPrice: '30',
    });
  });
  // GIF 로 받아 규격만 맞춘 것들 — 특수 동작이 없어서 조금 싸다
  GIF_MINIMI.forEach((m) => {
    db.store.push({
      seq: next(), category: 'minimi', productName: m.name,
      contentPath: gifMinimiPath(m.id), productPrice: '20',
    });
  });
  SKIN_COLORS.forEach((c) => {
    db.store.push({
      seq: next(), category: 'skin', productName: c.name,
      contentPath: c.value, productPrice: c.price,
    });
  });
  MENU_COLORS.forEach((c) => {
    db.store.push({
      seq: next(), category: 'menu', productName: c.name,
      contentPath: c.value, productPrice: c.price,
    });
  });

  // ---- BGM 상점 ----
  BGM_FILES.forEach(([title, artist, runningTime, file]) => {
    db.bgm.push({
      seq: next(), title, artist, runningTime,
      bgmPrice: '15', contentPath: `/resources/sounds/${file}`,
    });
  });

  // ---- 회원 ----
  SEED_USERS.forEach((u, idx) => {
    db.user.push({
      userEmail: u.email,
      userPassword: PW_1234,
      userName: u.name,
      userNickname: u.nickname,
      userGender: u.gender,
      userBirth: u.birth,
      userPhone: u.phone,
      createDate: iso(200 - idx * 10),
      userAvailable: 'Y',
    });
    db.dotori.push({ userNickname: u.nickname, currentDotori: u.dotori });
    db.dotoriC.push({
      seq: next(), userNickname: u.nickname, dotoriCharge: 100,
      dotoriChargeDate: iso(200 - idx * 10),
      dotoriChargeMethod: '회원가입 축하 포인트', dotoriPrice: '0',
    });
    db.profile.push({
      seq: next(), userNickname: u.nickname, image: 'defaultProfile.png',
      msg: u.profileMsg, create_date: iso(30), update_date: iso(30),
    });
    db.miniHomeTitle.push({
      seq: next(), userNickname: u.nickname, title: u.homeTitle, update_date: iso(10),
    });
    db.miniroomBackground.push({
      userNickname: u.nickname, backgroundName: 'defaultBg', backgroundPath: DEFAULT_BG_PATH,
    });
    db.miniroomMinimi.push({
      seq: next(), userNickname: u.nickname, minimiName: 'defaultMinimiIcon',
      minimiPath: DEFAULT_MINIMI_PATH, minimiLeft: '390px', minimiTop: '163px',
    });
    db.visitCnt.push({
      seq: next(), userNickname: u.nickname,
      todayCnt: 3 + idx * 2, totalCnt: 128 + idx * 37, cnt_date: ymd(),
    });
    db.loginStatus.push({
      seq: next(), userNickname: u.nickname, status: u.online ? '1' : '0',
      // 접속중인 시드 유저는 방금 신호를 보낸 것으로 둔다.
      // (status 가 '1' 이어도 last_seen 이 오래되면 '일촌 ON' 에 안 잡힌다)
      last_seen: u.online ? iso() : iso(3),
    });

    // 기본 보유 아이템
    db.userStorage.push({
      seq: next(), userNickname: u.nickname, category: 'minimi',
      productName: '기본 미니미', contentPath: DEFAULT_MINIMI_PATH,
      buy_date: iso(200), allocation: 1,
    });
    db.userStorage.push({
      seq: next(), userNickname: u.nickname, category: 'skin',
      productName: '기본 스킨', contentPath: 'rgb(42, 140, 168)',
      buy_date: iso(200), allocation: 1,
    });
    db.userStorage.push({
      seq: next(), userNickname: u.nickname, category: 'menu',
      productName: '기본 메뉴', contentPath: 'rgb(42, 140, 168)',
      buy_date: iso(200), allocation: 1,
    });
  });

  // 제인은 데모용으로 아이템을 몇 개 더 보유
  ['빨강', '네이비', '보라'].forEach((name) => {
    const color = SKIN_COLORS.find((c) => c.name === name)!;
    db.userStorage.push({
      seq: next(), userNickname: '제인', category: 'skin', productName: color.name,
      contentPath: color.value, buy_date: iso(20), allocation: 0,
    });
    db.userStorage.push({
      seq: next(), userNickname: '제인', category: 'menu', productName: color.name,
      contentPath: color.value, buy_date: iso(20), allocation: 0,
    });
  });
  ['슬라임', '주황 버섯', '스타 픽시'].forEach((productName) => {
    const item = db.store.find((s) => s.category === 'minimi' && s.productName === productName)!;
    db.userStorage.push({
      seq: next(), userNickname: '제인', category: 'minimi', productName: item.productName,
      contentPath: item.contentPath, buy_date: iso(15), allocation: 0,
    });
  });

  // 제인 보유 BGM (2곡은 플레이리스트에 등록)
  BGM_FILES.slice(0, 4).forEach(([title, artist, runningTime, file], i) => {
    db.userBgm.push({
      seq: next(), userNickname: '제인', title, artist, runningTime,
      contentPath: `/resources/sounds/${file}`, allocation: i < 2 ? 1 : 0,
    });
  });
  db.userBgm.push({
    seq: next(), userNickname: '민호', title: BGM_FILES[7][0], artist: BGM_FILES[7][1],
    runningTime: BGM_FILES[7][2], contentPath: `/resources/sounds/${BGM_FILES[7][3]}`,
    allocation: 1,
  });

  // ---- 일촌 ----
  db.friends.push({
    seq: next(), userNickname: '제인', friendNickname: '민호',
    fStatus: 1, del_yn: 'N', createDate: iso(60), acceptDate: iso(60),
  });
  db.friends.push({
    seq: next(), userNickname: '다인', friendNickname: '민호',
    fStatus: 1, del_yn: 'N', createDate: iso(45), acceptDate: iso(45),
  });
  // 아직 신청만 해 둔 관계 — 승인 전이라 acceptDate 가 없다
  db.friends.push({
    seq: next(), userNickname: '소율', friendNickname: '제인',
    fStatus: 0, del_yn: 'N', createDate: iso(2), acceptDate: null,
  });

  db.friendCMT.push({
    seq: next(), userNickname: '민호', friendNickname: '제인',
    content: '일촌평 1호 남기고 갑니다 :)', createDate: iso(5), del_yn: 'n',
  });
  db.friendCMT.push({
    seq: next(), userNickname: '제인', friendNickname: '민호',
    content: '홈피 예쁘게 잘 꾸몄네!', createDate: iso(3), del_yn: 'n',
  });

  // ---- 공지사항 ----
  const notices: Array<[string, string]> = [
    ['HelloWorld 오픈 안내', 'HelloWorld 미니홈피 서비스가 정식 오픈했습니다.\n많은 이용 부탁드립니다.'],
    ['도토리 충전 이벤트', '이번 달 도토리 충전 시 10% 추가 적립 이벤트를 진행합니다.'],
    ['BGM 신곡 업데이트', '추억의 명곡 14곡이 새로 추가되었습니다. 상점에서 확인해 주세요.'],
    ['미니미 신상 입고', '미니미 70여 종이 상점에 새로 들어왔습니다.'],
    ['서버 점검 안내', '매주 화요일 새벽 2시 ~ 4시 정기 점검이 진행됩니다.'],
    ['개인정보 처리방침 개정 안내', '개인정보 처리방침이 일부 개정되었습니다.'],
    ['일촌 신청 기능 개선', '일촌 신청 및 수락 흐름이 더 편해졌습니다.'],
  ];
  notices.forEach(([title, content], i) => {
    db.notice.push({
      seq: next(), writer: '관리자', title, content,
      create_date: iso(notices.length - i), update_date: iso(notices.length - i),
      del_yn: 'N',
    });
  });

  // ---- 게시판 ----
  const boards: Array<[nickname: string, title: string, content: string, days: number]> = [
    ['제인', '첫 게시글입니다', '미니홈피 게시판 기능을 테스트해 봅니다.<br>잘 동작하네요!', 0],
    ['제인', '주말에 다녀온 카페', '분위기가 정말 좋았어요. 다음에 또 가려고요.', 1],
    ['제인', '요즘 듣는 노래', 'BGM 으로 걸어둔 곡들 추천합니다.', 4],
    ['민호', 'Next.js 로 옮기는 중', 'Spring MVC 로 만들었던 걸 통째로 옮기고 있습니다.', 0],
    ['민호', '오늘의 회고', '생각보다 JSP 가 많았다...', 6],
    ['다인', '사진 정리', '사진첩에 사진 몇 장 올렸어요.', 2],
  ];
  boards.forEach(([userNickname, title, content, days]) => {
    db.board.push({
      seq: next(), userNickname, title, content, imagePath: '',
      hits: 3 + days * 2, create_date: iso(days), update_date: iso(days),
      del_yn: 'N', openScope: 1,
    });
  });
  const firstBoard = db.board[0];
  db.boardCMT.push({
    seq: next(), boardSeq: firstBoard.seq, userNickname: '민호',
    content: '오 잘 되네요!', create_date: iso(0, 3), update_date: iso(0, 3), openScope: 1,
  });
  db.boardCMT.push({
    seq: next(), boardSeq: firstBoard.seq, userNickname: '제인',
    content: '감사합니다 :)', create_date: iso(0, 1), update_date: iso(0, 1), openScope: 1,
  });

  // ---- 다이어리 ----
  const diaries: Array<[nickname: string, title: string, content: string, days: number]> = [
    ['제인', '오늘의 일기', '미니홈피를 다시 만들었다. 옛날 생각이 많이 났다.', 0],
    ['제인', '어제의 일기', '오랜만에 친구들과 통화했다.', 1],
    ['제인', '지난 주말', '집에서 푹 쉬었다.', 3],
    ['민호', '이사 완료', '드디어 마이그레이션 끝!', 0],
  ];
  diaries.forEach(([userNickname, title, content, days]) => {
    db.diary.push({
      seq: next(), userNickname, title, content, hits: 0,
      create_date: iso(days), update_date: iso(days), diary_date: ymd(days),
      del_yn: 'n', openScope: 1,
    });
  });
  db.diaryCMT.push({
    seq: next(), diarySeq: db.diary[0].seq, userNickname: '민호',
    content: '나도 그때 생각난다 ㅎㅎ', create_date: iso(0, 2), openScope: 1,
  });

  // ---- 사진첩 ----
  db.album.push({
    seq: next(), userNickname: '제인', title: '강아지 사진',
    content: '산책 나갔다가 찍었어요.', imagePath: 'albumPuppy.jpg',
    create_date: iso(1), update_date: iso(1), del_yn: 'N', openScope: 1,
  });
  db.album.push({
    seq: next(), userNickname: '제인', title: '첫 앨범',
    content: '기본 앨범 이미지입니다.', imagePath: 'albumImg1.jpg',
    create_date: iso(5), update_date: iso(5), del_yn: 'N', openScope: 1,
  });
  db.album.push({
    seq: next(), userNickname: '다인', title: '고양이',
    content: '동네 고양이', imagePath: 'albumPuppy.jpg',
    create_date: iso(2), update_date: iso(2), del_yn: 'N', openScope: 1,
  });

  // ---- 방명록 ----
  const visits: Array<[from: string, to: string, content: string, days: number]> = [
    ['민호', '제인', '방명록 첫 글!\n자주 놀러올게요.', 1],
    ['다인', '제인', '홈피 잘 보고 갑니다 :)', 2],
    ['제인', '민호', '나도 방문 도장 쾅', 0],
  ];
  visits.forEach(([userNickname, targetNickname, content, days]) => {
    db.visit.push({
      seq: next(), userNickname, targetNickname, content, openScope: 1,
      create_date: iso(days), update_date: iso(days),
    });
  });

  renumberSeq(db);
  return db;
}

/**
 * 위에서는 편의상 전역 카운터로 seq 를 찍었는데, 그러면 공지 번호가 400 같은 값이 된다.
 * 구 MySQL 의 테이블별 AUTO_INCREMENT 처럼 보이도록 테이블마다 1부터 다시 매긴다.
 * 댓글이 들고 있는 boardSeq / diarySeq 도 같이 옮겨 준다.
 */
function renumberSeq(db: Database): void {
  const boardSeqMap = new Map<number, number>();
  const diarySeqMap = new Map<number, number>();

  for (const [table, rows] of Object.entries(db) as Array<
    [keyof Database, Array<{ seq?: number }>]
  >) {
    let i = 1;
    for (const row of rows) {
      if (row.seq == null) continue;
      const previous = row.seq;
      row.seq = i++;
      if (table === 'board') boardSeqMap.set(previous, row.seq);
      if (table === 'diary') diarySeqMap.set(previous, row.seq);
    }
  }

  for (const comment of db.boardCMT) {
    comment.boardSeq = boardSeqMap.get(comment.boardSeq) ?? comment.boardSeq;
  }
  for (const comment of db.diaryCMT) {
    comment.diarySeq = diarySeqMap.get(comment.diarySeq) ?? comment.diarySeq;
  }
}
