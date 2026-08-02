/**
 * GIF89a 읽기/쓰기 — 외부 라이브러리 없이.
 *
 * 미니미 에셋을 만들 때 두 방향이 다 필요하다.
 *  - 쓰기: 스프라이트 시트(PNG)에서 뽑은 프레임을 애니메이션 GIF 로 (sheet-to-gif.mjs)
 *  - 읽기: 이미 GIF 로 배포되는 도트 스프라이트를 미니미 규격에 다시 얹으려고 (gif-to-minimi.mjs)
 *
 * 읽기는 쓰기를 검증하는 용도로도 쓴다. 인코더가 뱉은 걸 다른 코드로 다시 풀어 봐야
 * 코드 길이가 어긋나는 LZW 버그 같은 게 걸린다.
 */

import fs from 'node:fs';

/* ------------------------------------------------------------------ 읽기 */

/** GIF 가변 길이 LZW 풀기 */
function lzwDecode(data, minCode, pixelCount) {
  const clear = 1 << minCode;
  const eoi = clear + 1;
  const prefix = new Int32Array(4096);
  const suffix = new Uint8Array(4096);
  const stack = new Uint8Array(4097);
  for (let i = 0; i < clear; i++) { prefix[i] = 0; suffix[i] = i; }

  const dst = new Uint8Array(pixelCount);
  let codeSize = minCode + 1;
  let codeMask = (1 << codeSize) - 1;
  let available = eoi + 1;
  let old = -1;
  let bits = 0;
  let datum = 0;
  let ptr = 0;
  let top = 0;
  let pi = 0;
  let first = 0;
  let done = false;

  while (pi < pixelCount && !done) {
    if (top === 0) {
      while (bits < codeSize) {
        if (ptr >= data.length) { done = true; break; }
        datum |= data[ptr++] << bits;
        bits += 8;
      }
      if (done) break;
      let code = datum & codeMask;
      datum >>= codeSize;
      bits -= codeSize;
      if (code === eoi) break;
      if (code === clear) {
        codeSize = minCode + 1;
        codeMask = (1 << codeSize) - 1;
        available = eoi + 1;
        old = -1;
        continue;
      }
      if (old === -1) {
        stack[top++] = suffix[code];
        old = code;
        first = code;
      } else {
        const inCode = code;
        if (code >= available) { stack[top++] = first; code = old; }
        while (code >= clear) { stack[top++] = suffix[code]; code = prefix[code]; }
        first = suffix[code];
        stack[top++] = first;
        if (available < 4096) {
          prefix[available] = old;
          suffix[available] = first;
          available++;
          if ((available & codeMask) === 0 && available < 4096) { codeSize++; codeMask += available; }
        }
        old = inCode;
      }
    }
    top--;
    dst[pi++] = stack[top];
  }
  return dst;
}

/**
 * GIF 를 읽어 프레임마다 '완성된 화면' RGBA 를 돌려준다.
 *
 * GIF 는 프레임이 화면 일부만 덮고 앞 프레임 위에 얹히는 형식이라, 그대로 쓰면
 * 조각만 나온다. 폐기 방법(disposal)까지 반영해 매 프레임 화면 전체를 만들어 준다.
 */
