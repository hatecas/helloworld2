'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  BUBBLE_MS,
  CHAT_LOG_MAX,
  CHAT_MAX,
  MINIMI_W,
  POS_INTERVAL,
  SPEED,
  WALK,
  WORLD_H,
  WORLD_W,
  cleanChat,
  clamp,
  spawnPoint,
  type ChatMsg,
  type Facing,
  type PosMsg,
} from '@/lib/plaza/protocol';
import { joinPlaza, type PlazaConnection, type PlazaStatus } from '@/lib/plaza/realtime';

/** 한 명의 화면상 상태. 좌표는 60fps 로 움직이므로 React state 가 아니라 ref 로 들고 있는다. */
interface Actor {
  id: string;
  nickname: string;
  minimi: string;
  /** 지금 그려지는 위치 */
  x: number;
  y: number;
  /** 네트워크로 받은 목표 위치 (내 캐릭터는 x,y 와 같다) */
  tx: number;
  ty: number;
  facing: Facing;
  /** 좌표·방향은 60fps 로 바뀌므로 React 재렌더 대신 이 DOM 노드를 직접 만진다 */
  el: HTMLDivElement | null;
  imgEl: HTMLImageElement | null;
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
  // 접속 단위 id — 같은 사람이 두 탭을 열면 각각 따로 선다.
  // (렌더에 쓰이지 않고 네트워크 식별자로만 쓰므로 서버/클라이언트 값이 달라도 무방하다)
  const [myId] = useState(() => `${nickname}#${Math.random().toString(36).slice(2, 8)}`);

  const actorsRef = useRef<Map<string, Actor>>(new Map());
  const keysRef = useRef<Set<string>>(new Set());
  const connRef = useRef<PlazaConnection | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef(false);

