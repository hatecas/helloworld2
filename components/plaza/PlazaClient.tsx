'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  BUBBLE_MS,
  CHAT_LOG_MAX,
  CHAT_MAX,
  GRAVITY,
  JUMP_V0,
  MINIMI_W,
  POS_INTERVAL,
  SPEED,
  WALK,
  WORLD_H,
  WORLD_W,
  cleanChat,
  clamp,
  depthScale,
  spawnPoint,
  TAB_CHANNEL,
  type ChatMsg,
  type Facing,
  type PosMsg,
} from '@/lib/plaza/protocol';
import { joinPlaza, type PlazaConnection, type PlazaStatus } from '@/lib/plaza/realtime';
import { linkify } from '@/lib/plaza/linkify';
import { playChime } from '@/lib/plaza/chime';

/** 한 명의 화면상 상태. 좌표는 60fps 로 움직이므로 React state 가 아니라 ref 로 들고 있는다. */
interface Actor {
  id: string;
  nickname: string;
  minimi: string;
  x: number;
  y: number;
  /** 네트워크로 받은 목표 위치 (내 캐릭터는 x,y 와 같다) */
  tx: number;
  ty: number;
  facing: Facing;
  /** 점프로 떠 있는 높이(px). 좌표(y)는 그대로고 보이는 위치만 올라간다. */
  jump: number;
  tjump: number;
  jumpV: number;
  el: HTMLDivElement | null;
  imgEl: HTMLImageElement | null;
  bubbleEl: HTMLDivElement | null;
}

interface Bubble {
  msgId: string;
  actorId: string;
  text: string;
}

interface LogLine {
  msgId: string;
  nickname: string;
  text: string;
  mine: boolean;
}

const KEY_LEFT = new Set(['ArrowLeft', 'a', 'A', 'ㅁ']);
const KEY_RIGHT = new Set(['ArrowRight', 'd', 'D', 'ㅇ']);
const KEY_UP = new Set(['ArrowUp', 'w', 'W', 'ㅈ']);
const KEY_DOWN = new Set(['ArrowDown', 's', 'S', 'ㄴ']);

const SOUND_KEY = 'helloworld_plaza_sound';