export function readGif(file) {
  const b = fs.readFileSync(file);
  const sig = b.toString('ascii', 0, 6);
  if (sig !== 'GIF89a' && sig !== 'GIF87a') throw new Error(`${file}: GIF 이 아님 (${sig})`);

  const width = b.readUInt16LE(6);
  const height = b.readUInt16LE(8);
  let p = 10;
  const packed = b[p];
  p += 3; // packed, 배경색, 종횡비
  let gct = null;
  if (packed & 0x80) {
    const n = 1 << ((packed & 7) + 1);
    gct = b.subarray(p, p + 3 * n);
    p += 3 * n;
  }

  let transparent = -1;
  let delay = 0;
  let disposal = 0;
  let loops = null;

  const frames = [];
  // 화면. 처음엔 전부 투명.
  let screen = Buffer.alloc(width * height * 4);

  while (p < b.length) {
    const kind = b[p];

    if (kind === 0x21) {
      const labelByte = b[p + 1];
      p += 2;
      if (labelByte === 0xf9) {
        const d = b.subarray(p + 1, p + 1 + b[p]);
        disposal = (d[0] >> 2) & 7;
        transparent = d[0] & 1 ? d[3] : -1;
        delay = d.readUInt16LE(1);
      } else if (labelByte === 0xff) {
        const d = b.subarray(p + 1, p + 1 + b[p]);
        if (d.toString('ascii', 0, 11) === 'NETSCAPE2.0') loops = b.readUInt16LE(p + b[p] + 3);
      }
      while (b[p]) p += b[p] + 1;
      p++;
      continue;
    }

    if (kind === 0x2c) {
      const left = b.readUInt16LE(p + 1);
      const top = b.readUInt16LE(p + 3);
      const w = b.readUInt16LE(p + 5);
      const h = b.readUInt16LE(p + 7);
      const lp = b[p + 9];
      p += 10;
      let ct = gct;
      if (lp & 0x80) {
        const n = 1 << ((lp & 7) + 1);
        ct = b.subarray(p, p + 3 * n);
        p += 3 * n;
      }
      const interlaced = (lp & 0x40) !== 0;
      const minCode = b[p];
      p++;
      const chunks = [];
      while (b[p]) { chunks.push(b.subarray(p + 1, p + 1 + b[p])); p += b[p] + 1; }
      p++;

      const idx = lzwDecode(Buffer.concat(chunks), minCode, w * h);
      if (!ct) throw new Error(`${file}: 팔레트가 없다`);

      // 폐기 방법 3(이전 화면으로 되돌림) 대비
      const before = disposal === 3 ? Buffer.from(screen) : null;

      // 인터레이스면 줄 순서가 섞여 있다
      const rowOf = (y) => {
        if (!interlaced) return y;
        const q1 = Math.ceil(h / 8);
        const q2 = q1 + Math.ceil((h - 4) / 8);
        const q3 = q2 + Math.ceil((h - 2) / 4);
        if (y < q1) return y * 8;
        if (y < q2) return (y - q1) * 8 + 4;
        if (y < q3) return (y - q2) * 4 + 2;
        return (y - q3) * 2 + 1;
      };

      for (let y = 0; y < h; y++) {
        const dy = top + rowOf(y);
        if (dy < 0 || dy >= height) continue;
        for (let x = 0; x < w; x++) {
          const dx = left + x;
          if (dx < 0 || dx >= width) continue;
          const v = idx[y * w + x];
          if (v === transparent) continue; // 투명 픽셀은 아래 화면을 그대로 둔다
          const o = (dy * width + dx) * 4;
          screen[o] = ct[v * 3];
          screen[o + 1] = ct[v * 3 + 1];
          screen[o + 2] = ct[v * 3 + 2];
          screen[o + 3] = 255;
        }
      }

      frames.push({ rgba: Buffer.from(screen), delay, disposal });

      if (disposal === 2) {
        // 이 프레임이 덮은 자리를 다시 투명으로
        for (let y = 0; y < h; y++) {
          const dy = top + y;
          if (dy < 0 || dy >= height) continue;
          for (let x = 0; x < w; x++) {
            const dx = left + x;
            if (dx < 0 || dx >= width) continue;
            screen.fill(0, (dy * width + dx) * 4, (dy * width + dx) * 4 + 4);
          }
        }
      } else if (disposal === 3 && before) {
        screen = before;
      }
      continue;
    }

    if (kind === 0x3b) break; // 끝
    throw new Error(`${file}: 알 수 없는 블록 0x${kind.toString(16)} (offset ${p})`);
  }

  return { width, height, frames, loops };
}

/** 불투명 픽셀의 경계 상자. 없으면 null */
export function opaqueBounds(rgba, width, height, threshold = 8) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] < threshold) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/* ------------------------------------------------------------------ 쓰기 */

/**
 * GIF 가변 길이 LZW.
 * 코드 길이를 늘리는 시점이 디코더와 어긋나면 그림 전체가 깨지므로 순서가 중요하다.
 */
