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
