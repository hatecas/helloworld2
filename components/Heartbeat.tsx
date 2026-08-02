'use client';

import { useEffect } from 'react';

/** 신호 주기 — 서버의 ONLINE_WINDOW_MINUTES(5분)보다 충분히 짧아야 한다 */
const HEARTBEAT_MS = 2 * 60 * 1000;

/**
 * 로그인한 탭이 살아있다는 신호를 주기적으로 보낸다.
 *
 * 이게 없으면 '일촌 ON' 이 로그아웃 버튼에만 의존하게 되어,
 * 브라우저를 닫거나 PC 를 꺼 버린 사람이 며칠씩 접속중으로 남는다.
 *
 * 탭이 화면에 보이지 않는 동안에는 보내지 않는다. 다른 일을 하는 중에는
 * 접속중으로 치지 않는 편이 'ON' 표시의 뜻에 맞고, 방치된 세션이
 * 무한정 연장되는 것도 막아 준다. 다시 보이는 순간 바로 한 번 보낸다.
 */
export default function Heartbeat() {
  useEffect(() => {
    let stopped = false;

    const beat = () => {
      if (stopped || document.visibilityState !== 'visible') return;
      void fetch('/api/heartbeat', { method: 'POST', cache: 'no-store' }).then(
        (res) => {
          // 세션이 만료됐으면 더 두드려도 소용없다
          if (res.status === 401) stopped = true;
        },
        () => undefined,
      );
    };

    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', beat);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', beat);
    };
  }, []);

  return null;
}
