/**
 * 도트 시트에서 뽑은 미니미 팩.
 *
 * public/resources/images/minimi/_sheets/*.png 는 전부 같은 곳에서 온 48x64 시트라
 * 16x16 12프레임 배치가 똑같다. 그래서 프레임 번호의 뜻도 22장이 전부 공유한다.
 * (22장을 전부 펼쳐 놓고 눈으로 맞춰 본 값이다)
 *
 *    0, 1  서 있기 · 걷기 (한 칸 들썩)
 *    2, 3  입을 벌렸다 닫는다      → 웃음
 *    4, 5  납작하게 엎드린다        → 잠
 *    7, 8  이빨 드러내고 크게 벌린다 → 포효
 *    6, 9~11 은 시무룩·특수 자세라 지금은 안 쓴다
 *
 * 이 파일이 기준이다 — 상점 목록(lib/db/seed.ts), 광장 이모트(lib/plaza/emotes.ts),
 * GIF 생성(scripts/build-minimi-pack.mjs) 이 전부 여기를 본다.
 * 그림을 다시 뽑으려면 프레임 번호만 고치고 `npm run minimi:pack` 을 다시 돌리면 된다.
 */

export const MINIMI_DIR = '/resources/images/minimi';
export const SHEET_DIR = 'public/resources/images/minimi/_sheets';

export interface DotAction {
  /** 통신에 쓰는 이름 — 규약이므로 바꾸면 안 된다 */
  name: string;
  /** 화면 안내에 쓰는 말 */
  label: string;
  /** 파일 이름에 붙는 말. 빈 문자열이면 평소 모습 */
  suffix: string;
  /** 시트에서 쓸 프레임 번호 */
  frames: number[];
  /** 프레임당 지속(1/100초) */
  delay: number;
}

/** 평소 모습 — 서서 들썩이고, 걸을 때도 이 그림이다 */
export const DOT_WALK: DotAction = {
  name: 'walk', label: '걷기', suffix: '', frames: [0, 1], delay: 25,
};

/** 특수 동작. 이 순서가 곧 광장에서의 숫자키 1, 2, 3 이다. */
export const DOT_EMOTES: DotAction[] = [
  { name: 'happy', label: '웃음', suffix: 'Happy', frames: [2, 3], delay: 20 },
  { name: 'roar', label: '포효', suffix: 'Roar', frames: [7, 8], delay: 18 },
  // 자는 건 느려야 자는 것처럼 보인다
  { name: 'sleep', label: '잠', suffix: 'Sleep', frames: [4, 5], delay: 45 },
];

export const DOT_ACTIONS: DotAction[] = [DOT_WALK, ...DOT_EMOTES];

export interface DotMinimi {
  /** 파일 이름의 뿌리 — <id>Icon.gif, <id>HappyIcon.gif ... */
  id: string;
  /** _sheets 안의 원본 시트 파일 이름 */
  sheet: string;
  name: string;
}

/**
 * 시트 22장. 전부 왼쪽(또는 정면)을 보고 있어서 좌우 반전이 필요 없다.
 * 광장은 원본이 왼쪽을 본다고 보고 뒤집으므로, 오른쪽을 보는 시트를 넣을 때만
 * 생성 스크립트에 flip 을 줘야 한다.
 */
export const DOT_MINIMI: DotMinimi[] = [
  { id: 'agumon', sheet: 'Agumon.png', name: '아구몬' },
  { id: 'airdramon', sheet: 'Airdramon.png', name: '에어드라몬' },
  { id: 'beelzebumonBlast', sheet: 'Beelzebumon_Blast.png', name: '베르제브몬 블래스트' },
  { id: 'chibimon', sheet: 'Chibimon.png', name: '치비몬' },
  { id: 'drimogemon', sheet: 'Drimogemon.png', name: '드리모게몬' },
  { id: 'dukemon', sheet: 'Dukemon.png', name: '듀크몬' },
  { id: 'etemon', sheet: 'Etemon.png', name: '에테몬' },
  { id: 'fantomon', sheet: 'Fantomon.png', name: '팬텀몬' },
  { id: 'galgomon', sheet: 'Galgomon.png', name: '갈고몬' },
  { id: 'gekomon', sheet: 'Gekomon.png', name: '게코몬' },
  { id: 'gigimon', sheet: 'Gigimon.png', name: '기기몬' },
  { id: 'greymon', sheet: 'Greymon.png', name: '그레이몬' },
  { id: 'impmon', sheet: 'Impmon.png', name: '임프몬' },
  { id: 'koromon', sheet: 'Koromon.png', name: '코로몬' },
  { id: 'marinAngemon', sheet: 'MarinAngemon.png', name: '마린엔젤몬' },
  { id: 'omegamonX', sheet: 'Omegamon_X.png', name: '오메가몬 X' },
  { id: 'patamon', sheet: 'Patamon.png', name: '파닥몬' },
  { id: 'terriermon', sheet: 'Terriermon.png', name: '테리어몬' },
  { id: 'togemon', sheet: 'Togemon.png', name: '토게몬' },
  { id: 'tsunomon', sheet: 'Tsunomon.png', name: '츠노몬' },
  { id: 'vmon', sheet: 'V-mon.png', name: '브이몬' },
  { id: 'warGreymonX', sheet: 'WarGreymon_X.png', name: '워그레이몬 X' },
];

/** greymon + Happy → greymonHappyIcon */
export function iconName(id: string, suffix = ''): string {
  return `${id}${suffix}Icon`;
}

/** greymon + Happy → /resources/images/minimi/greymonHappyIcon.gif */
export function iconPath(id: string, suffix = ''): string {
  return `${MINIMI_DIR}/${iconName(id, suffix)}.gif`;
}
