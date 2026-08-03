/**
 * 인내의 숲 도트 스프라이트를 그려서 PNG 로 뽑는다.
 *
 *   npm run forest:sprites
 *
 * 광장 배경은 전부 CSS 로 그렸지만, 숲은 발판·나무·버섯처럼 '물체' 가 많아
 * CSS 도형으로는 도트 느낌이 안 난다. 그래서 여기서 픽셀을 직접 찍는다.
 *
 * 작게(1x) 그려서 CSS `image-rendering: pixelated` 로 확대한다 —
 * 파일이 작고, 화면 크기가 바뀌어도 도트가 흐려지지 않는다.
 *
 * 그림을 고치려면 아래 픽셀 맵이나 그리기 코드를 바꾸고 다시 실행하면 된다.
 * (public 아래 PNG 는 이 스크립트의 결과물이므로 직접 편집하지 말 것)
 */
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const plazaDir = resolve(root, 'public/resources/images/plaza');
const forestDir = resolve(plazaDir, 'forest');

/* ------------------------------------------------------------------ */
/* 아주 작은 픽셀 도구                                                  */
/* ------------------------------------------------------------------ */

function canvas(w, h) {
  return { w, h, data: Buffer.alloc(w * h * 4, 0) };
}

function rgba(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function set(c, x, y, hex) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const [r, g, b, a] = rgba(hex);
  const i = (y * c.w + x) * 4;
  c.data[i] = r;
  c.data[i + 1] = g;
  c.data[i + 2] = b;
  c.data[i + 3] = a;
}

function alphaAt(c, x, y) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return 0;
  return c.data[(y * c.w + x) * 4 + 3];
}

function rect(c, x, y, w, h, hex) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(c, xx, yy, hex);
}

/** 꽉 찬 타원 — 나무 잎사귀 덩어리처럼 둥근 덩어리에 쓴다 */
function ellipse(c, cx, cy, rx, ry, hex) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) set(c, x, y, hex);
    }
  }
}

/**
 * 불투명한 부분의 바깥 한 칸을 어두운 색으로 감싼다.
 * 도트 그림이 배경에서 떠 보이게 하는 가장 값싼 방법이고,
 * 손으로 외곽선을 찍는 것보다 실수가 없다.
 */
function outline(c, hex) {
  const edges = [];
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (alphaAt(c, x, y) !== 0) continue;
      const near =
        alphaAt(c, x - 1, y) || alphaAt(c, x + 1, y) || alphaAt(c, x, y - 1) || alphaAt(c, x, y + 1);
      if (near) edges.push([x, y]);
    }
  }
  for (const [x, y] of edges) set(c, x, y, hex);
}

/** 문자 그림 → 캔버스. '.' 은 투명. */
function fromMap(rows, palette) {
  const c = canvas(rows[0].length, rows.length);
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const hex = palette[ch];
      if (hex) set(c, x, y, hex);
    });
  });
  return c;
}