function lzwEncode(pixels, minCodeSize) {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  let codeSize = minCodeSize + 1;
  let next = eoi + 1;
  let table = new Map();

  const out = [];
  let acc = 0;
  let accBits = 0;
  const emit = (code) => {
    acc |= code << accBits;
    accBits += codeSize;
    while (accBits >= 8) { out.push(acc & 0xff); acc >>= 8; accBits -= 8; }
  };

  emit(clear);
  let prefix = pixels[0];
  for (let i = 1; i < pixels.length; i++) {
    const k = pixels[i];
    const key = prefix * 256 + k;
    const found = table.get(key);
    if (found !== undefined) { prefix = found; continue; }
    emit(prefix);
    if (next === 4096) {
      emit(clear); // 반드시 늘어난 코드 길이 그대로 내보낸 뒤에 초기화한다
      table = new Map();
      next = eoi + 1;
      codeSize = minCodeSize + 1;
    } else {
      if (next >= 1 << codeSize) codeSize++;
      table.set(key, next++);
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoi);
  if (accBits > 0) out.push(acc & 0xff);
  return Buffer.from(out);
}

/** 255 바이트짜리 서브블록으로 쪼개고 0 으로 끝낸다 */
function subBlocks(buf) {
  const parts = [];
  for (let i = 0; i < buf.length; i += 255) {
    const chunk = buf.subarray(i, i + 255);
    parts.push(Buffer.from([chunk.length]), chunk);
  }
  parts.push(Buffer.from([0]));
  return Buffer.concat(parts);
}

/**
 * 여러 장의 RGBA 를 하나의 팔레트로 모은다. 0번은 투명으로 예약.
 * 도트 그림은 색이 몇 개 안 돼서 색 감축이 필요 없다 — 넘치면 에러로 알린다.
 */
export function quantize(frames, width, height) {
  const seen = new Map();
  const palette = [[0, 0, 0]];
  const indexed = frames.map((rgba) => {
    const idx = Buffer.alloc(width * height);
    for (let i = 0, p = 0; p < idx.length; i += 4, p++) {
      if (rgba[i + 3] < 128) { idx[p] = 0; continue; }
      const key = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
      let at = seen.get(key);
      if (at === undefined) {
        at = palette.length;
        if (at > 255) throw new Error('색이 256개를 넘는다 — 도트 그림이 맞는지 확인');
        palette.push([rgba[i], rgba[i + 1], rgba[i + 2]]);
        seen.set(key, at);
      }
      idx[p] = at;
    }
    return idx;
  });
  return { palette, indexed };
}

/**
 * 애니메이션 GIF 로 묶는다. 투명은 항상 0번.
 * @param delays 프레임별 지속(1/100초). 숫자 하나면 전부 같은 값.
 */
export function writeGif(width, height, frames, delays) {
  const { palette, indexed } = quantize(frames, width, height);
  const bits = Math.max(2, Math.ceil(Math.log2(Math.max(2, palette.length))));
  const perFrame = Array.isArray(delays) ? delays : indexed.map(() => delays);
  const parts = [];

  const header = Buffer.alloc(13);
  header.write('GIF89a', 0, 'ascii');
  header.writeUInt16LE(width, 6);
  header.writeUInt16LE(height, 8);
  header[10] = 0x80 | ((bits - 1) << 4) | (bits - 1); // 전역 팔레트 있음
  header[11] = 0; // 배경 = 투명
  header[12] = 0;
  parts.push(header);

  const gct = Buffer.alloc((1 << bits) * 3);
  palette.forEach((c, i) => { gct[i * 3] = c[0]; gct[i * 3 + 1] = c[1]; gct[i * 3 + 2] = c[2]; });
  parts.push(gct);

  // 무한 반복
  parts.push(Buffer.concat([
    Buffer.from([0x21, 0xff, 0x0b]),
    Buffer.from('NETSCAPE2.0', 'ascii'),
    Buffer.from([0x03, 0x01, 0x00, 0x00, 0x00]),
  ]));

  indexed.forEach((idx, n) => {
    const gce = Buffer.alloc(8);
    gce[0] = 0x21; gce[1] = 0xf9; gce[2] = 0x04;
    gce[3] = (2 << 2) | 1; // 폐기 방법 2(배경으로 되돌림) + 투명색 사용
    gce.writeUInt16LE(Math.max(2, perFrame[n] | 0), 4);
    gce[6] = 0; // 투명 색 번호
    gce[7] = 0;
    parts.push(gce);

    const desc = Buffer.alloc(10);
    desc[0] = 0x2c;
    desc.writeUInt16LE(0, 1); desc.writeUInt16LE(0, 3);
    desc.writeUInt16LE(width, 5); desc.writeUInt16LE(height, 7);
    desc[9] = 0;
    parts.push(desc);

    parts.push(Buffer.from([bits]));
    parts.push(subBlocks(lzwEncode(idx, bits)));
  });

  parts.push(Buffer.from([0x3b]));
  return { gif: Buffer.concat(parts), colors: palette.length };
}
