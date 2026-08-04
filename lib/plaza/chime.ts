'use client';

/**
 * 채팅 알림음 "띠링".
 *
 * mp3 를 하나 더 얹지 않고 WebAudio 로 두 음(솔↗도)을 짧게 합성한다.
 * 파일이 없으니 로딩도 없고 용량도 늘지 않는다.
 *
 * 브라우저 자동재생 정책상 사용자가 한 번이라도 페이지를 건드리기 전에는
 * 소리가 나지 않는다. 광장은 키보드/클릭으로 조작하는 화면이라 자연히 해결된다.
 */

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  // 사용자 조작 전에는 suspended 로 시작한다
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** 짧은 정현파 한 음 */
function tone(ac: AudioContext, freq: number, startAt: number, dur: number, peak: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startAt);

  // 딸깍 소리가 나지 않게 아주 짧게 올렸다가 부드럽게 내린다
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);

  osc.connect(gain).connect(ac.destination);
  osc.start(startAt);
  osc.stop(startAt + dur + 0.02);
}

/** 띠링 — 다른 사람의 채팅이 도착했을 때 */
export function playChime(): void {
  try {
    const ac = audioContext();
    if (!ac) return;
    const now = ac.currentTime;
    tone(ac, 988, now, 0.16, 0.16); // 시
    tone(ac, 1319, now + 0.09, 0.22, 0.13); // 미 (한 옥타브 위)
  } catch {
    // 소리는 부가 기능이라 실패해도 조용히 넘어간다
  }
}

/**
 * 딩-동-딩 — 관리자 공지가 뜰 때.
 *
 * 채팅음(두 음)보다 한 음 더 길게 올라가는 세 음이라, 소리만으로 '공지가 떴다' 를
 * 채팅·부딪힘과 확실히 구분한다. 주목을 끌어야 하므로 조금 더 크고 길게 낸다.
 */
export function playNotice(): void {
  try {
    const ac = audioContext();
    if (!ac) return;
    const now = ac.currentTime;
    tone(ac, 784, now, 0.2, 0.22); // 솔
    tone(ac, 1047, now + 0.12, 0.24, 0.2); // 도 (위)
    tone(ac, 1319, now + 0.26, 0.34, 0.18); // 미 (위)
  } catch {
    // 소리는 부가 기능이라 실패해도 조용히 넘어간다
  }
}

/**
 * 툭 — 인내의 숲에서 방해물에 부딪혀 튕겨 나갈 때.
 *
 * 채팅음(올라가는 두 음)과 반대로 낮은 데서 더 낮게 떨어뜨린다.
 * 소리만 듣고도 '채팅이 왔다' 와 '맞았다' 가 구별돼야 한다.
 */
export function playBump(): void {
  try {
    const ac = audioContext();
    if (!ac) return;
    const now = ac.currentTime;
    tone(ac, 220, now, 0.14, 0.2); // 라 (낮은)
    tone(ac, 147, now + 0.06, 0.2, 0.16); // 레 (더 낮은)
  } catch {
    // 소리는 부가 기능이라 실패해도 조용히 넘어간다
  }
}