async function save(c, dir, name) {
  mkdirSync(dir, { recursive: true });
  await sharp(c.data, { raw: { width: c.w, height: c.h, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(resolve(dir, `${name}.png`));
  console.log(`  ${name}.png (${c.w}x${c.h})`);
}

/* ------------------------------------------------------------------ */
/* 색                                                                  */
/* ------------------------------------------------------------------ */

const INK = '#101c26'; // 외곽선 — 배경보다 어두운 남색

const PALETTE = {
  // 이끼
  M: '#57a566',
  m: '#3a7a48',
  // 나무 몸통
  W: '#7d5636',
  w: '#5f3f26',
  d: '#462d1a',
  b: '#2d1b0f',
  // 잎
  L: '#4f9a5f',
  l: '#357a46',
  k: '#22562f',
  // 돌
  S: '#6b7684',
  s: '#4d5765',
  t: '#333c48',
  // 버섯
  R: '#cf5c50',
  r: '#a33f37',
  C: '#f2e9d2',
  c: '#cfc3a6',
  // 방해물 — 벌
  Y: '#f2d24b',
  y: '#c9a41f',
  n: '#2a2118',
  V: '#dff1ff',
  // 방해물 — 가시덩굴 열매
  K: '#8e5fc7',
  j: '#6a3fa0',
  i: '#472670',
  // 문(포탈)
  G: '#9fe4ff',
  g: '#4fb0e0',
  h: '#2470a6',
  // 표지판 글자
  x: '#2b2118',
};

/* ------------------------------------------------------------------ */
/* 발판 — 가로로 이어 붙일 수 있는 타일 + 둥근 끝 마감                    */
/* ------------------------------------------------------------------ */

/*
 * 좌우 끝이 이어져야 해서 타일에는 마감을 넣지 않는다.
 * 이끼 결과 나뭇결의 얼룩 위치를 좌우 대칭이 아니게 흩어 놓아
 * 여러 번 반복해도 무늬가 눈에 띄지 않게 했다.
 */
const PLATFORM_TILE = fromMap(
  [
    'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
    'MMmMMMMMMMMmMMMMMMMMmMMMMMMMmMMM',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
    'WwWWWWWwWWWWWWWWWwWWWWWWwWWWWWWW',
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'wwddwwwwwwwddwwwwwwwwwddwwwwwwww',
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'wwwwwddwwwwwwwwwddwwwwwwwwwwddww',
    'dddddddddddddddddddddddddddddddd',
    'dddddddddddddddddddddddddddddddd',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  ],
  PALETTE,
);

/** 왼쪽 끝 마감. 오른쪽은 화면에서 좌우 반전해 쓴다. */
const PLATFORM_CAP = fromMap(
  [
    '...MMMMM',
    '..mMMMMM',
    '.mmmmmmm',
    '.WWWWWWW',
    'WWWWWWWW',
    'wwwwwwww',
    'wwwwwwww',
    'wwwwwwww',
    'wwwwwwww',
    '.ddddddd',
    '..dddddd',
    '...bbbbb',
  ],
  PALETTE,
);

/* ------------------------------------------------------------------ */
/* 나무 — 줄기 + 잎 덩어리를 겹쳐 쌓는다                                 */
/* ------------------------------------------------------------------ */

function tree({ w, h, trunkW, blobs }) {
  const c = canvas(w, h);
  const cx = Math.floor(w / 2);

  // 줄기 — 아래로 갈수록 조금 넓어지게
  const trunkTop = Math.floor(h * 0.55);
  for (let y = trunkTop; y < h; y++) {
    const grow = Math.floor(((y - trunkTop) / (h - trunkTop)) * 2);
    const half = Math.floor(trunkW / 2) + grow;
    for (let x = cx - half; x <= cx + half; x++) {
      // 왼쪽은 밝게, 오른쪽은 어둡게 — 달빛이 한쪽에서 오는 느낌
      set(c, x, y, x < cx ? PALETTE.W : x === cx ? PALETTE.w : PALETTE.d);
    }
  }

  // 잎 — 어두운 것부터 깔고 밝은 것을 위에 얹는다
  for (const b of blobs) {
    ellipse(c, cx + b.dx, h * b.y, b.rx, b.ry, PALETTE.k);
  }
  for (const b of blobs) {
    ellipse(c, cx + b.dx, h * b.y - b.ry * 0.22, b.rx * 0.86, b.ry * 0.8, PALETTE.l);
  }
  for (const b of blobs) {
    ellipse(c, cx + b.dx - b.rx * 0.2, h * b.y - b.ry * 0.42, b.rx * 0.5, b.ry * 0.44, PALETTE.L);
  }

  outline(c, INK);
  return c;
}

const TREE_A = tree({
  w: 64,
  h: 112,
  trunkW: 7,
  blobs: [
    { dx: 0, y: 0.2, rx: 21, ry: 15 },
    { dx: -15, y: 0.34, rx: 17, ry: 12 },
    { dx: 15, y: 0.36, rx: 16, ry: 12 },
    { dx: -4, y: 0.47, rx: 20, ry: 12 },
  ],
});

const TREE_B = tree({
  w: 48,
  h: 88,
  trunkW: 5,
  blobs: [
    { dx: 0, y: 0.22, rx: 15, ry: 12 },
    { dx: -11, y: 0.38, rx: 12, ry: 9 },
    { dx: 11, y: 0.4, rx: 11, ry: 9 },
  ],
});

/* ------------------------------------------------------------------ */
/* 작은 장식                                                           */
/* ------------------------------------------------------------------ */

function bushSprite() {
  const c = canvas(32, 16);
  ellipse(c, 10, 11, 9, 6, PALETTE.k);
  ellipse(c, 22, 11, 9, 6, PALETTE.k);
  ellipse(c, 16, 9, 11, 7, PALETTE.k);
  ellipse(c, 12, 8, 7, 4, PALETTE.l);
  ellipse(c, 21, 9, 6, 4, PALETTE.l);
  ellipse(c, 14, 7, 4, 2, PALETTE.L);
  rect(c, 1, 14, 30, 2, PALETTE.k);
  outline(c, INK);
  return c;
}

const MUSHROOM = fromMap(
  [
    '................',
    '.....RRRRRR.....',
    '...RRRRCRRRRR...',
    '..RRCRRRRRRCRR..',
    '.RRRRRRRRRRRRRR.',
    '.rRRRCRRRRRRRRr.',
    '.rrrrrrrrrrrrrr.',
    '....CCCCCCCC....',
    '.....CCcCCC.....',
    '.....CCcCCC.....',
    '.....CCcCCC.....',
    '.....CCccCC.....',
    '....CCCccCCC....',
    '...cccccccccc...',
    '................',
    '................',
  ],
  PALETTE,
);

function rockSprite() {
  const c = canvas(24, 14);
  ellipse(c, 12, 11, 11, 7, PALETTE.t);
  ellipse(c, 11, 9, 9, 5, PALETTE.s);
  ellipse(c, 9, 7, 5, 3, PALETTE.S);
  rect(c, 1, 12, 22, 2, PALETTE.t);
  outline(c, INK);
  return c;
}

/*
 * 정상 표지판. 글자는 읽히지 않아도 되니 어두운 점으로 '적혀 있다' 는 느낌만 낸다.
 * 기둥이 짧으면 판이 공중에 떠 보여서, 판보다 기둥을 길게 잡았다.
 */
const SIGN = fromMap(
  [
    '........................',
    '..WWWWWWWWWWWWWWWWWWWW..',
    '..WxxxxWWxxxWWxxxxxxWW..',
    '..WWWWWWWWWWWWWWWWWWWW..',
    '..WxxWWxxxxWWxxWWxxxxW..',
    '..WWWWWWWWWWWWWWWWWWWW..',
    '..wwwwwwwwwwwwwwwwwwww..',
    '..dddddddddddddddddddd..',
    '..........Ww............',
    '..........Ww............',
    '..........Ww............',
    '..........Ww............',
    '..........Ww............',
    '..........Ww............',
    '..........Ww............',
    '..........Ww............',
    '..........Ww............',
    '..........Ww............',
    '..........Ww............',
    '.........WWww...........',
    '.........dddd...........',
    '........dddddd..........',
  ],
  PALETTE,
);

/* ------------------------------------------------------------------ */
/* 방해물 (숲 깊은 곳) — 닿으면 튕겨 나간다                              */
/* ------------------------------------------------------------------ */

/*
 * 벌. 좌우/위아래로 왕복하며 길을 막는다.
 * 원본은 '왼쪽' 을 보게 그렸다 — 미니미와 같은 규칙이라 뒤집기 코드를 공유한다.
 */
const HAZARD_BEE = fromMap(
  [
    '................',
    '.....VV..VV.....',
    '....VVVVVVVV....',
    '.....VVVVVV.....',
    '......nnnn......',
    '....nnYYYYnn....',
    '...nYYnnnnYYn...',
    '..nYYYYYYYYYYn..',
    '..nnnnYYYYnnnn..',
    '..nYYYYYYYYYYn..',
    '..nnnnnYYnnnnn..',
    '...nYYYYYYYYn...',
    '....nnYYYYnn....',
    '......nnnn......',
    '.......nn.......',
    '................',
  ],
  PALETTE,
);

/** 가시덩굴 열매. 제자리에서 오르내리거나 좌우로 굴러다닌다. */
const HAZARD_SPIKE = fromMap(
  [
    '.......ii.......',
    '...i...ii...i...',
    '....i..ii..i....',
    '.....ijjjji.....',
    '....ijjKKjji....',
    '..iijjKKKKjjii..',
    'iiijjKKKKKKjjiii',
    'iiijjKKKKKKjjiii',
    '..iijjKKKKjjii..',
    '....ijjKKjji....',
    '.....ijjjji.....',
    '....i..ii..i....',
    '...i...ii...i...',
    '.......ii.......',
    '................',
    '................',
  ],
  PALETTE,
);

/* ------------------------------------------------------------------ */
/* 기록 팻말 — 광장의 숲 입구 옆에 세워 상위 기록을 새긴다               */
/* ------------------------------------------------------------------ */

/*
 * 글자는 굽지 않는다 — 기록이 바뀌면 그림도 다시 만들어야 하기 때문이다.
 * 여기서는 '판' 만 그리고 글자는 화면에서 위에 얹는다.
 * 그래서 안쪽 패널을 어둡게 비워 두고, 그 자리 비율을 CSS 가 맞춘다.
 */
function recordBoard() {
  const c = canvas(72, 56);

  // 기둥 둘
  rect(c, 14, 36, 5, 20, PALETTE.d);
  rect(c, 14, 36, 2, 20, PALETTE.w);
  rect(c, 53, 36, 5, 20, PALETTE.d);
  rect(c, 53, 36, 2, 20, PALETTE.w);

  // 판 — 바깥 테두리(밝은 나무) → 안쪽 패널(어둡게 비움)
  rect(c, 1, 2, 70, 38, PALETTE.w);
  rect(c, 1, 2, 70, 2, PALETTE.W);
  rect(c, 1, 38, 70, 2, PALETTE.d);
  rect(c, 4, 5, 64, 32, PALETTE.b);

  // 판 위 작은 지붕 (비를 막는 것처럼 — 팻말답게)
  rect(c, 3, 0, 66, 2, PALETTE.W);
  rect(c, 6, 0, 60, 1, PALETTE.M);

  // 못
  for (const [x, y] of [[3, 4], [68, 4], [3, 37], [68, 37]]) set(c, x, y, PALETTE.S);

  outline(c, INK);
  return c;
}

/* ------------------------------------------------------------------ */
/* 문(포탈) — 돌 아치 + 안쪽 빛                                         */
/* ------------------------------------------------------------------ */

function portalSprite() {
  const c = canvas(40, 56);

  // 돌 아치 (바깥 → 안쪽으로 밝기 단계)
  ellipse(c, 20, 22, 18, 20, PALETTE.t);
  rect(c, 2, 22, 36, 32, PALETTE.t);
  ellipse(c, 20, 22, 16, 18, PALETTE.s);
  rect(c, 4, 22, 32, 30, PALETTE.s);

  // 안쪽 빛 — 아래로 갈수록 어두워지는 세 단계
  ellipse(c, 20, 24, 12, 15, PALETTE.h);
  rect(c, 8, 24, 24, 26, PALETTE.h);
  ellipse(c, 20, 25, 9, 12, PALETTE.g);
  rect(c, 11, 25, 18, 24, PALETTE.g);
  ellipse(c, 19, 24, 5, 8, PALETTE.G);

  // 반짝임
  for (const [x, y] of [
    [15, 16], [24, 20], [18, 33], [26, 39], [13, 28], [22, 45],
  ]) {
    set(c, x, y, PALETTE.G);
  }

  // 바닥 돌
  rect(c, 1, 50, 38, 4, PALETTE.t);
  rect(c, 3, 50, 34, 2, PALETTE.S);

  outline(c, INK);
  return c;
}

/* ------------------------------------------------------------------ */

console.log('인내의 숲 스프라이트 생성:');
await save(portalSprite(), plazaDir, 'portal');
await save(PLATFORM_TILE, forestDir, 'platform');
await save(PLATFORM_CAP, forestDir, 'platform-cap');
await save(TREE_A, forestDir, 'tree-a');
await save(TREE_B, forestDir, 'tree-b');
await save(bushSprite(), forestDir, 'bush');
await save(MUSHROOM, forestDir, 'mushroom');
await save(rockSprite(), forestDir, 'rock');
await save(SIGN, forestDir, 'sign');
await save(HAZARD_BEE, forestDir, 'hazard-bee');
await save(HAZARD_SPIKE, forestDir, 'hazard-spike');
await save(recordBoard(), plazaDir, 'record-board');
console.log('완료 — public/resources/images/plaza/');