  // 화면에 그릴 대상 목록(=DOM 노드 목록). 사람이 들락날락할 때만 바뀐다.
  const [ids, setIds] = useState<string[]>([myId]);
  /** 남의 닉네임·미니미가 바뀌었을 때만 올리는 재렌더 카운터 */
  const [, setRev] = useState(0);
  const [status, setStatus] = useState<PlazaStatus>('connecting');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [log, setLog] = useState<LogLine[]>([]);
  const [draft, setDraft] = useState('');

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
      el: null,
      imgEl: null,
    });
    setIds([myId]);
  }, [myId, nickname, minimi]);

  const syncIds = useCallback(() => {
    setIds((prev) => {
      const next = [...actorsRef.current.keys()];
      if (prev.length === next.length && prev.every((id, i) => id === next[i])) return prev;
      return next;
    });
  }, []);

  /* ------------------------------------------------------------------- 실시간 */

  const upsertRemote = useCallback(
    (msg: PosMsg) => {
      if (msg.id === myId) return;
      const map = actorsRef.current;
      const found = map.get(msg.id);
      if (found) {
        found.tx = msg.x;
        found.ty = msg.y;
        found.facing = msg.facing;
        // 닉네임·미니미는 렌더 결과라 바뀐 경우에만 재렌더를 부른다
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
          // 처음 본 사람은 순간이동처럼 보이지 않게 받은 위치에서 바로 시작
          x: msg.x,
          y: msg.y,
          tx: msg.x,
          ty: msg.y,
          facing: msg.facing,
          el: null,
          imgEl: null,
        });
        syncIds();
      }
    },
    [myId, syncIds],
  );

  const pushChat = useCallback(
    (msg: ChatMsg, mine: boolean) => {
      setBubbles((prev) => [
        ...prev.filter((b) => b.actorId !== msg.id),
        { msgId: msg.msgId, actorId: msg.id, text: msg.text },
      ]);
      setLog((prev) =>
        [...prev, { msgId: msg.msgId, nickname: msg.nickname, text: msg.text, mine }].slice(
          -CHAT_LOG_MAX,
        ),
      );
      window.setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.msgId !== msg.msgId));
      }, BUBBLE_MS);
    },
    [],
  );

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
        // 새로 들어온 사람에게 내 위치를 알려 준다
        onHello: () => live && sendMyPos(false),
        onRoster: (roster) => {
          if (!live) return;

          // presence 에서 빠진 사람은 화면에서도 지운다 (탭 닫음·이탈)
          let changed = false;
          for (const id of [...actorsRef.current.keys()]) {
            if (id !== myId && !roster.has(id)) {
              actorsRef.current.delete(id);
              changed = true;
            }
          }
          if (changed) syncIds();

          /*
           * roster 에는 있는데 좌표를 한 번도 못 받은 사람이 있으면 다시 인사한다.
           * 좌표는 "움직일 때만" 오므로, presence 가 늦게 도착하거나 잠깐 어긋나
           * 가만히 서 있는 사람을 지워 버리면 그 사람이 다시 움직이기 전까지
           * 화면에서 사라진 채로 남는다. hello 를 받으면 다들 현재 좌표를 쏴 준다.
           */
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
      // 나 왔어요 → 이미 있던 사람들이 좌표를 쏴 준다
      c.sendHello({ id: myId });
      sendMyPos(false);
    });

    return () => {
      live = false;
      conn?.leave();
      connRef.current = null;
    };
  }, [supabaseUrl, supabaseAnonKey, myId, nickname, minimi, upsertRemote, pushChat, sendMyPos, syncIds]);

  /* --------------------------------------------------------------- 키보드 입력 */

  useEffect(() => {
    const isTyping = () => typingRef.current;

    const down = (e: KeyboardEvent) => {
      if (isTyping()) return;
      const k = e.key;
      if (KEY_LEFT.has(k) || KEY_RIGHT.has(k) || KEY_UP.has(k) || KEY_DOWN.has(k)) {
        keysRef.current.add(k);
        e.preventDefault(); // 화살표로 페이지가 스크롤되지 않게
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
  }, []);

  /** 모바일 방향 버튼 — 누르고 있는 동안 이동 */
  const holdDir = (key: string, on: boolean) => {
    if (on) keysRef.current.add(key);
    else keysRef.current.delete(key);
  };

  /* ------------------------------------------------------------ 이동 + 그리기 루프 */

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastSent = 0;
    let wasMoving = false;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

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
          // 대각선이 더 빠르지 않게 정규화
          const len = Math.hypot(dx, dy) || 1;
          me.x = clamp(me.x + (dx / len) * SPEED * dt, WALK.minX, WALK.maxX);
          me.y = clamp(me.y + (dy / len) * SPEED * dt, WALK.minY, WALK.maxY);
          if (dx !== 0) me.facing = dx < 0 ? 'left' : 'right';
        }
        me.tx = me.x;
        me.ty = me.y;

        // 움직이는 동안 주기적으로, 멈추는 순간엔 한 번 더 (마지막 위치 보정)
        if (moving && now - lastSent > POS_INTERVAL) {
          sendMyPos(true);
          lastSent = now;
        } else if (!moving && wasMoving) {
          sendMyPos(false);
          lastSent = now;
        }
        wasMoving = moving;
      }

      // 남의 캐릭터는 받은 좌표로 부드럽게 따라간다 (패킷 사이를 메운다)
      const ease = 1 - Math.pow(0.001, dt);
      for (const a of actorsRef.current.values()) {
        if (a.id !== myId) {
          a.x += (a.tx - a.x) * ease;
          a.y += (a.ty - a.y) * ease;
        }
        if (a.el) {
          a.el.style.left = `${(a.x / WORLD_W) * 100}%`;
          a.el.style.top = `${(a.y / WORLD_H) * 100}%`;
          // 아래쪽(=앞쪽)에 있는 사람이 위로 겹쳐 보이게
          a.el.style.zIndex = String(Math.round(a.y));
        }
        // 방향 전환도 여기서 처리한다. 렌더 시점에 걸어 두면 재렌더 전까지 안 바뀐다.
        if (a.imgEl) {
          const flip = a.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)';
          if (a.imgEl.style.transform !== flip) a.imgEl.style.transform = flip;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [myId, sendMyPos]);

  /* --------------------------------------------------------------------- 채팅 */

  const send = () => {
    const text = cleanChat(draft);
    if (!text) return;
    const msg: ChatMsg = {
      id: myId,
      msgId: `${myId}-${Date.now()}`,
      nickname,
      text,
    };
    connRef.current?.sendChat(msg);
    pushChat(msg, true);
    setDraft('');
    // 보내고 나면 입력칸에서 빠져나와야 방향키로 다시 움직일 수 있다.
    // (Enter 를 누르면 언제든 다시 입력칸으로 들어온다)
    chatInputRef.current?.blur();
  };

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  /* --------------------------------------------------------------------- 화면 */

  const bubbleOf = (id: string) => bubbles.find((b) => b.actorId === id);

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
      </div>

      {status === 'unconfigured' && (
        <p className="pz-warn">
          실시간 접속이 설정되지 않았습니다. 서버 환경변수에 <code>SUPABASE_ANON_KEY</code> 를
          추가하면 다른 사람들과 같이 보입니다. (지금은 나 혼자 걸어다니는 상태)
        </p>
      )}

      <div className="pz-stage-wrap">
        <div className="pz-stage">
          {/* ---- 배경 (이미지 없이 CSS 로 그린 광장) ---- */}
          <div className="pz-sky" />
          <div className="pz-far" />
          <div className="pz-ground" />
          <div className="pz-plaza-ring" />
          <div className="pz-fountain">
            <div className="pz-fountain-water" />
          </div>
          <div className="pz-tree pz-tree--1" />
          <div className="pz-tree pz-tree--2" />
          <div className="pz-tree pz-tree--3" />
          <div className="pz-bench pz-bench--l" />
          <div className="pz-bench pz-bench--r" />
          <div className="pz-lamp pz-lamp--l" />
          <div className="pz-lamp pz-lamp--r" />
          <div className="pz-sign">HELLOWORLD 광장</div>

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
                {/* 말풍선 → 닉네임 → 미니미 순서로 세로로 쌓인다.
                    발 위치가 기준점(translate -100%)이라 위로만 자란다. */}
                {bubble && <div className="pz-bubble">{bubble.text}</div>}
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

      {/* ---- 조작 + 채팅 ---- */}
      <div className="pz-bottom">
        <div className="pz-dpad" aria-hidden="true">
          {([
            ['ArrowUp', '▲', 'u'],
            ['ArrowLeft', '◀', 'l'],
            ['ArrowDown', '▼', 'd'],
            ['ArrowRight', '▶', 'r'],
          ] as const).map(([key, label, pos]) => (
            <button
              key={key}
              type="button"
              className={`pz-dpad-btn pz-dpad-btn--${pos}`}
              onPointerDown={(e) => {
                e.preventDefault();
                holdDir(key, true);
              }}
              onPointerUp={() => holdDir(key, false)}
              onPointerLeave={() => holdDir(key, false)}
              onPointerCancel={() => holdDir(key, false)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="pz-chat">
          <div className="pz-log" ref={logRef}>
            {log.length === 0 ? (
              <div className="pz-log-empty">
                방향키(또는 WASD)로 움직이고, Enter 로 채팅해 보세요.
              </div>
            ) : (
              log.map((l) => (
                <div key={l.msgId} className={l.mine ? 'pz-log-line is-mine' : 'pz-log-line'}>
                  <b>{l.nickname}</b> {l.text}
                </div>
              ))
            )}
          </div>
          <div className="pz-chat-bar">
            <input
              ref={chatInputRef}
              type="text"
              className="pz-chat-input"
              placeholder="메시지를 입력하세요"
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
                  send();
                } else if (e.key === 'Escape') {
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
    </div>
  );
}