export default function PlazaClient({
  nickname,
  minimi,
  supabaseUrl,
  supabaseAnonKey,
}: {
  nickname: string;
  minimi: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}) {
  const [myId] = useState(() => `${nickname}#${Math.random().toString(36).slice(2, 8)}`);

  const actorsRef = useRef<Map<string, Actor>>(new Map());
  const keysRef = useRef<Set<string>>(new Set());
  const connRef = useRef<PlazaConnection | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef(false);
  const soundRef = useRef(true);

  const [ids, setIds] = useState<string[]>([myId]);
  const [, setRev] = useState(0);
  const [status, setStatus] = useState<PlazaStatus>('connecting');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [log, setLog] = useState<LogLine[]>([]);
  const [draft, setDraft] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  /** 같은 계정이 다른 창/기기에서 접속해 이 창이 물러난 상태 */
  const [kicked, setKicked] = useState(false);
  const kickedRef = useRef(false);

  const leaveForOther = useCallback(() => {
    if (kickedRef.current) return;
    kickedRef.current = true;
    setKicked(true);
    keysRef.current.clear();
    connRef.current?.leave();
    connRef.current = null;
  }, []);

  /* ---------------------------------------------------------------- 내 캐릭터 */

  useEffect(() => {
    const start = spawnPoint(myId);
    actorsRef.current.set(myId, {
      id: myId,
      nickname,
      minimi,
      x: start.x,
      y: start.y,
      tx: start.x,
      ty: start.y,
      facing: 'right',
      jump: 0,
      tjump: 0,
      jumpV: 0,
      el: null,
      imgEl: null,
      bubbleEl: null,
    });
    setIds([myId]);
  }, [myId, nickname, minimi]);

  // 소리 켬/끔은 기억해 둔다
  useEffect(() => {
    const saved = localStorage.getItem(SOUND_KEY);
    if (saved === '0') {
      soundRef.current = false;
      setSoundOn(false);
    }
  }, []);

  /*
   * 같은 브라우저의 다른 탭 — 네트워크를 타지 않고 즉시 알 수 있다.
   * 새로 연 창이 'claim' 을 던지면 먼저 있던 창이 물러난다(나중이 이긴다).
   * 죽은 탭이 자리를 영영 막지 않도록 이 방향으로 정했다.
   */
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel(TAB_CHANNEL);
    bc.onmessage = (e: MessageEvent) => {
      const d = e.data as { type?: string; id?: string; nickname?: string } | null;
      if (d?.type === 'claim' && d.nickname === nickname && d.id !== myId) leaveForOther();
    };
    bc.postMessage({ type: 'claim', id: myId, nickname });
    return () => bc.close();
  }, [myId, nickname, leaveForOther]);

  const syncIds = useCallback(() => {
    setIds((prev) => {
      const next = [...actorsRef.current.keys()];
      if (prev.length === next.length && prev.every((id, i) => id === next[i])) return prev;
      return next;
    });
  }, []);

  /* ------------------------------------------------------------- 지난 대화 */

  useEffect(() => {
    let cancelled = false;
    fetch('/api/plaza/chat', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { log?: Array<{ seq: number; nickname: string; text: string }> }) => {
        if (cancelled) return;
        setLog(
          (json.log ?? []).map((l) => ({
            msgId: `h${l.seq}`,
            nickname: l.nickname,
            text: l.text,
            mine: l.nickname === nickname,
          })),
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [nickname]);

  /* ------------------------------------------------------------------- 실시간 */

  const upsertRemote = useCallback(
    (msg: PosMsg) => {
      if (msg.id === myId) return;
      const map = actorsRef.current;
      const found = map.get(msg.id);
      if (found) {
        found.tx = msg.x;
        found.ty = msg.y;
        found.tjump = msg.jump ?? 0;
        found.facing = msg.facing;
        if (found.nickname !== msg.nickname || found.minimi !== msg.minimi) {
          found.nickname = msg.nickname;
          found.minimi = msg.minimi;
          setRev((r) => r + 1);
        }
      } else {
        map.set(msg.id, {
          id: msg.id,
          nickname: msg.nickname,
          minimi: msg.minimi,
          x: msg.x,
          y: msg.y,
          tx: msg.x,
          ty: msg.y,
          facing: msg.facing,
          jump: msg.jump ?? 0,
          tjump: msg.jump ?? 0,
          jumpV: 0,
          el: null,
          imgEl: null,
          bubbleEl: null,
        });
        syncIds();
      }
    },
    [myId, syncIds],
  );

  const pushChat = useCallback((msg: ChatMsg, mine: boolean) => {
    setBubbles((prev) => [
      ...prev.filter((b) => b.actorId !== msg.id),
      { msgId: msg.msgId, actorId: msg.id, text: msg.text },
    ]);
    setLog((prev) =>
      [...prev, { msgId: msg.msgId, nickname: msg.nickname, text: msg.text, mine }].slice(
        -CHAT_LOG_MAX,
      ),
    );
    // 남이 보낸 것만 띠링 (내가 친 글에까지 울리면 시끄럽다)
    if (!mine && soundRef.current) playChime();
    window.setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.msgId !== msg.msgId));
    }, BUBBLE_MS);
  }, []);

  const sendMyPos = useCallback(
    (moving: boolean) => {
      const me = actorsRef.current.get(myId);
      if (!me) return;
      connRef.current?.sendPos({
        id: myId,
        nickname: me.nickname,
        minimi: me.minimi,
        x: Math.round(me.x),
        y: Math.round(me.y),
        facing: me.facing,
        moving,
        jump: Math.round(me.jump),
      });
    },
    [myId],
  );

  useEffect(() => {
    let live = true;
    let conn: PlazaConnection | null = null;

    void joinPlaza(
      supabaseUrl,
      supabaseAnonKey,
      { id: myId, nickname, minimi },
      {
        onStatus: (s) => live && setStatus(s),
        onPos: (msg) => live && upsertRemote(msg),
        onChat: (msg) => live && pushChat(msg, false),
        onHello: () => live && sendMyPos(false),
        // 다른 기기/브라우저에서 같은 계정이 들어왔다
        onClaim: (msg) => {
          if (live && msg.nickname === nickname && msg.id !== myId) leaveForOther();
        },
        onRoster: (roster) => {
          if (!live) return;
          let changed = false;
          for (const id of [...actorsRef.current.keys()]) {
            if (id !== myId && !roster.has(id)) {
              actorsRef.current.delete(id);
              changed = true;
            }
          }
          if (changed) syncIds();
          const missing = [...roster].some((id) => id !== myId && !actorsRef.current.has(id));
          if (missing) connRef.current?.sendHello({ id: myId });
        },
      },
    ).then((c) => {
      if (!live) {
        c.leave();
        return;
      }
      conn = c;
      connRef.current = c;
      // 이 계정의 자리는 이제 이 창이 갖는다 (다른 곳에 열려 있으면 그쪽이 물러난다)
      c.sendClaim({ id: myId, nickname });
      c.sendHello({ id: myId });
      sendMyPos(false);
    });

    return () => {
      live = false;
      conn?.leave();
      connRef.current = null;
    };
  }, [
    supabaseUrl,
    supabaseAnonKey,
    myId,
    nickname,
    minimi,
    upsertRemote,
    pushChat,
    sendMyPos,
    syncIds,
    leaveForOther,
  ]);

  /* --------------------------------------------------------------- 키보드 입력 */

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (kickedRef.current) return;
      /*
       * 입력칸에서 난 키는 여기서 절대 다루지 않는다.
       *
       * 빈 칸에서 Enter 를 누르면 입력칸 핸들러가 blur() 를 부르는데,
       * 그 순간 onBlur 가 typingRef 를 false 로 바꾼다. 그런데 '같은' Enter 이벤트가
       * 계속 window 까지 올라오므로, typingRef 만 보면 이미 false 라서
       * "Enter = 채팅창 열기" 가 곧바로 다시 걸려 포커스가 되돌아왔다.
       * (그래서 빠져나온 것처럼 보이지 않았다)
       * 이벤트가 어디서 났는지로 판단하면 타이밍과 무관하게 정확하다.
       */
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (typingRef.current) return;
      const k = e.key;
      if (KEY_LEFT.has(k) || KEY_RIGHT.has(k) || KEY_UP.has(k) || KEY_DOWN.has(k)) {
        keysRef.current.add(k);
        e.preventDefault();
      } else if (k === 'Alt') {
        // ALT 는 브라우저 메뉴로 포커스가 튀므로 막는다
        e.preventDefault();
        const me = actorsRef.current.get(myId);
        if (me && me.jump === 0) me.jumpV = JUMP_V0;
      } else if (k === 'Enter') {
        chatInputRef.current?.focus();
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    const blur = () => keysRef.current.clear();

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [myId]);

  /* ------------------------------------------------------------ 이동 + 그리기 루프 */

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastSent = 0;
    let wasBusy = false;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (kickedRef.current) {
        raf = requestAnimationFrame(frame);
        return;
      }

      const stageW = stageRef.current?.clientWidth ?? 0;
      const stageH = stageRef.current?.clientHeight ?? 0;
      const me = actorsRef.current.get(myId);

      if (me) {
        const keys = keysRef.current;
        let dx = 0;
        let dy = 0;
        for (const k of keys) {
          if (KEY_LEFT.has(k)) dx -= 1;
          else if (KEY_RIGHT.has(k)) dx += 1;
          else if (KEY_UP.has(k)) dy -= 1;
          else if (KEY_DOWN.has(k)) dy += 1;
        }

        const moving = dx !== 0 || dy !== 0;
        if (moving) {
          const len = Math.hypot(dx, dy) || 1;
          me.x = clamp(me.x + (dx / len) * SPEED * dt, WALK.minX, WALK.maxX);
          me.y = clamp(me.y + (dy / len) * SPEED * dt, WALK.minY, WALK.maxY);
          if (dx !== 0) me.facing = dx < 0 ? 'left' : 'right';
        }

        // 점프 — 화면상 높이만 바뀐다
        if (me.jumpV !== 0 || me.jump > 0) {
          me.jump += me.jumpV * dt;
          me.jumpV -= GRAVITY * dt;
          if (me.jump <= 0) {
            me.jump = 0;
            me.jumpV = 0;
          }
        }
        me.tx = me.x;
        me.ty = me.y;
        me.tjump = me.jump;

        const busy = moving || me.jump > 0;
        if (busy && now - lastSent > POS_INTERVAL) {
          sendMyPos(true);
          lastSent = now;
        } else if (!busy && wasBusy) {
          sendMyPos(false);
          lastSent = now;
        }
        wasBusy = busy;
      }

      const ease = 1 - Math.pow(0.001, dt);
      for (const a of actorsRef.current.values()) {
        if (a.id !== myId) {
          a.x += (a.tx - a.x) * ease;
          a.y += (a.ty - a.y) * ease;
          a.jump += (a.tjump - a.jump) * ease;
        }

        const scale = depthScale(a.y);
        // 점프 높이는 논리 px → 화면 px 로 환산
        const jumpPx = stageH > 0 ? (a.jump / WORLD_H) * stageH : a.jump;

        if (a.el) {
          a.el.style.left = `${(a.x / WORLD_W) * 100}%`;
          a.el.style.top = `${(a.y / WORLD_H) * 100}%`;
          a.el.style.transform = `translate(-50%, -100%) translateY(${-jumpPx}px) scale(${scale})`;
          a.el.style.zIndex = String(Math.round(a.y));
        }
        if (a.imgEl) {
          /*
           * 미니미 원본 스프라이트는 '왼쪽' 을 보고 있다.
           * 그래서 오른쪽으로 갈 때 뒤집어야 한다.
           * (반대로 걸어 놨더니 왼쪽으로 가면 오른쪽을 보는 버그가 있었다)
           */
          const flip = a.facing === 'right' ? 'scaleX(-1)' : 'scaleX(1)';
          if (a.imgEl.style.transform !== flip) a.imgEl.style.transform = flip;
        }

        /*
         * 말풍선이 무대 밖으로 나가 잘리지 않게 안쪽으로 밀어 넣는다.
         * 좌우는 실제 렌더 폭으로 계산하고, 위쪽 여유가 없으면 캐릭터 아래로 뒤집는다.
         */
        if (a.bubbleEl && a.el && stageW > 0) {
          const bw = a.bubbleEl.offsetWidth;
          const bh = a.bubbleEl.offsetHeight;
          const cx = (a.x / WORLD_W) * stageW;
          const half = bw / 2;
          let shift = 0;
          if (cx - half < 6) shift = 6 - (cx - half);
          else if (cx + half > stageW - 6) shift = stageW - 6 - (cx + half);
          a.bubbleEl.style.transform = `translateX(${shift}px)`;

          // 머리 위 여유가 모자라면 말풍선을 캐릭터 아래로 뒤집는다
          const feetPx = (a.y / WORLD_H) * stageH;
          const spritePx = MINIMI_W * 0.75 * scale * (stageW / WORLD_W);
          const headroom = feetPx - spritePx - jumpPx;
          a.el.classList.toggle('is-bubble-below', headroom < bh + 24);
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [myId, sendMyPos]);

  /* --------------------------------------------------------------------- 채팅 */

  const send = () => {
    if (kickedRef.current) return;
    const text = cleanChat(draft);
    if (!text) return;
    const msg: ChatMsg = { id: myId, msgId: `${myId}-${Date.now()}`, nickname, text };
    connRef.current?.sendChat(msg);
    pushChat(msg, true);
    setDraft('');
    // 기록으로 남겨 새로고침·재입장 때도 보이게 (닉네임은 서버가 세션에서 채운다)
    void fetch('/api/plaza/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }).catch(() => undefined);
  };

  const toggleSound = () => {
    const next = !soundRef.current;
    soundRef.current = next;
    setSoundOn(next);
    localStorage.setItem(SOUND_KEY, next ? '1' : '0');
    if (next) playChime();
  };

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  /* --------------------------------------------------------------------- 화면 */

  const bubbleOf = (id: string) => bubbles.find((b) => b.actorId === id);

  // 다른 창/기기에서 같은 계정이 접속하면 이 창은 물러난다 (한 계정 = 한 자리)
  if (kicked) {
    return (
      <div className="pz">
        <div className="pz-head">
          <h1 className="pz-title">광장</h1>
        </div>
        <div className="pz-kicked">
          <div className="pz-kicked-icon" aria-hidden="true">
            🚪
          </div>
          <div className="pz-kicked-title">다른 곳에서 광장에 접속했어요</div>
          <p className="pz-kicked-desc">
            한 계정은 광장에 한 번만 들어갈 수 있습니다.
            <br />
            방금 연 창에서 이어서 놀거나, 여기서 다시 접속할 수 있어요.
          </p>
          <button
            type="button"
            className="pz-kicked-btn"
            onClick={() => window.location.reload()}
          >
            여기서 다시 접속
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pz">
      <div className="pz-head">
        <h1 className="pz-title">광장</h1>
        <span className={`pz-status pz-status--${status}`}>
          {status === 'online'
            ? `${ids.length}명 접속중`
            : status === 'connecting'
              ? '연결 중…'
              : status === 'unconfigured'
                ? '실시간 미설정 (혼자 걷는 중)'
                : '연결 끊김'}
        </span>
        <span className="pz-keyhint">방향키 · WASD 이동 &nbsp;/&nbsp; ALT 점프 &nbsp;/&nbsp; Enter 채팅</span>
      </div>

      {status === 'unconfigured' && (
        <p className="pz-warn">
          실시간 접속이 설정되지 않았습니다. 서버 환경변수에 <code>SUPABASE_ANON_KEY</code> 를
          추가하면 다른 사람들과 같이 보입니다. (지금은 나 혼자 걸어다니는 상태)
        </p>
      )}

      <div className="pz-stage-wrap">
        <div className="pz-stage" ref={stageRef}>
          {/* ---- 배경: 위로도 걸어다닐 수 있게 바닥이 화면 전체를 덮는다 ---- */}
          <div className="pz-ground" />
          <div className="pz-haze" />
          <div className="pz-path pz-path--v" />
          <div className="pz-path pz-path--h" />
          <div className="pz-plaza-ring">
            <div className="pz-plaza-ring-inner" />
          </div>

          <div className="pz-fountain">
            <div className="pz-fountain-basin" />
            <div className="pz-fountain-jet" />
            <div className="pz-fountain-ripple" />
            <div className="pz-fountain-ripple pz-fountain-ripple--2" />
          </div>

          {[
            { c: 'pz-tree--a', l: '7%', t: '30%' },
            { c: 'pz-tree--b', l: '90%', t: '26%' },
            { c: 'pz-tree--c', l: '18%', t: '84%' },
            { c: 'pz-tree--d', l: '82%', t: '88%' },
            { c: 'pz-tree--e', l: '46%', t: '13%' },
          ].map((t) => (
            <div key={t.c} className={`pz-tree ${t.c}`} style={{ left: t.l, top: t.t }}>
              <span className="pz-tree-shadow" />
              <span className="pz-tree-trunk" />
              <span className="pz-tree-crown" />
            </div>
          ))}

          {[
            { l: '26%', t: '52%' },
            { l: '74%', t: '52%' },
          ].map((b) => (
            <div key={b.l} className="pz-bench" style={{ left: b.l, top: b.t }}>
              <span className="pz-bench-shadow" />
              <span className="pz-bench-seat" />
            </div>
          ))}

          {[
            { l: '13%', t: '58%' },
            { l: '87%', t: '58%' },
          ].map((p) => (
            <div key={p.l} className="pz-lamp" style={{ left: p.l, top: p.t }}>
              <span className="pz-lamp-shadow" />
              <span className="pz-lamp-pole" />
              <span className="pz-lamp-head" />
            </div>
          ))}

          {['12%,22%', '31%,74%', '66%,20%', '58%,90%', '88%,70%', '40%,44%'].map((f) => {
            const [l, t] = f.split(',');
            return <span key={f} className="pz-flower" style={{ left: l, top: t }} />;
          })}

          <div className="pz-vignette" />

          {/* ---- 사람들 ---- */}
          {ids.map((id) => {
            const a = actorsRef.current.get(id);
            if (!a) return null;
            const bubble = bubbleOf(id);
            return (
              <div
                key={id}
                className={id === myId ? 'pz-actor pz-actor--me' : 'pz-actor'}
                ref={(el) => {
                  const cur = actorsRef.current.get(id);
                  if (cur) cur.el = el;
                }}
                style={{ width: `${(MINIMI_W / WORLD_W) * 100}%` }}
              >
                {bubble && (
                  <div
                    className="pz-bubble"
                    ref={(el) => {
                      const cur = actorsRef.current.get(id);
                      if (cur) cur.bubbleEl = el;
                    }}
                  >
                    {linkify(bubble.text)}
                  </div>
                )}
                <span className="pz-name">{a.nickname}</span>
                <img
                  className="pz-minimi"
                  src={a.minimi}
                  alt=""
                  draggable={false}
                  ref={(el) => {
                    const cur = actorsRef.current.get(id);
                    if (cur) cur.imgEl = el;
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/resources/images/default/defaultMinimiIcon.gif';
                  }}
                />
                <span className="pz-shadow" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- 채팅 ---- */}
      <div className="pz-chat">
        <div className="pz-log" ref={logRef}>
          {log.length === 0 ? (
            <div className="pz-log-empty">
              방향키(또는 WASD)로 움직이고, Enter 로 채팅해 보세요. ALT 로 점프합니다.
            </div>
          ) : (
            log.map((l) => (
              <div key={l.msgId} className={l.mine ? 'pz-log-line is-mine' : 'pz-log-line'}>
                <b>{l.nickname}</b> {linkify(l.text)}
              </div>
            ))
          )}
        </div>
        <div className="pz-chat-bar">
          <button
            type="button"
            className={soundOn ? 'pz-sound is-on' : 'pz-sound'}
            onClick={toggleSound}
            title={soundOn ? '알림음 끄기' : '알림음 켜기'}
            aria-label={soundOn ? '알림음 끄기' : '알림음 켜기'}
          >
            {soundOn ? '🔔' : '🔕'}
          </button>
          <input
            ref={chatInputRef}
            type="text"
            className="pz-chat-input"
            placeholder="메시지를 입력하세요 (Enter)"
            maxLength={CHAT_MAX}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => {
              typingRef.current = true;
              keysRef.current.clear();
            }}
            onBlur={() => {
              typingRef.current = false;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                // 빈 칸에서 Enter 를 다시 누르면 입력에서 빠져나와 이동(WASD)으로 돌아간다
                if (!draft.trim()) chatInputRef.current?.blur();
                else send();
              } else if (e.key === 'Escape') {
                e.stopPropagation();
                chatInputRef.current?.blur();
              }
            }}
          />
          <button type="button" className="pz-chat-send" onClick={send}>
            보내기
          </button>
        </div>
      </div>
    </div>
  );
}
