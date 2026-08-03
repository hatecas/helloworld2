/**
 * 미니미를 화면에 '같은 크기로' 그리기 위한 보정.
 *
 * 미니미 100종은 전부 320x240 캔버스지만 그 안 캐릭터의 크기·위치가 제각각이다
 * (실측 96~240px, 발 밑 여백 0~67px). 그대로 같은 폭으로 그리면 누구는 거인,
 * 누구는 콩알이고 어떤 미니미는 땅에서 떠 보인다. 인내의 숲(점프 퀘스트)에서는
 * 이게 밸런스 문제까지 된다.
 *
 * 원본 GIF 는 건드리지 않는다 — 상점·미니룸·프로필이 같은 파일을 쓰기 때문이다.
 * 대신 여기서 화면에 그릴 때만 크기와 위치를 맞춘다.
 *
 * transform 이 아니라 '폭 + 음수 마진'으로 맞추는 이유:
 *   transform 은 레이아웃을 바꾸지 않아서, 그림만 작아지고 이름표는 원래 자리에
 *   남는다(머리 위로 한참 떠 버린다). 폭과 마진으로 맞추면 투명 여백이 레이아웃에서
 *   실제로 사라져, 이름표는 머리 바로 위 · 그림자는 발밑에 붙는다.
 *
 * 측정값은 lib/minimi/sizes.generated.ts (npm run minimi:sizes) 에서 온다.
 */

import { MINIMI_FIT, type MinimiFit } from './sizes.generated';

/** 원본 캔버스 비율 (320x240) — 세로 마진을 폭 기준 %로 환산할 때 쓴다 */
const CANVAS_RATIO = 240 / 320;

/** 측정값이 없는 그림(새로 추가하고 아직 안 재본 것)은 손대지 않는다 */
const IDENTITY: MinimiFit = { scale: 1, w: 1, b: 0, t: 0, cx: 0 };

/** '/resources/images/minimi/greymonIcon.gif' → 'greymonIcon.gif' */
function fileOf(src: string): string {
  const cut = src.lastIndexOf('/');
  return cut < 0 ? src : src.slice(cut + 1);
}

export function fitOf(src: string): MinimiFit {
  return MINIMI_FIT[fileOf(src)] ?? IDENTITY;
}

/**
 * 엎드릴 때 눌러 주는 비율.
 *
 * '납작하게 엎드린' 그림(도트 미니미의 Sleep)이 있으면 그걸 쓰고, 없는 미니미
 * (메이플 몹들)는 이 값만큼 세로로 눌러 엎드린 것처럼 보이게 한다.
 */
export const CROUCH_SQUASH = 0.6;

/**
 * 미니미 그림에 보정을 입힌다.
 *
 * CSS 마진 %는 (세로든 가로든) 담는 상자의 '폭' 기준이라, 세로 값은 캔버스
 * 비율을 곱해 환산한다. 담는 상자 = 액터 칸이고 그림 폭은 그 칸의 scale 배다.
 *
 * squash 는 세로로 누르는 비율(엎드리기). 누르면 머리가 내려오므로 위 마진도
 * 그만큼 다시 잡아야 이름표가 따라 내려온다.
 */
export function applyMinimiFit(img: HTMLImageElement, src: string, squash = 1): void {
  const fit = fitOf(src);
  const vertical = fit.scale * CANVAS_RATIO * 100;

  /*
   * transform-origin 이 발밑(50% 100%)이라, 세로로 k 배 누르면 그림 안의 모든 거리가
   * 아래쪽 끝을 기준으로 k 배가 된다. 그래서 걷어낼 여백도 같이 k 배다.
   *   아래로 끌어내릴 양 = b · k          (발을 바닥에 붙인다)
   *   위로 끌어올릴 양   = 1 − k(1 − t)   (이름표를 머리에 붙인다)
   * k = 1 이면 각각 b, t 라서 안 눌렀을 때와 같다.
   */
  const pullDown = fit.b * squash;
  const pullUp = 1 - squash * (1 - fit.t);

  img.style.width = `${fit.scale * 100}%`;
  img.style.marginBottom = `${-(pullDown * vertical)}%`;
  img.style.marginTop = `${-(pullUp * vertical)}%`;
}

/** 좌우 반전 + 가로 치우침 보정 (+ 엎드리기 눌림) 을 합친 transform */
export function minimiTransform(src: string, facing: 'left' | 'right', squash = 1): string {
  const fit = fitOf(src);
  /*
   * 미니미 원본은 '왼쪽' 을 보고 있어서 오른쪽으로 갈 때 뒤집는다.
   * 뒤집으면 가로 치우침도 같이 뒤집히므로 보정 방향도 따라 바뀐다.
   */
  const flip = facing === 'right' ? -1 : 1;
  const shift = -fit.cx * fit.scale * flip * 100;
  // transform-origin 이 발밑(50% 100%)이라 눌러도 발은 그 자리에 있다
  return `translateX(${shift}%) scale(${flip}, ${squash})`;
}

/** 캐릭터 폭에 맞춘 발밑 그림자 폭(%) — 콩알 미니미에 커다란 그림자가 깔리지 않게 */
export function shadowWidth(src: string): number {
  const fit = fitOf(src);
  return Math.max(14, Math.min(70, fit.w * fit.scale * 88));
}
