/**
 * 광장의 맵들.
 *
 * 맵은 두 종류다.
 *   topdown  : 위에서 내려다보는 구도. y 는 '깊이' 라서 위아래로 자유롭게 걷는다. (광장)
 *   platform : 옆에서 보는 구도. y 는 '높이' 라서 중력이 늘 작용하고 발판을 밟는다. (인내의 숲)
 *
 * 세로로 긴 맵은 화면(viewH)보다 커서 카메라가 따라간다.
 * 광장은 h === viewH 라 카메라가 늘 0 이고, 덕분에 그리는 코드는 한 갈래로 유지된다.
 *
 * 좌표는 논리 px 이고 화면에는 이 비율 그대로 축소/확대해 보여 준다.
 * 캐릭터의 (x, y) 는 항상 '발' 위치다.
 */

import { WALK, WORLD_H, WORLD_W, clamp, spawnPoint, type MapId } from './protocol';

export type MapKind = 'topdown' | 'platform';

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** 다른 맵으로 넘어가는 문. (x, y) 는 발 기준 중심, w/h 는 판정 상자 */
export interface Portal {
  to: MapId;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 발판. (x, y) 는 윗면 중심, w 는 폭. 아래에서 위로는 뚫고 지나갈 수 있다. */
export interface Platform {
  x: number;
  y: number;
  w: number;
}

/**
 * 네모 블록. (x, y) 는 윗면 중심, w 는 폭, h 는 아래로의 높이.
 * 테두리를 도는 방해물('orbit')이 이 네모를 한 바퀴 돈다. 윗면에는 발판을 따로 두어
 * 올라설 수 있게 하되, 그 위를 블레이드가 스치므로 '언제 올라서고 언제 뜰지' 를 고르는 자리가 된다.
 */
export interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 배경 장식 그림. (x, y) 는 밑변 중심, w 는 논리 px 폭 (높이는 그림 비율대로) */
export interface Prop {
  src: string;
  x: number;
  y: number;
  w: number;
  flip?: boolean;
  /** 뒤로 물러나 보이게 흐릿하게 (배경 나무) */
  far?: boolean;
}

/**
 * 움직이는 방해물. 닿으면 튕겨 나가 아래로 떨어진다.
 *
 * 위치는 '시각의 함수' 로만 정한다 — 벽시계(Date.now)를 넣으면 모든 사람 화면에서
 * 거의 같은 자리에 있다. 누가 위치를 정해 뿌리는 서버가 없어도 되고,
 * 늦게 들어온 사람도 곧바로 같은 흐름에 합류한다.
 */
export interface Hazard {
  src: string;
  /** 왕복의 중심 (x, y 는 그림 중심) — 'fall' 이면 x 는 떨어지는 자리의 기준, y 는 떨어지기 시작하는 높이 */
  x: number;
  y: number;
  /** 좌우 · 위아래 진폭(px). 0 이면 그 방향으로 안 움직인다. 'fall' 이면 ax = 좌우로 흩어지는 폭, ay = 떨어지는 거리 */
  ax: number;
  ay: number;
  /** 한 번 왕복(또는 낙하 한 번)에 걸리는 시간(초) */
  period: number;
  /** 위상(0~1) — 여러 마리가 한 몸처럼 움직이지 않게 어긋내는 값 */
  phase: number;
  /** 그림 폭(논리 px) */
  w: number;
  /** 부딪힘 판정 반지름(논리 px) — 보이는 그림보다 조금 작게 잡아 억울하지 않게 */
  r: number;
  /**
   * 움직임 방식.
   *  - 'wave'(기본) : 사인 곡선으로 좌우·위아래 왕복.
   *  - 'fall'       : 맨 위에서 천천히 한 번 내려온 뒤 바닥에서 잠깐 쉬었다가, 새 x 자리에서
   *                   다시 내려온다(모든 화면이 같은 값을 계산한다).
   *  - 'orbit'      : 네모(중심 x·y, 반폭 ax·반높이 ay)의 테두리를 따라 360도 돈다.
   *                   period 가 음수면 반대 방향(반시계)으로 돈다.
   *  - 'patrol'     : 바닥의 '닫힌 외곽선'(pts 를 고리로 이어 마지막→첫 점까지)을 따라 계속
   *                   한 방향으로 회전한다. period 는 한 바퀴 도는 시간(초), 음수면 반대 방향.
   */
  kind?: 'wave' | 'fall' | 'orbit' | 'patrol';
  /**
   * 'patrol' 이 도는 외곽선의 꼭짓점들(논리 좌표). 윗면(왼→오)에 이어 오른쪽 내리막·밑면·
   * 왼쪽 오르막까지 시계방향으로 적어 닫힌 고리를 이룬다(마지막 점은 첫 점과 자동으로 이어진다).
   */
  pts?: Array<{ x: number; y: number }>;
  /**
   * 넉백 배수. 없으면 1(기존 세기 — 가볍게 툭 튕긴다).
   * 크게 주면 닿는 순간 저 멀리·저 위로 날아가 대개 아래까지 떨어진다.
   */
  knock?: number;
}

export interface PlazaMap {
  id: MapId;
  name: string;
  kind: MapKind;
  /** 맵 전체 크기 */
  w: number;
  h: number;
  /** 화면에 한 번에 보이는 세로 길이 */
  viewH: number;
  /**
   * 화면에 한 번에 보이는 가로 길이. w 와 같으면 가로 스크롤이 없다(예전 맵 전부).
   * w 보다 작으면 맵이 가로로 길어 카메라가 좌우로도 따라간다(3층).
   */
  viewW: number;
  /** 걸어다닐 수 있는 범위 (발 기준) */
  walk: Bounds;
  /** 가로 이동 속도 (px/초) */
  speed: number;
  portals: Portal[];
  platforms: Platform[];
  props: Prop[];
  hazards: Hazard[];
  /** 테두리를 도는 방해물이 붙는 네모 블록 (윗면은 발판으로도 따로 넣어 준다) */
  blocks?: Block[];
  /** 랜덤 폭탄이 생길 수 있는 자리들 (발 기준). 한 번에 하나가 여기 중 하나에 나타난다. */
  bombSpots?: Array<{ x: number; y: number }>;
  /** 처음 들어올 때 위치 */
  spawn: (seed: string) => { x: number; y: number };
  /** 어느 맵에서 넘어왔을 때 어디에 세울지 (문 위에 겹쳐 서서 바로 되돌아가지 않도록 떨어뜨린다) */
  arrival: Partial<Record<MapId, { x: number; y: number }>>;
  /** 시작 발판의 윗면 — 여기 서면 등반 시간을 다시 잰다 */
  startY?: number;
  /** 이 높이 이상(y <= 이 값)에 서면 정상 */
  summitY?: number;
  /** 이 층만 오르는 데 걸리는 최소 시간(ms) — 구간별 점프 체공 시간의 합 */
  minClimbMs?: number;
  /** 기록 팻말 (여기서는 광장의 숲 입구 옆) */
  recordSign?: {
    /** 어느 기록을 새길지 (지금은 완주 기록 하나뿐 — RUN_KEY) */
    of: string;
    title: string;
    /** 밑변 중심 */
    x: number;
    y: number;
    /** 논리 px 폭 (높이는 그림 비율 72:56) */
    w: number;
  };
}

/* ================================================================== */
/* 완주 — 1층 시작부터 마지막 층 정상까지 한 번의 도전으로 본다            */
/* ================================================================== */

/** 도전이 시작되는 층 (여기 시작 발판을 떠나면 시계가 돌기 시작한다) */
export const RUN_FIRST: MapId = 'forest';
/** 도전이 끝나는 층 (여기 정상에 서면 완주 — 기록으로 남는 건 이것뿐) */
export const RUN_LAST: MapId = 'forest3';
/** 이 층들을 오르는 동안은 시계가 멈추지 않는다 (문을 지나도 이어진다) */
export const RUN_MAPS: MapId[] = ['forest', 'forest2', 'forest3'];

/** 기록 테이블에 쓰는 값. 층별 기록이 아니라 '완주' 기록 하나만 남긴다. */
export const RUN_KEY = 'run';

/* ================================================================== */
/* 광장 — 위에서 내려다보는 구도 (예전 그대로)                           */
/* ================================================================== */

/*
 * 광장에서 인내의 숲으로 들어가는 문.
 *
 * 위쪽에 두되 무대 맨 끝은 피한다 — 아치가 화면 위로 잘리고 이름표가 아예 안 보인다.
 * 가로도 가운데 나무(46%)에서 비켜 놓았다.
 */
const PLAZA_PORTAL: Portal = {
  to: 'forest', label: '인내의 숲', x: 560, y: 190, w: 82, h: 112,
};

/*
 * OX 퀴즈장으로 들어가는 문.
 *
 * 숲 문(519~601)과 기록 팻말(605~775) 이 오른쪽에 몰려 있어서 왼쪽에 세웠다.
 * 가운데 원형 광장(이 높이에서 354~646)에 걸치지 않는 자리다.
 */
const PLAZA_QUIZ_PORTAL: Portal = {
  to: 'quiz', label: 'OX 퀴즈장', x: 330, y: 190, w: 82, h: 112,
};

const PLAZA: PlazaMap = {
  id: 'plaza',
  name: '광장',
  kind: 'topdown',
  w: WORLD_W,
  h: WORLD_H,
  viewH: WORLD_H,
  viewW: WORLD_W,
  walk: WALK,
  speed: 190,
  portals: [PLAZA_QUIZ_PORTAL, PLAZA_PORTAL],
  platforms: [],
  // 광장 배경(잔디·분수·나무·벤치)은 CSS 로 그려져 있어서 장식 그림이 없다
  props: [],
  hazards: [],
  spawn: spawnPoint,
  // 문 판정 상자 밖(옆 아래)에 세운다 — 겹쳐 서면 ↑ 한 번에 되돌아가 버린다
  arrival: {
    forest: { x: PLAZA_PORTAL.x + 140, y: PLAZA_PORTAL.y + 60 },
    quiz: { x: PLAZA_QUIZ_PORTAL.x - 140, y: PLAZA_QUIZ_PORTAL.y + 60 },
  },
  /*
   * 숲 입구 문 바로 옆(오른쪽)에 기록 팻말을 세운다.
   * 문(519~601) 과 겹치지 않고, 벤치(74%, 아래쪽)·나무(90%)와도 떨어진 자리다.
   */
  recordSign: { of: RUN_KEY, title: '인내의 숲 완주', x: 690, y: PLAZA_PORTAL.y, w: 170 },
};

/* ================================================================== */
/* OX 퀴즈장 — 광장에서 문으로 이어지는 방                                */
/* ================================================================== */

/*
 * 광장과 같은 부감 구도지만 하는 일이 하나뿐인 방이다.
 * 바닥의 O · X 칸(lib/plaza/quiz.ts 의 QUIZ_ZONES)과 그 사이의 중립 지대,
 * 그리고 광장으로 되돌아가는 문만 있다.
 *
 * 위쪽 150px 은 무대 벽이라 걸어 들어갈 수 없다 — 문제판(화면에 붙는 칸)이 그 위에 뜨는데,
 * 거기까지 걸어 올라갈 수 있으면 미니미가 문제 뒤로 숨는다.
 */
const QUIZ_EXIT: Portal = { to: 'plaza', label: '광장', x: 500, y: 478, w: 90, h: 112 };

const QUIZ_ROOM: PlazaMap = {
  id: 'quiz',
  name: 'OX 퀴즈장',
  kind: 'topdown',
  w: WORLD_W,
  h: WORLD_H,
  viewH: WORLD_H,
  viewW: WORLD_W,
  walk: { minX: 40, maxX: WORLD_W - 40, minY: 150, maxY: WORLD_H - 18 },
  /*
   * 광장(190)의 두 배로 달린다.
   * 한 문제가 6초뿐이라 광장 속도로는 걸어가는 데만 시간을 다 쓴다. 빨라지면
   * 남들이 어느 칸으로 몰리는지 보고 막판에 갈아탈 여유(칸에서 칸까지 1.05초)가 생겨서,
   * 아는 문제를 맞히는 놀이에 눈치 보는 재미가 얹힌다.
   */
  speed: 380,
  portals: [QUIZ_EXIT],
  platforms: [],
  props: [],
  hazards: [],
  /*
   * 들어오면 O 도 X 도 아닌 한가운데(x 430~570)에 선다. 어느 한쪽에 붙어서 시작하면
   * 그 자리에 가만히 있는 것만으로 답을 고른 셈이 되어 공평하지 않다.
   * 문(455~545, y 366 아래)과도 떨어져 있어 들어오자마자 되돌아 나가지 않는다.
   */
  spawn: (seed) => {
    const h = hash(seed);
    return { x: 430 + (h % 140), y: 270 + ((h >> 5) % 60) };
  },
  // 광장에서 들어올 때도 같은 규칙으로 흩어 세운다
  arrival: {},
};

/* ================================================================== */
/* 인내의 숲 — 옆에서 보는 점프 퀘스트                                   */
/* ================================================================== */

export const FOREST_W = 1000;
export const FOREST_VIEW_H = 500;
/** 숲에서 화면에 한 번에 보이는 가로 길이 — 카메라 창의 폭(맵이 이보다 넓으면 좌우로 스크롤) */
export const FOREST_VIEW_W = 1000;

/**
 * 점프와 중력.
 *
 * 최고 높이 = v₀² / (2g) = 490² / 3120 ≈ 77px — 발판 배치(세로 62px, 가로 60px)가
 * 이 높이·도달거리에 맞춰 정해져 있으므로 높이는 늘 이 값으로 유지한다.
 *
 * '올라가는 속도' 는 일부러 느긋하게 잡았다. v₀ 를 크게(=순간적으로 튀어 오르게) 하면
 * 스프링처럼 팅 튀어 가벼워 보인다 — 그래서 v₀ 를 낮추고 g 도 함께 낮춰,
 * 같은 높이를 '천천히' 밟고 오르게 했다(상승 약 0.31초). 무게가 실려 보인다.
 *
 * 가로 도달거리는 '같은 높이로 돌아올 때' 로 재면 안 된다. 위 발판에 올라서려면
 * 그만큼 일찍 착지하므로 체공이 짧아진다. dy 만큼 위에 닿는 데 쓸 수 있는 시간은
 *   t = t_up + √(2·(h−dy)/g_fall)
 * 라서 dy = 62px 면 약 0.40초, 가로 속도 255 로 약 100px — 60px 틈에 넉넉하다.
 */
export const FOREST_GRAVITY = 1560;
export const FOREST_JUMP_V0 = 490;
const FOREST_SPEED = 255;

/**
 * 떨어질 때의 중력 — 올라갈 때보다는 무겁지만, 예전(4600)보다 20% 낮춰 낙하를 늦췄다.
 *
 * 올라갈 때와 내려올 때가 같으면 정점에서 붕 뜬 것처럼 가볍게 느껴지므로 하강을 더
 * 무겁게 두는 원칙은 유지하되(상승의 약 2.4배), 낙하가 너무 빨라 '툭 떨어지는'
 * 느낌이 과했던 걸 완만하게 되돌린다. 낙하가 느려지면 체공·가로 도달거리는
 * 오히려 늘어나므로 발판이 더 못 닿게 될 일은 없다.
 */
export const FOREST_FALL_GRAVITY = 3680;

/** 지금 속도에서 적용할 중력 (올라가는 중이면 가볍게, 떨어지는 중이면 무겁게) */
export function gravityFor(vy: number): number {
  return vy < 0 ? FOREST_GRAVITY : FOREST_FALL_GRAVITY;
}

/**
 * 공중 가로 조작의 가속(px/s²). 지상에서는 목표 속도로 즉시 붙지만, 공중에서는
 * 이 가속으로 서서히 붙는다 — 방향을 바꾸려면 관성을 거슬러야 해서 좌우로
 * '와다다' 튀지 않고 메이플처럼 무게가 실린다. (0→255 약 0.11초, 완전 반전 약 0.21초)
 * 점프하며 방향키를 누르고 있었다면 그 방향 최고 속도로 출발하므로, 마음먹고
 * 건너뛰는 점프의 도달거리는 그대로 유지된다.
 */
export const FOREST_AIR_ACCEL = 2400;

/** 착지 직전(이 시간 안)에 누른 점프 입력을 기억했다가 닿는 순간 실행한다 — '눌렀는데 씹힘' 방지 */
export const JUMP_BUFFER_MS = 120;
/** 발판을 걸어 벗어난 직후 이 시간까지는 아직 점프를 받아 준다 (코요테 타임) */
export const COYOTE_MS = 90;

/** 발판 사이 세로 간격 — 최고 높이 77px 에 15px 여유 */
const STEP = 62;

/**
 * 부딪힘 판정에 쓰는 캐릭터 몸통.
 * 미니미 그림 크기는 lib/minimi/fit.ts 로 전부 같게 맞추므로, 어떤 미니미를 입어도
 * 판정은 이 한 가지다. (그림이 큰 미니미가 불리해지는 일이 없다)
 */
export const BODY_W = 30;
export const BODY_H = 46;

/**
 * ↓ 를 누르고 엎드렸을 때의 몸통 높이.
 *
 * 이 높이를 넘겨 지나가는 방해물은 엎드려서 피할 수 있다. 대신 엎드리면 움직일 수 없어서,
 * '기다릴 자리' 와 '뛸 순간' 을 고르는 놀이가 된다 — 타이밍만 맞히는 것보다 너그럽다.
 */
export const BODY_H_CROUCH = 30;

/**
 * 엎드려 피할 수 있는 방해물의 높이 — 발판 윗면에서 이만큼 위.
 *
 * 세 조건을 동시에 만족해야 한다 (방해물 반지름 13, 발판 간격 62 기준).
 *   서 있으면 맞는다      : DUCKABLE < 몸통 46 + 13 = 59
 *   엎드리면 안 맞는다     : DUCKABLE > 엎드린 몸통 30 + 13 = 43
 *   위 발판 사람은 안 맞는다 : DUCKABLE < 62 − 13 = 49
 * 세 번째를 빼먹고 50 으로 올려 봤더니, 방해물이 한 칸 위 발판의 발높이까지 올라가
 * 그 발판에서는 엎드려도 맞고 기다릴 자리조차 없어졌다. 46 이 안전한 가운데다.
 */
const DUCKABLE = 46;

/**
 * 방해물에 닿았을 때 튕겨 나가는 세기와 조작을 못 하는 시간.
 *
 * KNOCK_VY 는 '위로 살짝' 만 뜨는 값이다(최고 높이 ≈ 200²/(2·1560) ≈ 13px, 발판 간격 62px
 * 의 1/5). 위로 세게 쏘면 그 반동으로 발판을 건너뛰는 버그가 되므로 일부러 낮게 둔다.
 * 세기(knock 배수)는 옆으로 밀리는 vx 와 못 움직이는 stun 에만 실린다 — 위로는 커지지 않는다.
 */
export const KNOCK_VX = 300;
export const KNOCK_VY = 200;
export const KNOCK_MS = 420;

/**
 * 바닥에 랜덤으로 생기는 폭탄.
 *
 * 한 번에 하나씩, 바닥의 여러 자리(bombSpots) 중 무작위로 골라 나타나 5초를 센 뒤 터진다.
 * 터지는 순간 반경(BOMB_BLAST_R) 안에 있으면 저 멀리 날아간다. 자리·시각은 모두 벽시계의
 * 함수라 서버 없이도 모든 화면이 같은 폭탄을 본다.
 */
export const BOMB_ARM_MS = 5000; // 5초 카운트다운
export const BOMB_BLAST_MS = 450; // 터지는 순간(넉백이 유효한 창)
export const BOMB_GAP_MS = 900; // 다음 폭탄이 나기까지 잠깐 빈다
export const BOMB_BLAST_R = 110; // 이 반경(px) 안이면 날아간다
/** 폭탄 넉백 배수 — 크게 잡아 확실히 멀리 날린다 */
export const BOMB_KNOCK = 2.4;

/* ---------------------------------------------------------------- 1층 */

const F1_GROUND_Y = 1760;
const F1_SUMMIT_Y = 210;

/**
 * 1층 발판 배치.
 *
 * 좌우로 훑으며 지그재그로 올라간다. 발판 폭은 56~80px 로 좁고(예전 140~180px),
 * 세로 간격은 62px 로 최고 높이(77px)에 딱 여유만 남긴다.
 * 방향을 바꾸는 자리에만 110px 쉼터를 둬서 숨을 돌릴 수 있게 했다.
 * 위로 갈수록 발판이 좁아진다.
 */
const F1_PLATFORMS: Platform[] = [
  { x: 500, y: F1_GROUND_Y, w: FOREST_W }, // 땅 — 시작

  { x: 180, y: 1698, w: 80 },
  { x: 300, y: 1636, w: 80 },
  { x: 420, y: 1574, w: 80 },
  { x: 540, y: 1512, w: 80 },
  { x: 660, y: 1450, w: 80 },
  { x: 780, y: 1388, w: 80 },
  { x: 890, y: 1326, w: 110 }, // 쉼터 (오른쪽 끝에서 되돌아간다)

  { x: 790, y: 1264, w: 70 },
  { x: 670, y: 1202, w: 70 },
  { x: 550, y: 1140, w: 70 },
  { x: 430, y: 1078, w: 70 },
  { x: 310, y: 1016, w: 70 },
  { x: 190, y: 954, w: 70 },
  { x: 100, y: 892, w: 110 }, // 쉼터 (왼쪽 끝)

  { x: 210, y: 830, w: 64 },
  { x: 330, y: 768, w: 64 },
  { x: 450, y: 706, w: 64 },
  { x: 570, y: 644, w: 64 },
  { x: 690, y: 582, w: 64 },
  { x: 810, y: 520, w: 64 },
  { x: 900, y: 458, w: 110 }, // 쉼터 (오른쪽 끝)

  // 마지막 세 칸은 가장 좁다
  { x: 780, y: 396, w: 56 },
  { x: 670, y: 334, w: 56 },
  { x: 560, y: 272, w: 56 },

  { x: 500, y: F1_SUMMIT_Y, w: 150 }, // 정상
];

const F = '/resources/images/plaza/forest';

/*
 * 정상에서 숲 깊은 곳으로 들어가는 문.
 * 판정 상자가 정상 발판(425~575) 안에 들어와야 한다 — 발판 밖으로 걸치면
 * 서 있을 수 있는 자리와 문이 겹치는 구간이 좁아져서 들어가기가 까다로워진다.
 */
const F1_NEXT_PORTAL: Portal = {
  to: 'forest2', label: '숲 깊은 곳', x: 465, y: F1_SUMMIT_Y, w: 70, h: 100,
};

/** 1층 시작점의 되돌아가는 문 */
const F1_BACK_PORTAL: Portal = {
  to: 'plaza', label: '광장', x: 92, y: F1_GROUND_Y, w: 80, h: 112,
};

/**
 * 장식.
 * 배경 나무(far)는 흐리게 깔아 깊이를 주고, 발판 위 버섯·돌·풀은 밟는 자리를 눈에 띄게 한다.
 * 발판이 좁아졌으므로 장식도 발판 폭 안에 들어오는 작은 것만 올린다.
 */
const F1_PROPS: Prop[] = [
  // ---- 배경 나무 ----
  { src: `${F}/tree-a.png`, x: 90, y: F1_GROUND_Y, w: 250, far: true },
  { src: `${F}/tree-b.png`, x: 330, y: F1_GROUND_Y, w: 190, far: true, flip: true },
  { src: `${F}/tree-a.png`, x: 700, y: F1_GROUND_Y, w: 240, far: true, flip: true },
  { src: `${F}/tree-b.png`, x: 930, y: F1_GROUND_Y, w: 200, far: true },
  { src: `${F}/tree-b.png`, x: 180, y: 1500, w: 210, far: true },
  { src: `${F}/tree-a.png`, x: 620, y: 1400, w: 230, far: true, flip: true },
  { src: `${F}/tree-b.png`, x: 940, y: 1180, w: 200, far: true, flip: true },
  { src: `${F}/tree-a.png`, x: 400, y: 1100, w: 220, far: true },
  { src: `${F}/tree-b.png`, x: 80, y: 780, w: 190, far: true },
  { src: `${F}/tree-a.png`, x: 560, y: 700, w: 210, far: true, flip: true },
  { src: `${F}/tree-b.png`, x: 900, y: 560, w: 190, far: true },
  { src: `${F}/tree-a.png`, x: 330, y: 420, w: 200, far: true, flip: true },

  // ---- 땅 ----
  { src: `${F}/bush.png`, x: 420, y: F1_GROUND_Y, w: 78 },
  { src: `${F}/bush.png`, x: 620, y: F1_GROUND_Y, w: 66, flip: true },
  { src: `${F}/rock.png`, x: 780, y: F1_GROUND_Y, w: 52 },
  { src: `${F}/mushroom.png`, x: 340, y: F1_GROUND_Y, w: 30 },

  // ---- 쉼터 위 (넓은 발판에만) ----
  { src: `${F}/mushroom.png`, x: 930, y: 1326, w: 26 },
  { src: `${F}/rock.png`, x: 65, y: 892, w: 38 },
  { src: `${F}/mushroom.png`, x: 940, y: 458, w: 26, flip: true },

  // ---- 정상 표지판 ----
  { src: `${F}/sign.png`, x: 555, y: F1_SUMMIT_Y, w: 58 },
];

const FOREST: PlazaMap = {
  id: 'forest',
  name: '인내의 숲',
  kind: 'platform',
  w: FOREST_W,
  h: 1800,
  viewH: FOREST_VIEW_H,
  viewW: FOREST_VIEW_W,
  // 세로는 발판이 정하므로 넉넉하게 열어 둔다 (바닥으로 떨어지면 다시 시작)
  walk: { minX: 26, maxX: FOREST_W - 26, minY: 0, maxY: 1800 },
  speed: FOREST_SPEED,
  portals: [F1_BACK_PORTAL, F1_NEXT_PORTAL],
  platforms: F1_PLATFORMS,
  props: F1_PROPS,
  hazards: [],
  // 시작 위치는 문에서 조금 떨어뜨린다 (겹쳐 서면 ↑ 한 번에 되돌아가 버린다)
  spawn: (seed) => ({ x: 210 + (hash(seed) % 90), y: F1_GROUND_Y }),
  arrival: {
    plaza: { x: 220, y: F1_GROUND_Y },
    // 깊은 곳에서 돌아오면 정상에 선다 (문에서 비켜서)
    forest2: { x: 560, y: F1_SUMMIT_Y },
  },
  startY: F1_GROUND_Y,
  summitY: F1_SUMMIT_Y,
  // 구간별 점프 체공 시간의 합이 8.3초 — 그보다 빠를 수는 없다
  minClimbMs: 8000,
};

/* ---------------------------------------------------------- 2층 (깊은 곳) */

const F2_GROUND_Y = 1260;
const F2_SUMMIT_Y = 210;

/**
 * 2층 발판 배치.
 * 1층과 같은 간격(62px)이지만 발판이 더 좁고, 무엇보다 방해물이 길을 막는다.
 */
const F2_PLATFORMS: Platform[] = [
  { x: 500, y: F2_GROUND_Y, w: FOREST_W }, // 땅 — 시작

  { x: 200, y: 1198, w: 64 },
  { x: 320, y: 1136, w: 64 },
  { x: 440, y: 1074, w: 64 },
  { x: 560, y: 1012, w: 64 },
  { x: 680, y: 950, w: 64 },
  { x: 800, y: 888, w: 64 },
  { x: 890, y: 826, w: 100 }, // 쉼터

  { x: 780, y: 764, w: 60 },
  { x: 660, y: 702, w: 60 },
  { x: 540, y: 640, w: 60 },
  { x: 420, y: 578, w: 60 },
  { x: 300, y: 516, w: 60 },
  { x: 180, y: 454, w: 60 },
  { x: 90, y: 392, w: 100 }, // 쉼터

  { x: 200, y: 330, w: 56 },
  // 여기만 130px 을 벌려 놨더니 발구름 여유가 10px(42ms) 밖에 안 됐다.
  // 프레임을 맞춰야 넘는 건 어려운 게 아니라 운이라서 110px 로 좁혔다.
  { x: 310, y: 268, w: 56 },

  { x: 460, y: F2_SUMMIT_Y, w: 140 }, // 정상
];

/**
 * 방해물 배치.
 *
 * 주기와 위상이 서로 달라서 다 같이 비켜 주는 순간은 없고, 대신 한 마리씩 지나갈 틈은
 * 반드시 생긴다 — 기다렸다 뛰면 넘어갈 수 있어야 '인내' 지 운이 아니다.
 *
 * 두 종류로 나눠 놓았다.
 *  - 발판 위를 좌우로 훑는 것 : 발판에서 DUCKABLE(46px) 위로 지나가서 **엎드리면 피할 수 있다**.
 *    처음엔 발높이(발판+4px)에 뒀는데, 그러면 엎드려도 그대로 맞아서 오직 타이밍뿐이라
 *    너무 빡빡했다.
 *  - 발판 사이 허공에서 오르내리는 것 : 서 있을 자리가 아니라 '길목' 을 막는다.
 *    이건 엎드릴 데가 없으니 순간을 봐서 뛰어넘어야 한다. (3마리만)
 */
const F2_HAZARDS: Hazard[] = [
  // ---- 발판 위를 훑는다 → 엎드려서 피한다 ----
  { src: `${F}/hazard-spike.png`, x: 260, y: 1136 - DUCKABLE, ax: 80, ay: 0, period: 3.0, phase: 0, w: 34, r: 13 },
  { src: `${F}/hazard-bee.png`, x: 500, y: 1012 - DUCKABLE, ax: 110, ay: 0, period: 3.6, phase: 0.3, w: 36, r: 13 },
  { src: `${F}/hazard-spike.png`, x: 740, y: 888 - DUCKABLE, ax: 90, ay: 0, period: 2.8, phase: 0.6, w: 34, r: 13 },
  { src: `${F}/hazard-spike.png`, x: 600, y: 702 - DUCKABLE, ax: 100, ay: 0, period: 3.2, phase: 0.45, w: 34, r: 13 },
  { src: `${F}/hazard-bee.png`, x: 360, y: 578 - DUCKABLE, ax: 110, ay: 0, period: 3.8, phase: 0.2, w: 36, r: 13 },
  { src: `${F}/hazard-spike.png`, x: 240, y: 516 - DUCKABLE, ax: 80, ay: 0, period: 2.6, phase: 0.7, w: 34, r: 13 },
  { src: `${F}/hazard-spike.png`, x: 265, y: 330 - DUCKABLE, ax: 90, ay: 0, period: 3.0, phase: 0.15, w: 34, r: 13 },

  // ---- 허공에서 오르내린다 → 순간을 봐서 뛰어넘는다 ----
  { src: `${F}/hazard-bee.png`, x: 835, y: 790, ax: 0, ay: 62, period: 2.4, phase: 0.1, w: 36, r: 13 },
  { src: `${F}/hazard-bee.png`, x: 135, y: 420, ax: 0, ay: 56, period: 2.2, phase: 0.5, w: 36, r: 13 },
  /*
   * 마지막 한 마리는 정상 발판 '위' 가 아니라 마지막 점프의 '길목' 을 지킨다.
   * 정상에 세워 두면 한참 올라온 사람을 도착 직후에 떨어뜨려서, 어려운 게 아니라 억울하다.
   */
  { src: `${F}/hazard-bee.png`, x: 350, y: 244, ax: 0, ay: 50, period: 2.0, phase: 0.8, w: 36, r: 13 },
];

const F2_PROPS: Prop[] = [
  { src: `${F}/tree-a.png`, x: 130, y: F2_GROUND_Y, w: 240, far: true },
  { src: `${F}/tree-b.png`, x: 420, y: F2_GROUND_Y, w: 190, far: true, flip: true },
  { src: `${F}/tree-a.png`, x: 760, y: F2_GROUND_Y, w: 250, far: true, flip: true },
  { src: `${F}/tree-b.png`, x: 250, y: 1000, w: 200, far: true },
  { src: `${F}/tree-a.png`, x: 700, y: 900, w: 230, far: true, flip: true },
  { src: `${F}/tree-b.png`, x: 930, y: 700, w: 190, far: true },
  { src: `${F}/tree-a.png`, x: 480, y: 600, w: 210, far: true },
  { src: `${F}/tree-b.png`, x: 120, y: 340, w: 190, far: true, flip: true },

  { src: `${F}/bush.png`, x: 560, y: F2_GROUND_Y, w: 74 },
  { src: `${F}/rock.png`, x: 700, y: F2_GROUND_Y, w: 50 },
  { src: `${F}/mushroom.png`, x: 380, y: F2_GROUND_Y, w: 30 },
  { src: `${F}/mushroom.png`, x: 930, y: 826, w: 26 },
  { src: `${F}/rock.png`, x: 55, y: 392, w: 36 },
  { src: `${F}/sign.png`, x: 415, y: F2_SUMMIT_Y, w: 58 },
];

const FOREST2: PlazaMap = {
  id: 'forest2',
  name: '숲 깊은 곳',
  kind: 'platform',
  w: FOREST_W,
  h: 1300,
  viewH: FOREST_VIEW_H,
  viewW: FOREST_VIEW_W,
  walk: { minX: 26, maxX: FOREST_W - 26, minY: 0, maxY: 1300 },
  speed: FOREST_SPEED,
  portals: [
    { to: 'forest', label: '인내의 숲', x: 92, y: F2_GROUND_Y, w: 80, h: 112 },
    // 정상 발판(390~530) 안에 들어오게 — 밖으로 걸치면 들어갈 자리가 없다.
    // 예전엔 여기가 완주 지점이라 광장으로 나갔지만, 이제 더 깊은 3층으로 이어진다.
    { to: 'forest3', label: '가장 깊은 곳', x: 495, y: F2_SUMMIT_Y, w: 70, h: 100 },
  ],
  platforms: F2_PLATFORMS,
  props: F2_PROPS,
  hazards: F2_HAZARDS,
  spawn: (seed) => ({ x: 210 + (hash(seed) % 90), y: F2_GROUND_Y }),
  arrival: {
    forest: { x: 220, y: F2_GROUND_Y },
    plaza: { x: 220, y: F2_GROUND_Y },
    // 3층에서 되돌아오면 2층 정상에 선다 (문에서 비켜서)
    forest3: { x: 460, y: F2_SUMMIT_Y },
  },
  startY: F2_GROUND_Y,
  summitY: F2_SUMMIT_Y,
  // 구간별 점프 체공 시간의 합이 5.7초
  minClimbMs: 5500,
};

/* ------------------------------------------------------ 3층 (가장 깊은 곳) */

/**
 * 3층은 가로로도 넓다(2000px). 카메라가 좌우로도 따라가서 'ㄹ자' 동선이 된다.
 * 바닥·가운데 스트레이트는 완전 평지가 아니라 **점프로 건너는 틈과 오르내림**이 섞여 있어,
 * 그냥 달려서는 못 지난다. 여기에 **바닥 표면을 빠르게 왕복하는 블레이드(patrol)**, 사다리의
 * 스위퍼·길목 벌, 하늘에서 천천히 내려오는 큰 바위까지 여러 종류가 섞인다.
 */
const FOREST3_W = 2000;
const F3_GROUND_Y = 1450;
const F3_SUMMIT_Y = 180;

const F3_PLATFORMS: Platform[] = [
  // ---- 바닥 스트레이트: 잘게 쪼갠 발판을 여러 번 점프하며 오르내린다 (왼→오, 카메라 우측 팬) ----
  { x: 150, y: 1450, w: 240 }, // 시작 발판
  { x: 400, y: 1450, w: 80 },
  { x: 560, y: 1398, w: 80 },
  { x: 710, y: 1346, w: 80 },
  { x: 860, y: 1398, w: 80 },
  { x: 1010, y: 1450, w: 80 },
  { x: 1160, y: 1398, w: 80 },
  { x: 1310, y: 1346, w: 80 }, // 이 타일 코너를 톱날이 돈다
  { x: 1470, y: 1398, w: 80 },
  { x: 1620, y: 1450, w: 80 },
  { x: 1800, y: 1440, w: 160 }, // 오른쪽 끝 — 여기서 위로 오른다

  // ---- 오른쪽 사다리 (x 1730↔1850, 간격 62px) ----
  { x: 1730, y: 1378, w: 70 },
  { x: 1850, y: 1316, w: 64 },
  { x: 1730, y: 1254, w: 64 },
  { x: 1850, y: 1192, w: 64 },
  { x: 1730, y: 1130, w: 64 },
  { x: 1850, y: 1068, w: 64 },
  { x: 1730, y: 1006, w: 64 },
  { x: 1850, y: 944, w: 64 },
  { x: 1730, y: 882, w: 64 },
  { x: 1830, y: 820, w: 100 }, // 쉼터 (오른쪽 위)

  // ---- 가운데 스트레이트: 여기도 오르내린다 (오→왼, 카메라 좌측 팬) ----
  { x: 1665, y: 768, w: 90 },
  { x: 1500, y: 720, w: 80 },
  { x: 1335, y: 772, w: 80 },
  { x: 1170, y: 710, w: 80 },
  { x: 1005, y: 762, w: 80 },
  { x: 840, y: 710, w: 80 },
  { x: 675, y: 772, w: 100 }, // 쉼터 (왼쪽)

  // ---- 왼쪽 사다리로 정상까지 (x 315↔435) ----
  { x: 555, y: 710, w: 66 },
  { x: 435, y: 648, w: 64 },
  { x: 315, y: 586, w: 64 },
  { x: 435, y: 524, w: 64 },
  { x: 315, y: 462, w: 62 },
  { x: 435, y: 400, w: 60 },
  { x: 315, y: 338, w: 58 },
  { x: 420, y: 276, w: 58 },
  { x: 320, y: 214, w: 56 },

  { x: 360, y: F3_SUMMIT_Y, w: 150 }, // 정상
];

/**
 * 3층 방해물 — 종류가 다양하다.
 *  - 톱날(orbit) : **한 바닥 타일의 네 코너를 따라 빙글빙글** 돈다. 그 타일을 지날 때 타이밍을 본다.
 *  - 발판 위 스위퍼 : DUCKABLE(46px) 위로 지나가 **엎드리면 피한다**.
 *  - 허공 길목 벌 : **순간을 봐서 뛰어넘는다**.
 *  - 하늘에서 천천히 내려오는 큰 바위(하나) : 닿으면 완전히 멀리 날아간다.
 * (이 밖에 바닥 곳곳에서 5초 뒤 터지는 랜덤 폭탄이 하나씩 생긴다 — bombSpots)
 */
const F3_HAZARDS: Hazard[] = [
  // ---- 톱날: 바닥 타일(1310, 1346) 의 코너를 따라 빙글빙글 돈다 ----
  { src: `${F}/blade.svg`, x: 1310, y: 1368, ax: 56, ay: 42, period: 2.0, phase: 0, w: 46, r: 16, kind: 'orbit' },
  // ---- 톱날: 가운데 타일(1170, 710) 의 코너를 따라 반대 방향으로 돈다 ----
  { src: `${F}/blade.svg`, x: 1170, y: 732, ax: 56, ay: 42, period: -2.2, phase: 0.3, w: 46, r: 16, kind: 'orbit' },

  // ---- 삼각 스파이크가 좁은 고리를 개빠르게 돈다 (한 구역만 날아다닌다, ≈1150px/s) ----
  {
    src: `${F}/hazard-spike.png`, x: 0, y: 0, ax: 0, ay: 0, period: 1.9, phase: 0, w: 40, r: 15,
    kind: 'patrol',
    pts: [
      { x: 850, y: 680 }, { x: 1450, y: 680 }, { x: 1450, y: 1160 }, { x: 850, y: 1160 },
    ],
  },

  // ---- 바닥 스트레이트: 작은 발판 사이사이 스위퍼·길목 ----
  { src: `${F}/hazard-bee.png`, x: 480, y: 1400, ax: 0, ay: 64, period: 2.0, phase: 0.3, w: 36, r: 13 },
  { src: `${F}/hazard-spike.png`, x: 860, y: 1398 - DUCKABLE, ax: 48, ay: 0, period: 2.0, phase: 0.1, w: 34, r: 13 },
  { src: `${F}/hazard-bee.png`, x: 1085, y: 1402, ax: 0, ay: 70, period: 2.1, phase: 0.5, w: 36, r: 13 },
  { src: `${F}/hazard-spike.png`, x: 1470, y: 1398 - DUCKABLE, ax: 48, ay: 0, period: 1.9, phase: 0.6, w: 34, r: 13 },
  { src: `${F}/hazard-bee.png`, x: 1710, y: 1404, ax: 0, ay: 66, period: 2.0, phase: 0.2, w: 36, r: 13 },

  // ---- 오른쪽 사다리 ----
  { src: `${F}/hazard-spike.png`, x: 1730, y: 1254 - DUCKABLE, ax: 60, ay: 0, period: 2.0, phase: 0.2, w: 34, r: 13 },
  { src: `${F}/hazard-spike.png`, x: 1850, y: 1068 - DUCKABLE, ax: 60, ay: 0, period: 1.9, phase: 0.6, w: 34, r: 13 },
  { src: `${F}/hazard-bee.png`, x: 1790, y: 1160, ax: 0, ay: 64, period: 1.9, phase: 0.4, w: 36, r: 13 },
  { src: `${F}/hazard-bee.png`, x: 1790, y: 900, ax: 0, ay: 60, period: 2.1, phase: 0.7, w: 36, r: 13 },

  // ---- 가운데 스트레이트 길목 ----
  { src: `${F}/hazard-bee.png`, x: 1250, y: 656, ax: 0, ay: 56, period: 1.8, phase: 0.5, w: 36, r: 13 },
  { src: `${F}/hazard-bee.png`, x: 920, y: 656, ax: 0, ay: 56, period: 2.0, phase: 0.15, w: 36, r: 13 },

  // ---- 왼쪽 사다리 ----
  { src: `${F}/hazard-bee.png`, x: 375, y: 490, ax: 0, ay: 60, period: 1.9, phase: 0.3, w: 36, r: 13 },
  { src: `${F}/hazard-bee.png`, x: 375, y: 310, ax: 0, ay: 56, period: 1.7, phase: 0.8, w: 36, r: 13 },
  /* 마지막 한 마리는 정상 '위' 가 아니라 마지막 점프의 '길목' 을 지킨다 */
  { src: `${F}/hazard-bee.png`, x: 385, y: 210, ax: 0, ay: 44, period: 1.6, phase: 0.5, w: 36, r: 13 },

  /*
   * ---- 커다란 둥근 바위 하나가 맨 위에서 천천히 내려온다 → 닿으면 완전히 멀리 날아간다(knock 2.4) ----
   * 맨 위(y 20)에서 바닥까지 17~21초에 걸쳐 천천히, 닿으면 1~5초(랜덤) 쉬었다가 새 x 자리(150~1850)에서
   * 다시 내려온다. 넓은 맵을 가로질러 어디로 떨어질지 모른다. 한 번에 하나뿐이다.
   */
  { src: `${F}/boulder.svg`, x: 1000, y: 20, ax: 850, ay: 1470, period: 22, phase: 0, w: 120, r: 46, kind: 'fall', knock: 2.4 },
];

/** 3층 바닥 폭탄이 생길 수 있는 자리 — 바닥 발판들과 위층 발판 몇 곳 */
const F3_BOMB_SPOTS = [
  { x: 400, y: 1450 }, { x: 710, y: 1346 }, { x: 1010, y: 1450 }, { x: 1310, y: 1346 },
  { x: 1620, y: 1450 }, { x: 1500, y: 720 }, { x: 1005, y: 762 }, { x: 675, y: 772 },
  { x: 315, y: 462 },
];

const F3_PROPS: Prop[] = [
  { src: `${F}/tree-a.png`, x: 300, y: F3_GROUND_Y, w: 240, far: true },
  { src: `${F}/tree-b.png`, x: 900, y: F3_GROUND_Y, w: 200, far: true, flip: true },
  { src: `${F}/tree-a.png`, x: 1500, y: F3_GROUND_Y, w: 250, far: true },
  { src: `${F}/tree-b.png`, x: 1850, y: F3_GROUND_Y, w: 200, far: true, flip: true },
  { src: `${F}/tree-a.png`, x: 1780, y: 900, w: 210, far: true, flip: true },
  { src: `${F}/tree-b.png`, x: 1200, y: 720, w: 190, far: true },
  { src: `${F}/tree-a.png`, x: 520, y: 520, w: 200, far: true },

  { src: `${F}/bush.png`, x: 1060, y: 1450, w: 74 },
  { src: `${F}/rock.png`, x: 1630, y: 1388, w: 50 },
  { src: `${F}/mushroom.png`, x: 500, y: 1398, w: 30 },
  { src: `${F}/sign.png`, x: 300, y: F3_SUMMIT_Y, w: 58 },
];

const FOREST3: PlazaMap = {
  id: 'forest3',
  name: '가장 깊은 곳',
  kind: 'platform',
  w: FOREST3_W,
  h: 1500,
  viewH: FOREST_VIEW_H,
  viewW: FOREST_VIEW_W,
  walk: { minX: 26, maxX: FOREST3_W - 26, minY: 0, maxY: 1500 },
  speed: FOREST_SPEED,
  portals: [
    { to: 'forest2', label: '숲 깊은 곳', x: 92, y: F3_GROUND_Y, w: 80, h: 112 },
    // 정상 발판(285~435) 안에 들어오게 — 여기가 완주 지점(광장으로 나간다)
    { to: 'plaza', label: '광장', x: 360, y: F3_SUMMIT_Y, w: 70, h: 100 },
  ],
  platforms: F3_PLATFORMS,
  props: F3_PROPS,
  hazards: F3_HAZARDS,
  bombSpots: F3_BOMB_SPOTS,
  spawn: (seed) => ({ x: 150 + (hash(seed) % 90), y: F3_GROUND_Y }),
  arrival: { forest2: { x: 220, y: F3_GROUND_Y }, plaza: { x: 220, y: F3_GROUND_Y } },
  startY: F3_GROUND_Y,
  summitY: F3_SUMMIT_Y,
  // 완주 기록 하한을 위한 대략치 (가로 이동이 길어 실제로는 이보다 오래 걸린다)
  minClimbMs: 6000,
};

/** 닉네임처럼 사람마다 다른 값에서 흩어진 시작점을 얻는다 */
function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/* ================================================================== */

export const MAPS: Record<MapId, PlazaMap> = {
  plaza: PLAZA,
  quiz: QUIZ_ROOM,
  forest: FOREST,
  forest2: FOREST2,
  forest3: FOREST3,
};

export function mapOf(id: MapId | undefined): PlazaMap {
  return MAPS[id ?? 'plaza'] ?? PLAZA;
}

/**
 * 완주 기록의 하한(ms).
 *
 * 기록은 브라우저가 재서 보내므로 마음먹으면 꾸밀 수 있다. 서버가 등반을 따라
 * 계산하는 수준까지는 하지 않고, '물리적으로 불가능한 값' 만 걸러낸다.
 * 발판을 하나도 건너뛸 수 없으니 도전에 속한 모든 층의 점프 체공 시간 합이 하한이다.
 */
export const RUN_MIN_MS = RUN_MAPS.reduce(
  (sum, id) => sum + (MAPS[id].minClimbMs ?? 0),
  0,
);

/**
 * 지금 발밑에 닿을 발판을 찾는다.
 *
 * 위에서 아래로 지나간 구간(prevY → y)에 윗면이 걸쳐 있고 가로 범위 안이면 착지다.
 * 여러 개를 한 프레임에 지났으면(빠르게 떨어질 때) 가장 위 것에 선다.
 * 아래에서 위로는 통과시킨다 — 발판마다 머리를 부딪히면 오를 수가 없다.
 *
 * dropFrom 이 주어지면 그 높이까지의 발판은 무시한다 — 하향 점프(↓ + 점프)로
 * 지금 밟고 선 발판을 통과해 아래로 내려갈 때 쓴다.
 */
export function landingOn(
  platforms: Platform[],
  x: number,
  prevY: number,
  y: number,
  dropFrom?: number | null,
): Platform | null {
  let best: Platform | null = null;
  for (const p of platforms) {
    if (dropFrom != null && p.y <= dropFrom) continue;
    if (prevY > p.y || y < p.y) continue;
    if (x < p.x - p.w / 2 || x > p.x + p.w / 2) continue;
    if (!best || p.y < best.y) best = p;
  }
  return best;
}

/** 발이 문 안에 들어와 있는가 */
export function portalAt(map: PlazaMap, x: number, y: number): Portal | null {
  for (const p of map.portals) {
    if (Math.abs(x - p.x) > p.w / 2) continue;
    // 문은 바닥에서 위로 서 있다 — 발이 그 아래쪽 범위에 있으면 들어간 것으로 본다
    if (y > p.y + 24 || y < p.y - p.h) continue;
    return p;
  }
  return null;
}

/**
 * 낙하물의 '이번 주기' 무작위 값(0~1).
 *
 * 주기 번호(정수)만으로 값을 정하므로 서버 없이도 모든 화면이 같은 자리를 계산한다.
 * (벽시계가 조금 어긋나도, 바뀌는 건 위에서 막 생겨난 찰나뿐이라 승패에 영향이 없다.)
 */
function fallRand(cycle: number): number {
  // cycle 은 벽시계에서 온 큰 수라 먼저 32비트로 접는다(아주 오랜 시간 뒤 패턴이 반복될 뿐).
  // 이후는 Math.imul 로 32비트 정수 연산만 써서 부동소수 오차 없이 모든 화면이 같은 값을 낸다.
  let x = cycle >>> 0;
  x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0;
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** 화면 밖(아무도 못 맞고 보이지도 않는다) 을 뜻하는 y 값 */
const HAZARD_HIDDEN_Y = 1e6;

/** 지금 이 순간 방해물이 있는 자리 (그림 중심) */
export function hazardPos(h: Hazard, nowMs: number): { x: number; y: number } {
  if (h.kind === 'fall') {
    /*
     * 큰 바위 하나가 맨 위에서 아래까지 '천천히' 한 번 내려온다.
     * 바닥에 닿으면 1~5초(랜덤) 쉬었다가, 새 x 자리에서 다시 맨 위부터 내려온다.
     *
     * period 는 '내려오기 + 쉬기' 한 바퀴의 길이(초)다. 쉬는 시간(wait)이 바퀴마다
     * 달라지므로 내려오는 데 걸리는 시간(down = period − wait)도 15~19초 사이에서
     * 바뀐다 — 어차피 다 '십몇 초에 걸쳐 천천히' 라 어색하지 않다.
     */
    const cyc = nowMs / 1000 / h.period + h.phase;
    const n = Math.floor(cyc);
    const t = (cyc - n) * h.period; // 이 바퀴에서 흐른 초
    const wait = 1 + 4 * fallRand(n * 2); // 바닥에서 쉬는 시간 1~5초
    const down = h.period - wait; // 내려오는 데 걸리는 시간(초)
    if (t >= down) return { x: h.x, y: HAZARD_HIDDEN_Y }; // 쉬는 중 — 화면 밖
    const rx = (fallRand(n * 2 + 1) * 2 - 1) * h.ax; // 이 바퀴의 x 자리(랜덤)
    return { x: h.x + rx, y: h.y + h.ay * (t / down) };
  }
  if (h.kind === 'orbit') {
    // 네모(반폭 ax, 반높이 ay)의 테두리를 시계방향으로 돈다. period 가 음수면 반시계.
    const u = ((nowMs / 1000 / h.period + h.phase) % 1 + 1) % 1; // 0~1
    const w2 = h.ax * 2;
    const h2 = h.ay * 2;
    const perim = 2 * (w2 + h2);
    const d = u * perim;
    // 좌상단에서 출발해 위→오른쪽→아래→왼쪽 순으로 한 바퀴
    if (d < w2) return { x: h.x - h.ax + d, y: h.y - h.ay };
    if (d < w2 + h2) return { x: h.x + h.ax, y: h.y - h.ay + (d - w2) };
    if (d < w2 + h2 + w2) return { x: h.x + h.ax - (d - w2 - h2), y: h.y + h.ay };
    return { x: h.x - h.ax, y: h.y + h.ay - (d - w2 - h2 - w2) };
  }
  if (h.kind === 'patrol' && h.pts && h.pts.length >= 2) {
    // 바닥의 닫힌 외곽선(마지막 점 → 첫 점 변까지 포함)을 따라 계속 한 방향으로 회전한다.
    // 윗면을 훑고 → 끝에서 아래로 내려가 → 밑면을 지나 → 반대 끝에서 올라와 → 다시 윗면.
    const pts = h.pts;
    const n = pts.length;
    const segs: number[] = [];
    let total = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      segs.push(len);
      total += len;
    }
    const u = ((nowMs / 1000 / h.period + h.phase) % 1 + 1) % 1; // period<0 이면 반대로 돈다
    let d = u * total;
    for (let i = 0; i < n; i++) {
      if (d <= segs[i]) {
        const a = pts[i];
        const b = pts[(i + 1) % n];
        const t = segs[i] === 0 ? 0 : d / segs[i];
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
      d -= segs[i];
    }
    return pts[0];
  }
  const t = (nowMs / 1000 / h.period + h.phase) * Math.PI * 2;
  return { x: h.x + Math.sin(t) * h.ax, y: h.y + Math.sin(t) * h.ay };
}

/**
 * 지금 방해물에 부딪혔는가. 부딪힌 방해물을 돌려준다.
 * 몸통은 발(x, y)에서 위로 BODY_H, 좌우로 BODY_W 인 상자로 본다.
 * 엎드리고 있으면(crouching) 몸통이 낮아져 머리 위로 지나가는 것을 피한다.
 */
export function hazardHit(
  map: PlazaMap,
  x: number,
  y: number,
  nowMs: number,
  crouching = false,
): Hazard | null {
  if (map.hazards.length === 0) return null;
  const left = x - BODY_W / 2;
  const right = x + BODY_W / 2;
  const top = y - (crouching ? BODY_H_CROUCH : BODY_H);

  for (const h of map.hazards) {
    const at = hazardPos(h, nowMs);
    if (at.x + h.r < left || at.x - h.r > right) continue;
    if (at.y + h.r < top || at.y - h.r > y) continue;
    return h;
  }
  return null;
}

/** 카메라가 보여 줄 세로 시작점 (맵 밖으로 넘어가지 않게 자른다) */
export function cameraY(map: PlazaMap, focusY: number): number {
  if (map.h <= map.viewH) return 0;
  return clamp(focusY - map.viewH * 0.62, 0, map.h - map.viewH);
}

/** 카메라가 보여 줄 가로 시작점. 맵이 화면보다 넓을 때만 좌우로 따라간다(캐릭터를 가운데). */
export function cameraX(map: PlazaMap, focusX: number): number {
  if (map.w <= map.viewW) return 0;
  return clamp(focusX - map.viewW / 2, 0, map.w - map.viewW);
}
