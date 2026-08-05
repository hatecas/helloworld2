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
  /** 왕복의 중심 (x, y 는 그림 중심) */
  x: number;
  y: number;
  /** 좌우 · 위아래 진폭(px). 0 이면 그 방향으로 안 움직인다. */
  ax: number;
  ay: number;
  /** 한 번 왕복하는 데 걸리는 시간(초) */
  period: number;
  /** 위상(0~1) — 여러 마리가 한 몸처럼 움직이지 않게 어긋내는 값 */
  phase: number;
  /** 그림 폭(논리 px) */
  w: number;
  /** 부딪힘 판정 반지름(논리 px) — 보이는 그림보다 조금 작게 잡아 억울하지 않게 */
  r: number;
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
  /** 걸어다닐 수 있는 범위 (발 기준) */
  walk: Bounds;
  /** 가로 이동 속도 (px/초) */
  speed: number;
  portals: Portal[];
  platforms: Platform[];
  props: Prop[];
  hazards: Hazard[];
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
export const RUN_LAST: MapId = 'forest2';
/** 이 층들을 오르는 동안은 시계가 멈추지 않는다 (문을 지나도 이어진다) */
export const RUN_MAPS: MapId[] = [RUN_FIRST, RUN_LAST];

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

/** 방해물에 닿았을 때 튕겨 나가는 세기와 조작을 못 하는 시간 */
export const KNOCK_VX = 300;
export const KNOCK_VY = 380;
export const KNOCK_MS = 420;

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
  walk: { minX: 26, maxX: FOREST_W - 26, minY: 0, maxY: 1300 },
  speed: FOREST_SPEED,
  portals: [
    { to: 'forest', label: '인내의 숲', x: 92, y: F2_GROUND_Y, w: 80, h: 112 },
    // 정상 발판(390~530) 안에 들어오게 — 밖으로 걸치면 들어갈 자리가 없다
    { to: 'plaza', label: '광장', x: 495, y: F2_SUMMIT_Y, w: 70, h: 100 },
  ],
  platforms: F2_PLATFORMS,
  props: F2_PROPS,
  hazards: F2_HAZARDS,
  spawn: (seed) => ({ x: 210 + (hash(seed) % 90), y: F2_GROUND_Y }),
  arrival: { forest: { x: 220, y: F2_GROUND_Y }, plaza: { x: 220, y: F2_GROUND_Y } },
  startY: F2_GROUND_Y,
  summitY: F2_SUMMIT_Y,
  // 구간별 점프 체공 시간의 합이 5.7초
  minClimbMs: 5500,
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
};

export function mapOf(id: MapId | undefined): PlazaMap {
  return MAPS[id ?? 'plaza'] ?? PLAZA;
}

/**
 * 완주 기록의 하한(ms).
 *
 * 기록은 브라우저가 재서 보내므로 마음먹으면 꾸밀 수 있다. 서버가 등반을 따라
 * 계산하는 수준까지는 하지 않고, '물리적으로 불가능한 값' 만 걸러낸다.
 * 발판을 하나도 건너뛸 수 없으니 두 층의 점프 체공 시간 합이 하한이다.
 */
export const RUN_MIN_MS =
  (MAPS[RUN_FIRST].minClimbMs ?? 0) + (MAPS[RUN_LAST].minClimbMs ?? 0);

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

/** 지금 이 순간 방해물이 있는 자리 (그림 중심) */
export function hazardPos(h: Hazard, nowMs: number): { x: number; y: number } {
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
