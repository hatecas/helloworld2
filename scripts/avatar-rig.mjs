/**
 * 아바타 규격 — base.png 에서 실측한 값이 원본이다.
 *
 * 검사 스크립트와 가이드 생성 스크립트가 같은 숫자를 보도록 여기 한 곳에 둔다.
 * base 를 다시 만들면 `node scripts/measure-avatar-base.mjs` 로 다시 재서 갱신할 것.
 */
import fs from 'node:fs';
import zlib from 'node:zlib';

/** base.png 실측 캔버스 */
export const CANVAS = { w: 1024, h: 1536 };

/** base.png 안에서 캐릭터가 실제로 그려진 영역 (렌더할 때 이 부분만 꽉 채워 보여 준다) */
export const CONTENT = { x: 301, y: 394, w: 422, h: 631 };

/** 몸 기준선 (base 실측) */
export const RIG_LINES = {
  headTop: { y: 394, label: '머리 끝' },
  eyeTop: { y: 570, label: '눈 라인 위' },
  eyeBottom: { y: 630, label: '눈 라인 아래' },
  nose: { y: 650, label: '코' },
  mouth: { y: 688, label: '입' },
  neck: { y: 741, label: '목' },
  shoulder: { y: 793, label: '어깨' },
  waist: { y: 900, label: '허리' },
  feet: { y: 1024, label: '발바닥' },
};

/**
 * 부위별로 불투명 픽셀이 들어가야 하는 세로 구간.
 * 위 기준선에서 뽑았고 여유를 조금 둔다.
 */
export const RIG = {
  base: { top: 394, bottom: 1024, label: '머리끝~발바닥' },
  eyes: { top: 555, bottom: 645, label: '눈 라인' },
  hair: { top: 330, bottom: 800, label: '정수리~어깨' },
  headwear: { top: 300, bottom: 620, label: '머리 위' },
  acc: { top: 545, bottom: 660, label: '얼굴 중단' },
  top: { top: 760, bottom: 950, label: '어깨~허리' },
  bottom: { top: 870, bottom: 1030, label: '허리~발목' },
  shoes: { top: 970, bottom: 1030, label: '발' },
};

/** 검사 여유 (px) */
export const TOL = 40;

/* ------------------------------------------------------------------ */
/* PNG 읽기 (8bit RGBA 만)                                             */
/* ------------------------------------------------------------------ */

/**
 * PNG 읽기 → 항상 8bit RGBA 로 펴서 돌려준다.
 *
 * 그림 도구마다 내보내는 형식이 달라서(팔레트/RGB/회색) 한 가지만 받으면
 * "읽기 실패" 로 막힌다. 흔한 형식은 전부 받아서 RGBA 로 변환한다.
 * 알파가 없는 형식(RGB/회색)은 불투명으로 채우고 hadAlpha=false 로 알려 준다.
 */
export function readPng(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('PNG 이 아님');

  let pos = 8;
  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette = null;
  let transparency = null;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'PLTE') palette = Buffer.from(data);
    else if (type === 'tRNS') transparency = Buffer.from(data);
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }

  const NAMES = { 0: '회색', 2: 'RGB', 3: '팔레트', 4: '회색+알파', 6: 'RGBA' };
  if (depth !== 8 || interlace !== 0 || ![0, 2, 3, 4, 6].includes(colorType)) {
    return {
      width, height, alpha: null, hadAlpha: false,
      note: `지원 안 하는 형식 (depth=${depth}, colorType=${colorType}, interlace=${interlace})`,
    };
  }

  const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const bpp = CHANNELS[colorType];
  const stride = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const flat = Buffer.alloc(height * stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const prev = y > 0 ? flat.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    const cur = flat.subarray(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 0xff;
    }
  }

  // 어떤 형식이든 RGBA 로 편다
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0, o = 0; o < out.length; i += bpp, o += 4) {
    if (colorType === 6) {
      out[o] = flat[i]; out[o + 1] = flat[i + 1]; out[o + 2] = flat[i + 2]; out[o + 3] = flat[i + 3];
    } else if (colorType === 2) {
      out[o] = flat[i]; out[o + 1] = flat[i + 1]; out[o + 2] = flat[i + 2]; out[o + 3] = 255;
    } else if (colorType === 0) {
      out[o] = out[o + 1] = out[o + 2] = flat[i]; out[o + 3] = 255;
    } else if (colorType === 4) {
      out[o] = out[o + 1] = out[o + 2] = flat[i]; out[o + 3] = flat[i + 1];
    } else {
      const idx = flat[i];
      out[o] = palette ? palette[idx * 3] : 0;
      out[o + 1] = palette ? palette[idx * 3 + 1] : 0;
      out[o + 2] = palette ? palette[idx * 3 + 2] : 0;
      out[o + 3] = transparency && idx < transparency.length ? transparency[idx] : 255;
    }
  }

  const hadAlpha = colorType === 4 || colorType === 6 || (colorType === 3 && transparency != null);
  return { width, height, alpha: out, hadAlpha, colorType, note: NAMES[colorType] };
}

/** 불투명 픽셀의 경계 상자 */
export function bounds(png, threshold = 8) {
  const { width, height, alpha } = png;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alpha[(y * width + x) * 4 + 3] > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

/* ------------------------------------------------------------------ */
/* PNG 쓰기 (8bit RGBA)                                                */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

export function writePng(file, width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

/** src 를 dst 위에 알파 합성 (같은 크기) */
export function over(dst, src, w, h) {
  for (let i = 0; i < w * h * 4; i += 4) {
    const sa = src[i + 3] / 255;
    if (sa === 0) continue;
    const da = dst[i + 3] / 255;
    const oa = sa + da * (1 - sa);
    for (let k = 0; k < 3; k++) {
      dst[i + k] = Math.round((src[i + k] * sa + dst[i + k] * da * (1 - sa)) / oa);
    }
    dst[i + 3] = Math.round(oa * 255);
  }
}
