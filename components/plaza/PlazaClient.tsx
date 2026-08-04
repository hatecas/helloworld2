'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  BUBBLE_MS,
  CHAT_LOG_MAX,
  CHAT_MAX,
  CHAT_SWEEP_MS,
  CHAT_TTL_MS,
  chatTimeLabel,
  EMOTE_MS,
  GRAVITY,
  JUMP_V0,
  MINIMI_W,
  POS_INTERVAL,
  MINIMI_H,
  NOTICE_MAX,
  NOTICE_MS,
  cleanChat,
  cleanNotice,
  clamp,
  depthScale,
  TAB_CHANNEL,
  type ChatMsg,
  type Facing,
  type MapId,
  type PosMsg,
  type SummitMsg,
} from '@/lib/plaza/protocol';
import {
  COYOTE_MS,
  FOREST_AIR_ACCEL,
  FOREST_JUMP_V0,
  JUMP_BUFFER_MS,
  KNOCK_MS,
  KNOCK_VX,
  KNOCK_VY,
  RUN_FIRST,
  RUN_KEY,
  RUN_LAST,
  RUN_MAPS,
  cameraY,
  gravityFor,
  hazardHit,
  hazardPos,
  landingOn,
  mapOf,
  portalAt,
  type Portal,
} from '@/lib/plaza/maps';
import { emoteByIndex, emoteSrc, emotesFor } from '@/lib/plaza/emotes';
import { joinPlaza, type PlazaConnection, type PlazaStatus } from '@/lib/plaza/realtime';
import { linkify } from '@/lib/plaza/linkify';
import { playBump, playChime } from '@/lib/plaza/chime';
import { MINIMI_TARGET_H } from '@/lib/minimi/sizes.generated';
import { CROUCH_SQUASH, applyMinimiFit, minimiTransform, shadowWidth } from '@/lib/minimi/fit';

/** 한 명의 화면상 상태. 좌표는 60fps 로 움직이므로 React state 가 아니라 ref 로 들고 있는다. */
interface Actor {
  id: string;
  nickname: string;
  minimi: string;
  /** 지금 어느 맵에 있는지 — 내 맵 사람만 그린다 */
  map: MapId;
  x: number;
  y: number;
  /** 네트워크로 받은 목표 위치 (내 캐릭터는 x,y 와 같다) */
  tx: number;
  ty: number;
  facing: Facing;
  /** 점프로 떠 있는 높이(px). 좌표(y)는 그대로고 보이는 위치만 올라간다. (광장 전용) */
  jump: number;
  tjump: number;
  jumpV: number;
  /**
   * 인내의 숲(옆에서 보는 구도) 전용 — 세로 속도와 발판에 서 있는지.
   * 여기서는 y 가 곧 높이라서 jump 대신 y 가 직접 오르내린다.
   */
  vy: number;
  grounded: boolean;
  /**
   * 인내의 숲 가로 이동 속도 — 지상에선 목표 속도로 즉시, 공중에선 관성으로 서서히 붙는다.
   * (방해물에 튕기는 vx 와 달리 이건 내 조작으로 생기는 속도다)
   */
  mvx: number;
  /** 발판을 걸어 벗어난 직후 이 시각까지는 아직 점프를 받아 준다 (코요테 타임) */
  coyoteUntil: number;
  /** 방해물에 맞고 튕겨 나가는 가로 속도 (조작으로는 안 생긴다) */
  vx: number;
  /** 이때까지는 조작이 안 먹는다(튕겨 나가는 중) + 다시 맞지 않는다 */
  stunUntil: number;
  /** 하향 점프로 통과하는 중인 발판 높이 — 이 높이까지의 발판은 밟지 않는다 */
  dropFrom: number | null;
  /** 엎드려 있는지 (↓). 몸통이 낮아져 머리 위로 지나가는 방해물을 피한다. */
  crouch: boolean;
  /** 재생 중인 특수 동작 이름. null 이면 평소 모습 */
  emote: string | null;
  /** 이모트 재생 토큰 — 연타했을 때 앞선 타이머가 뒤 것을 지워 버리지 않게 */
  emoteToken: number;
  el: HTMLDivElement | null;
  imgEl: HTMLImageElement | null;
  bubbleEl: HTMLDivElement | null;
  /** 미니맵 위의 점 */
  dotEl: HTMLElement | null;
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
  /** 발송 시각(epoch ms) — 오른쪽 시간 표기와 2시간 경과 삭제에 쓴다 */
  ts: number;
  /** 사람이 한 말이 아니라 알림(누가 나갔다 등) */
  system?: boolean;
}

const KEY_LEFT = new Set(['ArrowLeft', 'a', 'A', 'ㅁ']);
const KEY_RIGHT = new Set(['ArrowRight', 'd', 'D', 'ㅇ']);
const KEY_UP = new Set(['ArrowUp', 'w', 'W', 'ㅈ']);
const KEY_DOWN = new Set(['ArrowDown', 's', 'S', 'ㄴ']);
/** 점프 — ALT 는 예전부터 쓰던 키, 스페이스는 발판을 뛰는 데 더 자연스러워 같이 받는다 */
const KEY_JUMP = new Set(['Alt', ' ']);

const SOUND_KEY = 'helloworld_plaza_sound';

/** 문을 지나온 직후 되돌아가지 않게 두는 여유(ms) */
const PORTAL_COOLDOWN_MS = 700;
/** 정상 도착 알림이 떠 있는 시간(ms) */
const SUMMIT_MS = 6000;

/** 12.34초 */
function climbLabel(ms: number): string {
  return `${(ms / 1000).toFixed(2)}초`;
}

/**
 * 지금 보여 줄 미니미 그림.
 *
 * 엎드리면 '납작하게 엎드린' 그림(도트 미니미의 Sleep)을, 없으면 평소 그림을 쓴다.
 * 화면(JSX)과 매 프레임 도는 루프가 '같은 함수' 로 정해야 한다 —
 * 예전에는 루프가 img.src 를 직접 갈아 끼웠는데, 리렌더가 한 번 일어나면 React 가
 * 서 있는 그림으로 되돌려 놓고 루프의 중복 방지 검사는 이미 바꿨다고 여겨서
 * 엎드린 채로 그림만 일어서 있었다.
 */
function spriteOf(a: { minimi: string; emote: string | null; crouch: boolean }): string {
  const prone = a.crouch ? emoteSrc(a.minimi, 'sleep') : null;
  return prone || (a.emote && emoteSrc(a.minimi, a.emote)) || a.minimi;
}

/** 엎드린 그림이 없는 미니미는 세로로 눌러서 표현한다 */
function squashOf(a: { minimi: string; crouch: boolean }): number {
  return a.crouch && !emoteSrc(a.minimi, 'sleep') ? CROUCH_SQUASH : 1;
}

type RecordRow = { nickname: string; ms: number };

export default function PlazaClient({
  nickname,
  minimi,
  supabaseUrl,
  supabaseAnonKey,
  records: initialRecords,
  isAdmin,
  adminNickname,
}: {
  nickname: string;
  minimi: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  /** 팻말에 새길 상위 기록 — 서버에서 미리 실어 온다 */
  records: Record<string, RecordRow[]>;
  /** 내가 공지를 띄울 수 있는 사람인지 */
  isAdmin: boolean;
  /** 관리자의 닉네임 — 이 사람이 보낸 공지만 띄운다 */
  adminNickname: string;
}) {
  const [myId] = useState(() => `${nickname}#${Math.random().toString(36).slice(2, 8)}`);
  /** 내 미니미가 할 수 있는 특수 동작. 없는 미니미면 빈 배열이라 안내도 안 뜬다. */
  const myEmotes = emotesFor(minimi);

  const actorsRef = useRef<Map<string, Actor>>(new Map());
  const keysRef = useRef<Set<string>>(new Set());
  const connRef = useRef<PlazaConnection | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  /** 움직이는 방해물 그림들 — 매 프레임 자리를 옮기므로 ref 로 들고 있는다 */
  const hazardElsRef = useRef<Array<HTMLImageElement | null>>([]);
  /** 미니맵에서 '지금 화면에 보이는 범위' 를 나타내는 칸 */
  const miniViewRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef(false);
  const soundRef = useRef(true);

  /* ---- 맵 ---- */
  const [mapId, setMapId] = useState<MapId>('plaza');
  // 매 프레임 도는 루프는 state 가 아니라 ref 를 본다 (effect 재구성 없이 즉시 반영)
  const mapRef = useRef<MapId>('plaza');
  /** 카메라가 보여 주는 세로 시작점 (광장은 늘 0) */
  const camRef = useRef(0);
  const portalCooldownRef = useRef(0);
  /** 지금 발이 들어와 있는 문 — 안내를 띄우고 ↑ 를 받는다 */
  const [nearPortal, setNearPortal] = useState<Portal | null>(null);
  const nearPortalRef = useRef<Portal | null>(null);

  /* ---- 인내의 숲 등반 ---- */
  /**
   * 한 번의 도전이 시작된 시각 (아직 안 떠났으면 null).
   *
   * 1층 시작 발판을 떠날 때 돌기 시작해서 **문을 지나 2층으로 넘어가도 멈추지 않는다.**
   * 기록은 '1층 시작부터 2층 정상까지' 한 번에 오른 시간이다.
   * 1층 시작 발판으로 돌아오거나 광장으로 나가면 처음부터 다시 잰다.
   */
  const runStartRef = useRef<number | null>(null);
  /**
   * 점프 입력을 누른 시각 — 인내의 숲 전용. keydown 은 이 값만 찍고, 실제 점프는
   * 이동 루프가 처리한다. 그래야 착지 직전 입력(점프 버퍼)과 발판을 벗어난 직후
   * 입력(코요테)을 한곳에서 너그럽게 받아 줄 수 있다. (0 = 대기 중인 입력 없음)
   */
  const jumpReqRef = useRef(0);
  /** 지금 층의 정상 도착을 이미 알렸는지 */
  const summitDoneRef = useRef(false);
  const [summit, setSummit] = useState<{
    nickname: string;
    ms: number;
    mine: boolean;
    done: boolean;
  } | null>(null);
  /** 광장 팻말에 새길 상위 기록 (맵별) */
  const [records, setRecords] = useState<Record<string, RecordRow[]>>(initialRecords);

  /** 관리자 공지 — 화면 위쪽에 크게 잠깐 뜬다 */
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeDraft, setNoticeDraft] = useState('');
  /**
   * 지금 접속해 있는 사람 (id → 닉네임).
   * '나갔습니다' 를 띄우려면 이전 명단과 비교해야 한다 — 명단에 한 번도 없던 id 가
   * 없다고 해서 나간 게 아니기 때문이다(좌표만 먼저 도착한 사람일 수 있다).
   */
  const rosterRef = useRef<Map<string, string>>(new Map());

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
    const start = mapOf('plaza').spawn(myId);
    actorsRef.current.set(myId, {
      id: myId,
      nickname,
      minimi,
      map: 'plaza',
      x: start.x,
      y: start.y,
      tx: start.x,
      ty: start.y,
      facing: 'right',
      jump: 0,
      tjump: 0,
      jumpV: 0,
      vy: 0,
      grounded: false,
      mvx: 0,
      coyoteUntil: 0,
      vx: 0,
      stunUntil: 0,
      dropFrom: null,
      crouch: false,
      emote: null,
      emoteToken: 0,
      el: null,
      imgEl: null,
      bubbleEl: null,
      dotEl: null,
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

  /** 그릴 사람 목록 — 내가 있는 맵에 있는 사람만 */
  const syncIds = useCallback(() => {
    setIds((prev) => {
      const next = [...actorsRef.current.values()]
        .filter((a) => a.map === mapRef.current)
        .map((a) => a.id);
      if (prev.length === next.length && prev.every((id, i) => id === next[i])) return prev;
      return next;
    });
  }, []);

  /* ------------------------------------------------------------- 지난 대화 */

  useEffect(() => {
    let cancelled = false;
    fetch('/api/plaza/chat', { cache: 'no-store' })
      .then((res) => res.json())
      .then(
        (json: { log?: Array<{ seq: number; nickname: string; text: string; at: string }> }) => {
          if (cancelled) return;
          setLog(
            (json.log ?? []).map((l) => ({
              msgId: `h${l.seq}`,
              nickname: l.nickname,
              text: l.text,
              mine: l.nickname === nickname,
              ts: new Date(l.at).getTime(),
            })),
          );
        },
      )
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [nickname]);

  /*
   * 2시간 지난 줄은 화면에서 걷어낸다.
   * 서버 기록도 같은 기준으로 지워지지만(insertPlazaChat), 광장을 열어 둔 채
   * 오래 머무는 창은 새로 받아오지 않으므로 여기서도 주기적으로 정리한다.
   */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const cutoff = Date.now() - CHAT_TTL_MS;
      setLog((prev) => (prev.some((l) => l.ts < cutoff) ? prev.filter((l) => l.ts >= cutoff) : prev));
    }, CHAT_SWEEP_MS);
    return () => window.clearInterval(timer);
  }, []);

  /* ------------------------------------------------------------------- 실시간 */

  const upsertRemote = useCallback(
    (msg: PosMsg) => {
      if (msg.id === myId) return;
      const actors = actorsRef.current;
      const at: MapId = msg.map ?? 'plaza';
      const found = actors.get(msg.id);
      if (found) {
        // 맵을 옮긴 사람은 순간이동처럼 보이지 않게 목표가 아니라 현재 위치까지 바꾼다
        const moved = found.map !== at;
        found.map = at;
        found.tx = msg.x;
        found.ty = msg.y;
        found.tjump = msg.jump ?? 0;
        found.facing = msg.facing;
        const crouch = Boolean(msg.crouch);
        if (crouch !== found.crouch) {
          found.crouch = crouch;
          setRev((r) => r + 1); // 엎드린 그림으로 갈아야 한다
        }
        if (moved) {
          found.x = msg.x;
          found.y = msg.y;
          found.jump = msg.jump ?? 0;
          syncIds();
        }
        if (found.nickname !== msg.nickname || found.minimi !== msg.minimi) {
          found.nickname = msg.nickname;
          found.minimi = msg.minimi;
          setRev((r) => r + 1);
        }
      } else {
        actors.set(msg.id, {
          id: msg.id,
          nickname: msg.nickname,
          minimi: msg.minimi,
          map: at,
          x: msg.x,
          y: msg.y,
          tx: msg.x,
          ty: msg.y,
          facing: msg.facing,
          jump: msg.jump ?? 0,
          tjump: msg.jump ?? 0,
          jumpV: 0,
          vy: 0,
          grounded: false,
          mvx: 0,
          coyoteUntil: 0,
          vx: 0,
          stunUntil: 0,
          dropFrom: null,
          crouch: Boolean(msg.crouch),
          emote: null,
          emoteToken: 0,
          el: null,
          imgEl: null,
          bubbleEl: null,
          dotEl: null,
        });
        syncIds();
      }
    },
    [myId, syncIds],
  );

  /** 채팅 로그에 알림 한 줄 (사람이 한 말과 구별해서 보여 준다) */
  const pushSystem = useCallback((text: string) => {
    setLog((prev) =>
      [
        ...prev,
        {
          msgId: `sys-${text}-${Date.now()}`,
          nickname: '',
          text,
          mine: false,
          ts: Date.now(),
          system: true,
        },
      ].slice(-CHAT_LOG_MAX),
    );
  }, []);

  const pushChat = useCallback((msg: ChatMsg, mine: boolean) => {
    setBubbles((prev) => [
      ...prev.filter((b) => b.actorId !== msg.id),
      { msgId: msg.msgId, actorId: msg.id, text: msg.text },
    ]);
    setLog((prev) =>
      [
        ...prev,
        { msgId: msg.msgId, nickname: msg.nickname, text: msg.text, mine, ts: Date.now() },
      ].slice(-CHAT_LOG_MAX),
    );
    // 남이 보낸 것만 띠링 (내가 친 글에까지 울리면 시끄럽다)
    if (!mine && soundRef.current) playChime();
    window.setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.msgId !== msg.msgId));
    }, BUBBLE_MS);
  }, []);

  /**
   * 특수 동작 재생 — 잠깐 다른 그림으로 바꿨다가 되돌린다.
   *
   * 그림 경로가 아니라 이름으로 다루므로, 남이 보낸 것도 그 사람의 미니미 기준으로 찾는다.
   * 할 줄 모르는 동작이면 아무 일도 하지 않는다.
   */
  const playEmote = useCallback((actorId: string, name: string) => {
    const actor = actorsRef.current.get(actorId);
    if (!actor || !emoteSrc(actor.minimi, name)) return;

    const token = actor.emoteToken + 1;
    actor.emote = name;
    actor.emoteToken = token;
    setRev((r) => r + 1);

    window.setTimeout(() => {
      const cur = actorsRef.current.get(actorId);
      // 그 사이 다시 눌렀으면 그쪽 타이머에 맡긴다
      if (!cur || cur.emoteToken !== token) return;
      cur.emote = null;
      setRev((r) => r + 1);
    }, EMOTE_MS);
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
        map: me.map,
        crouch: me.crouch,
      });
    },
    [myId],
  );

  /* ------------------------------------------------------------------- 맵 이동 */

  /**
   * 문을 통해 다른 맵으로. 도착 지점은 그 맵의 되돌아가는 문에서 떨어뜨려 둔다
   * (겹쳐 서면 ↑ 를 누르고 있는 동안 곧바로 왕복해 버린다).
   */
  const travel = useCallback(
    (to: MapId) => {
      const me = actorsRef.current.get(myId);
      if (!me) return;

      const dest = mapOf(to);
      const at = dest.arrival[me.map] ?? dest.spawn(myId);

      me.map = to;
      me.x = at.x;
      me.y = at.y;
      me.tx = at.x;
      me.ty = at.y;
      me.jump = 0;
      me.tjump = 0;
      me.jumpV = 0;
      me.vy = 0;
      me.mvx = 0;
      me.coyoteUntil = 0;
      me.vx = 0;
      me.stunUntil = 0;
      me.dropFrom = null;
      me.crouch = false;
      me.grounded = false;

      mapRef.current = to;
      hazardElsRef.current = [];
      setMapId(to);
      camRef.current = cameraY(dest, at.y);
      portalCooldownRef.current = performance.now() + PORTAL_COOLDOWN_MS;
      keysRef.current.clear();
      nearPortalRef.current = null;
      setNearPortal(null);

      /*
       * 도전 시계는 층을 넘어갈 때(1층 정상 → 2층)는 그대로 이어 간다 — 기록이
       * '1층 시작부터 2층 정상까지' 이기 때문이다. 광장으로 나가면 처음부터 다시.
       */
      if (!RUN_MAPS.includes(to)) runStartRef.current = null;
      // 정상으로 되돌아 들어온 경우(깊은 곳 → 1층)는 도착 알림이 다시 뜨지 않게 한다
      summitDoneRef.current = dest.summitY != null && at.y <= dest.summitY;
      setSummit(null);

      syncIds();
      sendMyPos(false);
    },
    [myId, sendMyPos, syncIds],
  );

  /* ------------------------------------------------------------- 등반 기록 */

  /*
   * 처음 것은 서버가 실어 보내므로 여기서 다시 받아 오지 않는다.
   * 누군가 정상에 올랐을 때만 다시 읽어서 팻말을 갱신한다.
   */
  const loadRecords = useCallback(() => {
    fetch('/api/plaza/records', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: Record<string, RecordRow[]>) => setRecords(json))
      .catch(() => undefined);
  }, []);

  /** 공지를 화면 위쪽에 크게 잠깐 띄운다 */
  const showNotice = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => {
      setNotice((cur) => (cur === text ? null : cur));
    }, NOTICE_MS);
  }, []);

  /** 정상 도착 알림 (내 것이든 남의 것이든 같은 자리에 띄운다) */
  const showSummit = useCallback(
    (who: string, ms: number, mine: boolean, done: boolean) => {
      setSummit({ nickname: who, ms, mine, done });
      window.setTimeout(() => {
        setSummit((cur) => (cur && cur.nickname === who && cur.ms === ms ? null : cur));
      }, SUMMIT_MS);
    },
    [],
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
        onEmote: (msg) => {
          if (live && msg.id !== myId) playEmote(msg.id, msg.emote);
        },
        // 같은 숲에 있는 사람의 기록만 띄운다 (광장에 있는데 남의 등반 기록이 뜨면 뜬금없다)
        onSummit: (msg: SummitMsg) => {
          if (!live || msg.id === myId) return;
          // 완주면 팻말이 바뀌었을 수 있다 (어느 맵에 있든 다시 읽는다)
          if (msg.done) loadRecords();
          // 알림은 '그 정상이 있는 맵' 에 있는 사람들에게만 띄운다
          if (mapRef.current !== (msg.map ?? 'forest')) return;
          showSummit(msg.nickname, msg.ms, false, Boolean(msg.done));
        },
        // 공지는 관리자 닉네임에서 온 것만 띄운다 (실시간 채널은 서버를 거치지 않는다)
        onNotice: (msg) => {
          if (!live || !adminNickname || msg.from !== adminNickname) return;
          showNotice(msg.text);
        },
        onHello: () => live && sendMyPos(false),
        // 다른 기기/브라우저에서 같은 계정이 들어왔다
        onClaim: (msg) => {
          if (live && msg.nickname === nickname && msg.id !== myId) leaveForOther();
        },
        onRoster: (roster) => {
          if (!live) return;

          /*
           * 나간 사람 알리기.
           * '명단에 있었는데 이제 없는' id 만 나간 것으로 본다. 지금 명단에 없다는
           * 이유만으로 판단하면, 좌표가 먼저 도착하고 presence 가 아직 안 붙은
           * 사람까지 나갔다고 뜬다.
           */
          for (const [id, who] of rosterRef.current) {
            if (id === myId || roster.has(id)) continue;
            const name = who || actorsRef.current.get(id)?.nickname;
            if (name) pushSystem(`${name}님이 서버를 나갔습니다`);
          }
          rosterRef.current = roster;

          let changed = false;
          for (const id of [...actorsRef.current.keys()]) {
            if (id !== myId && !roster.has(id)) {
              actorsRef.current.delete(id);
              changed = true;
            }
          }
          if (changed) syncIds();
          const missing = [...roster.keys()].some(
            (id) => id !== myId && !actorsRef.current.has(id),
          );
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
    playEmote,
    sendMyPos,
    syncIds,
    leaveForOther,
    showSummit,
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

        /*
         * ↑(또는 W) 로 문에 들어간다 — 메이플의 포탈과 같은 조작.
         * keydown 에서만 다루므로 문을 지나온 직후 키를 누르고 있어도 곧바로
         * 되돌아가지 않는다(쿨다운까지 두 겹으로 막는다).
         */
        if (KEY_UP.has(k)) {
          const portal = nearPortalRef.current;
          if (portal && performance.now() >= portalCooldownRef.current) travel(portal.to);
        }
      } else if (KEY_JUMP.has(k)) {
        // ALT 는 브라우저 메뉴로 포커스가 튀므로, 스페이스는 화면이 스크롤되므로 막는다
        e.preventDefault();
        const me = actorsRef.current.get(myId);
        if (!me) return;
        const here = mapOf(me.map);
        if (here.kind === 'platform') {
          /*
           * 실제 점프는 이동 루프가 처리한다 — 여기선 '눌렀다' 는 시각만 찍는다.
           * 그래야 착지 직전 입력(버퍼)·발판을 막 벗어난 입력(코요테)을 놓치지 않고,
           * 하향 점프인지(↓ 동시입력) 도 루프가 그 순간의 키 상태로 판단할 수 있다.
           */
          jumpReqRef.current = performance.now();
        } else if (me.jump === 0) {
          me.jumpV = JUMP_V0;
        }
      } else if (k === 'Enter') {
        chatInputRef.current?.focus();
        e.preventDefault();
      } else if (k >= '1' && k <= '9') {
        // 숫자키 = 특수 동작. 그 미니미가 할 줄 아는 게 없으면 그냥 지나간다.
        const me = actorsRef.current.get(myId);
        const emote = me && emoteByIndex(me.minimi, Number(k) - 1);
        if (!emote) return;
        e.preventDefault();
        playEmote(myId, emote.name);
        connRef.current?.sendEmote({ id: myId, emote: emote.name });
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
  }, [myId, playEmote, travel]);

  /* ------------------------------------------------------------ 이동 + 그리기 루프 */

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastSent = 0;
    let wasBusy = false;
    let wasCrouch = false;
    // 인내의 숲 코요테 타임용 — 지난 프레임에 발판에 서 있었는지
    let prevGrounded = true;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (kickedRef.current) {
        raf = requestAnimationFrame(frame);
        return;
      }

      const map = mapOf(mapRef.current);
      const stageW = stageRef.current?.clientWidth ?? 0;
      const stageH = stageRef.current?.clientHeight ?? 0;
      /** 논리 px → 화면 px */
      const unit = stageH > 0 ? stageH / map.viewH : 0;
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

        let busy: boolean;

        if (map.kind === 'topdown') {
          /* ---- 광장: 위에서 내려다보는 구도. y 는 깊이라 위아래로 자유롭게 걷는다 ---- */
          // 여기서 ↓ 는 '아래로 걷기' 다 — 숲에서 엎드린 채 넘어와도 일어선다
          me.crouch = false;
          const moving = dx !== 0 || dy !== 0;
          if (moving) {
            const len = Math.hypot(dx, dy) || 1;
            me.x = clamp(me.x + (dx / len) * map.speed * dt, map.walk.minX, map.walk.maxX);
            me.y = clamp(me.y + (dy / len) * map.speed * dt, map.walk.minY, map.walk.maxY);
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
          me.tjump = me.jump;
          busy = moving || me.jump > 0;
        } else {
          /* ---- 인내의 숲: 옆에서 보는 구도. 좌우로만 걷고 중력이 늘 작용한다 ---- */
          const stunned = now < me.stunUntil;

          /*
           * 점프 실행 — keydown 이 찍어 둔 요청(jumpReqRef)을 여기서 처리한다.
           * · 발판에 서 있거나, 막 벗어난 직후(코요테 시간 안)면 곧바로 뛴다.
           * · 아직 공중이면 요청을 버퍼 시간만큼 들고 있다가 착지하는 프레임에 뛴다.
           * 이렇게 한곳에 모아야 '눌렀는데 씹힘' 이 사라진다.
           */
          const req = jumpReqRef.current;
          if (req) {
            if (now - req > JUMP_BUFFER_MS) {
              jumpReqRef.current = 0; // 너무 오래된 입력은 버린다
            } else if (!stunned) {
              const canGround = me.grounded;
              const canCoyote = !me.grounded && me.vy >= 0 && now <= me.coyoteUntil;
              if (canGround || canCoyote) {
                jumpReqRef.current = 0;
                me.coyoteUntil = 0;
                // 하향 점프 — ↓ 를 누른 채 뛰면 밟고 선 발판을 통과해 내려간다(공중/코요테에선 불가)
                if (dy > 0 && canGround) {
                  me.dropFrom = me.y;
                  me.vy = 60;
                } else {
                  me.vy = -FOREST_JUMP_V0;
                  me.dropFrom = null;
                  // 방향키를 누른 채 뛰면 그 방향 최고 속도로 출발 — 건너뛰기 도달거리 유지
                  if (dx !== 0) me.mvx = dx * map.speed;
                  // 1층 시작 발판을 처음 떠나는 순간부터 도전 시간을 센다
                  if (
                    map.id === RUN_FIRST &&
                    map.startY != null &&
                    me.y >= map.startY &&
                    runStartRef.current === null
                  ) {
                    runStartRef.current = now;
                  }
                }
                me.grounded = false;
              }
            }
          }

          /*
           * 엎드리기 — ↓ 를 누르고 있으면 발판에 붙어 납작해진다.
           * 몸통이 낮아져 머리 위로 지나가는 방해물을 피할 수 있고, 대신 걸을 수 없다.
           * (그 자리에서 기다릴지, 일어나 뛸지를 고르게 된다)
           */
          const wantCrouch = dy > 0 && me.grounded && !stunned;
          if (wantCrouch !== me.crouch) {
            me.crouch = wantCrouch;
            // 그림이 바뀌어야 하므로 다시 그린다 (자주 있는 일이 아니라 부담 없다)
            setRev((r) => r + 1);
          }

          /*
           * 가로 이동 — 지상에선 목표 속도로 즉시 붙지만, 공중에선 관성으로 서서히 붙는다.
           * 공중에서 방향을 되돌리려면 관성을 거슬러야 해서 좌우로 '와다다' 튀지 않고
           * 메이플처럼 무게가 실린다. (mvx 는 내 조작 속도 — 튕겨나가는 vx 와 별개다)
           */
          const controllable = !stunned && !me.crouch;
          const targetVx = controllable && dx !== 0 ? dx * map.speed : 0;
          if (me.grounded) {
            me.mvx = targetVx;
          } else {
            const dv = targetVx - me.mvx;
            const step = FOREST_AIR_ACCEL * dt;
            me.mvx += Math.abs(dv) <= step ? dv : Math.sign(dv) * step;
          }
          if (controllable && dx !== 0) me.facing = dx < 0 ? 'left' : 'right';
          me.x = clamp(me.x + me.mvx * dt, map.walk.minX, map.walk.maxX);
          const moving = me.mvx !== 0;

          // 튕겨 나가는 중 — 조작 대신 관성으로 밀려나고 빠르게 잦아든다
          if (me.vx !== 0) {
            me.x = clamp(me.x + me.vx * dt, map.walk.minX, map.walk.maxX);
            me.vx *= Math.pow(0.02, dt);
            if (Math.abs(me.vx) < 4) me.vx = 0;
          }

          const prevY = me.y;
          // 올라갈 때보다 떨어질 때를 무겁게 — 정점에서 붕 뜨지 않고 툭 떨어진다
          me.vy += gravityFor(me.vy) * dt;
          me.y += me.vy * dt;
          me.grounded = false;

          /*
           * 착지. 서 있는 동안에도 매 프레임 아주 조금 떨어졌다가 다시 같은 발판에
           * 올라서는 식이라, '서 있기' 와 '발판 끝에서 걸어 나가면 떨어지기' 가
           * 따로 코드를 두지 않아도 저절로 처리된다.
           * 하향 점프 중이면 dropFrom 높이까지의 발판은 건너뛴다.
           */
          if (me.vy >= 0) {
            const land = landingOn(map.platforms, me.x, prevY, me.y, me.dropFrom);
            if (land) {
              me.y = land.y;
              me.vy = 0;
              me.grounded = true;
              me.dropFrom = null;

              if (map.startY != null && land.y >= map.startY) {
                // 시작 발판으로 돌아왔다 — 1층이면 도전을 처음부터 다시 잰다
                if (map.id === RUN_FIRST) runStartRef.current = null;
                summitDoneRef.current = false;
              } else if (map.summitY != null && land.y <= map.summitY && !summitDoneRef.current) {
                summitDoneRef.current = true;
                const ms = Math.max(0, now - (runStartRef.current ?? now));
                // 마지막 층 정상이면 '완주' — 기록으로 남는 건 이것뿐이다
                const done = map.id === RUN_LAST;

                showSummit(nickname, ms, true, done);
                connRef.current?.sendSummit({ id: myId, nickname, ms, map: map.id, done });

                if (done) {
                  // 팻말에 새길 기록으로 남긴다 (개인 최고 기록만 갱신된다)
                  void fetch('/api/plaza/records', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ms: Math.round(ms) }),
                  })
                    .then((res) => res.json())
                    .then(
                      (json: { ok?: boolean; top?: Array<{ nickname: string; ms: number }> }) => {
                        if (json.ok && json.top) {
                          setRecords((prev) => ({ ...prev, [RUN_KEY]: json.top! }));
                        }
                      },
                    )
                    .catch(() => undefined);
                }
              }
            }
          }

          /*
           * 움직이는 방해물. 닿으면 반대쪽으로 튕겨 나가고 잠깐 조작이 안 먹는다 —
           * 대개 발판을 놓치고 아래로 떨어진다. 튕겨 나가는 동안은 다시 맞지 않는다.
           */
          if (!stunned) {
            const at = Date.now();
            const hit = hazardHit(map, me.x, me.y, at, me.crouch);
            if (hit) {
              const from = hazardPos(hit, at);
              const away = me.x <= from.x ? -1 : 1;
              me.vx = away * KNOCK_VX;
              me.vy = -KNOCK_VY;
              me.stunUntil = now + KNOCK_MS;
              me.grounded = false;
              me.dropFrom = null;
              if (soundRef.current) playBump();
            }
          }

          /*
           * 발판을 다 놓쳐 맵 밖으로 떨어지면 그 층 시작 지점으로.
           * 도전 시계는 세우지 않는다 — 떨어지는 것도 걸린 시간에 들어가야
           * '한 번에 얼마나 빨리 올랐나' 가 기록이 된다. (1층 시작 발판에 닿으면
           * 위쪽 착지 처리에서 처음부터 다시 잰다)
           */
          if (me.y > map.h) {
            const restart = map.spawn(myId);
            me.x = restart.x;
            me.y = restart.y;
            me.vy = 0;
            me.mvx = 0;
            me.vx = 0;
            me.dropFrom = null;
            summitDoneRef.current = false;
          }

          /*
           * 발판을 '걸어서' 벗어난 순간(점프가 아니라 — 그땐 vy 가 음수다)부터
           * 잠깐 코요테 시간을 연다. 발판 끝에서 살짝 늦게 눌러도 점프가 나간다.
           */
          if (prevGrounded && !me.grounded && me.vy > 0) {
            me.coyoteUntil = now + COYOTE_MS;
          }
          prevGrounded = me.grounded;

          me.jump = 0;
          me.tjump = 0;
          busy = moving || !me.grounded || me.vx !== 0;
        }

        me.tx = me.x;
        me.ty = me.y;

        // 문 앞인가 — 안내를 띄우고 ↑ 를 받는다
        const portal = portalAt(map, me.x, me.y);
        if (portal !== nearPortalRef.current) {
          nearPortalRef.current = portal;
          setNearPortal(portal);
        }

        // 카메라는 내 캐릭터를 따라간다 (광장은 맵이 화면과 같아 늘 0)
        const camTarget = cameraY(map, me.y);
        camRef.current += (camTarget - camRef.current) * (1 - Math.pow(0.002, dt));

        // 엎드리기는 제자리에서 일어나는 변화라 '움직임' 으로는 안 잡힌다 — 따로 알린다
        const poseChanged = me.crouch !== wasCrouch;
        if (busy && now - lastSent > POS_INTERVAL) {
          sendMyPos(true);
          lastSent = now;
        } else if ((!busy && wasBusy) || poseChanged) {
          sendMyPos(false);
          lastSent = now;
        }
        wasBusy = busy;
        wasCrouch = me.crouch;
      }

      if (worldRef.current) {
        worldRef.current.style.transform = `translateY(${-(camRef.current / map.h) * 100}%)`;
      }

      // 미니맵에서 '지금 보고 있는 범위'
      if (miniViewRef.current) {
        miniViewRef.current.style.top = `${(camRef.current / map.h) * 100}%`;
        miniViewRef.current.style.height = `${(map.viewH / map.h) * 100}%`;
      }

      // 방해물 자리 — 벽시계의 함수라 서로 맞추는 통신 없이도 모두 같은 자리에 본다
      if (map.hazards.length > 0) {
        const at = Date.now();
        map.hazards.forEach((h, i) => {
          const el = hazardElsRef.current[i];
          if (!el) return;
          const p = hazardPos(h, at);
          el.style.left = `${(p.x / map.w) * 100}%`;
          el.style.top = `${(p.y / map.h) * 100}%`;
        });
      }

      const ease = 1 - Math.pow(0.001, dt);
      for (const a of actorsRef.current.values()) {
        // 다른 맵에 있는 사람은 그리지 않는다 (같은 채널이라 좌표는 계속 들어온다)
        if (a.map !== map.id) continue;

        if (a.id !== myId) {
          a.x += (a.tx - a.x) * ease;
          a.y += (a.ty - a.y) * ease;
          a.jump += (a.tjump - a.jump) * ease;
        }

        // 원근 축소는 '깊이' 가 있는 광장에서만. 옆에서 보는 숲은 다 같은 크기다.
        const scale = map.kind === 'topdown' ? depthScale(a.y) : 1;
        const jumpPx = map.kind === 'topdown' ? a.jump * unit : 0;

        if (a.el) {
          a.el.style.left = `${(a.x / map.w) * 100}%`;
          a.el.style.top = `${(a.y / map.h) * 100}%`;
          a.el.style.transform = `translate(-50%, -100%) translateY(${-jumpPx}px) scale(${scale})`;
          // 광장은 앞뒤가 있어 y 로 겹침을 정하고, 숲은 전부 같은 평면이다
          a.el.style.zIndex = String(map.kind === 'topdown' ? Math.round(a.y) : 600);
          // 방해물에 맞아 튕겨 나가는 중 (내 캐릭터만 알 수 있다)
          if (a.id === myId) a.el.classList.toggle('is-hurt', now < a.stunUntil);
        }

        // 그림은 JSX 가 정한다 (여기서 src 를 직접 건드리면 리렌더와 싸운다)
        const src = spriteOf(a);
        const squash = squashOf(a);

        if (a.imgEl) {
          /*
           * 미니미마다 캔버스 안 캐릭터 크기가 달라서(실측 96~240px) 그대로 두면
           * 누구는 거인, 누구는 콩알이다. 그림마다 재 둔 값으로 크기와 발높이를 맞춘다.
           * 폭·마진은 그림(또는 눌린 정도)이 바뀔 때만 손대면 된다
           * (매 프레임 쓰면 레이아웃이 계속 다시 계산된다).
           */
          const fitKey = `${src}|${squash}`;
          if (a.imgEl.dataset.fit !== fitKey) {
            applyMinimiFit(a.imgEl, src, squash);
            a.imgEl.dataset.fit = fitKey;
          }
          // 좌우 반전 + 가로 치우침 보정 (원본은 '왼쪽' 을 보고 있다)
          const t = minimiTransform(src, a.facing, squash);
          if (a.imgEl.style.transform !== t) a.imgEl.style.transform = t;
        }

        /*
         * 말풍선이 무대 밖으로 나가 잘리지 않게 안쪽으로 밀어 넣는다.
         * 좌우는 실제 렌더 폭으로 계산하고, 위쪽 여유가 없으면 캐릭터 아래로 뒤집는다.
         * 세로는 카메라가 움직이므로 '화면에 보이는' 발 위치로 따진다.
         */
        if (a.bubbleEl && a.el && stageW > 0) {
          const bw = a.bubbleEl.offsetWidth;
          const bh = a.bubbleEl.offsetHeight;
          const cx = (a.x / map.w) * stageW;
          const half = bw / 2;
          let shift = 0;
          if (cx - half < 6) shift = 6 - (cx - half);
          else if (cx + half > stageW - 6) shift = stageW - 6 - (cx + half);
          a.bubbleEl.style.transform = `translateX(${shift}px)`;

          const feetPx = (a.y - camRef.current) * unit;
          const spritePx = MINIMI_H * MINIMI_TARGET_H * scale * (stageW / map.w);
          const headroom = feetPx - spritePx - jumpPx;
          a.el.classList.toggle('is-bubble-below', headroom < bh + 24);
        }

        // 미니맵 위의 점 (누가 어디까지 올라갔는지)
        if (a.dotEl) {
          a.dotEl.style.left = `${(a.x / map.w) * 100}%`;
          a.dotEl.style.top = `${(a.y / map.h) * 100}%`;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [myId, nickname, sendMyPos, showSummit]);

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

  /** 관리자 공지 보내기 — 내 화면에도 바로 띄운다(보낸 건 되돌려받지 않는다) */
  const sendNotice = () => {
    if (!isAdmin || kickedRef.current) return;
    const text = cleanNotice(noticeDraft);
    if (!text) return;
    connRef.current?.sendNotice({ from: nickname, text });
    showNotice(text);
    setNoticeDraft('');
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
  const map = mapOf(mapId);
  const inForest = map.kind === 'platform';

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
        <h1 className="pz-title">{map.name}</h1>
        <span className={`pz-status pz-status--${status}`}>
          {status === 'online'
            ? `${ids.length}명 접속중`
            : status === 'connecting'
              ? '연결 중…'
              : status === 'unconfigured'
                ? '실시간 미설정 (혼자 걷는 중)'
                : '연결 끊김'}
        </span>
        <span className="pz-keyhint">
          {inForest ? (
            <>
              ← → 이동 &nbsp;/&nbsp; SPACE · ALT 점프 &nbsp;/&nbsp; ↓ 엎드리기 &nbsp;/&nbsp; ↓ +
              점프 하향점프 &nbsp;/&nbsp; ↑ 문 &nbsp;/&nbsp; Enter 채팅
            </>
          ) : (
            <>
              방향키 · WASD 이동 &nbsp;/&nbsp; SPACE · ALT 점프 &nbsp;/&nbsp; ↑ 문 &nbsp;/&nbsp;
              Enter 채팅
              {myEmotes.length > 0 && (
                <> &nbsp;/&nbsp; {myEmotes.map((e, i) => `${i + 1} ${e.label}`).join(' · ')}</>
              )}
            </>
          )}
        </span>
      </div>

      {status === 'unconfigured' && (
        <p className="pz-warn">
          실시간 접속이 설정되지 않았습니다. 서버 환경변수에 <code>SUPABASE_ANON_KEY</code> 를
          추가하면 다른 사람들과 같이 보입니다. (지금은 나 혼자 걸어다니는 상태)
        </p>
      )}

      <div className="pz-stage-wrap">
        <div className={`pz-stage pz-stage--${map.id}`} ref={stageRef}>
          {/*
            카메라 칸. 맵이 화면보다 세로로 길면(인내의 숲) 이 칸이 맵 전체 크기가 되고
            루프가 translateY 로 밀어 올린다. 광장은 맵 = 화면이라 늘 제자리다.
          */}
          <div
            className="pz-world"
            ref={worldRef}
            style={{ height: `${(map.h / map.viewH) * 100}%` }}
          >
            {!inForest && (
              <>
                {/* ---- 광장 배경: 위로도 걸어다닐 수 있게 바닥이 화면 전체를 덮는다 ---- */}
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
              </>
            )}

            {inForest && (
              <>
                {/* ---- 인내의 숲: 안개층 + 반딧불 (배경색은 CSS, 물체는 도트 PNG) ---- */}
                <div className="pz-fog pz-fog--1" />
                <div className="pz-fog pz-fog--2" />
                <div className="pz-fog pz-fog--3" />
                {[
                  '14,18', '78,12', '35,29', '62,41', '22,52', '86,58',
                  '48,66', '9,73', '70,81', '38,88', '90,93', '55,96',
                ].map((f) => {
                  const [l, t] = f.split(',');
                  return (
                    <span
                      key={f}
                      className="pz-firefly"
                      style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${Number(l) % 5}s` }}
                    />
                  );
                })}

                {/* 장식 (밑변 중심 기준으로 앉힌다) */}
                {map.props.map((p, i) => (
                  <img
                    key={`${p.src}-${i}`}
                    className={p.far ? 'pz-prop pz-prop--far' : 'pz-prop'}
                    src={p.src}
                    alt=""
                    draggable={false}
                    style={{
                      left: `${(p.x / map.w) * 100}%`,
                      top: `${(p.y / map.h) * 100}%`,
                      width: `${(p.w / map.w) * 100}%`,
                      transform: `translate(-50%, -100%)${p.flip ? ' scaleX(-1)' : ''}`,
                    }}
                  />
                ))}

                {/* 움직이는 방해물 — 자리는 매 프레임 루프가 넣는다 */}
                {map.hazards.map((h, i) => (
                  <img
                    key={`${h.src}-${i}`}
                    className="pz-hazard"
                    src={h.src}
                    alt=""
                    draggable={false}
                    ref={(el) => {
                      hazardElsRef.current[i] = el;
                    }}
                    style={{ width: `${(h.w / map.w) * 100}%` }}
                  />
                ))}

                {/* 발판 */}
                {map.platforms.map((p) => (
                  <div
                    key={`${p.x}-${p.y}`}
                    className="pz-platform"
                    style={{
                      left: `${((p.x - p.w / 2) / map.w) * 100}%`,
                      top: `${(p.y / map.h) * 100}%`,
                      width: `${(p.w / map.w) * 100}%`,
                      // 두께도 논리 px 기준 — 고정 px 로 두면 화면이 좁을 때 발판만 두꺼워진다
                      height: `${(18 / map.h) * 100}%`,
                    }}
                  />
                ))}
              </>
            )}

            {/*
              기록 팻말 — 나무판은 도트 그림이고 글자는 그 위에 얹는다.
              (기록이 바뀔 때마다 그림을 다시 만들 수는 없으니까)
            */}
            {map.recordSign && (
              <div
                className="pz-record"
                style={{
                  left: `${(map.recordSign.x / map.w) * 100}%`,
                  top: `${(map.recordSign.y / map.h) * 100}%`,
                  width: `${(map.recordSign.w / map.w) * 100}%`,
                }}
              >
                <div className="pz-record-text">
                  <b className="pz-record-title">{map.recordSign.title}</b>
                  {(records[map.recordSign.of] ?? []).length === 0 ? (
                    <span className="pz-record-empty">아직 오른 사람이 없어요</span>
                  ) : (
                    (records[map.recordSign.of] ?? []).map((r, i) => (
                      <span key={r.nickname} className="pz-record-row">
                        <span className="pz-record-rank">{i + 1}</span>
                        <span className="pz-record-who">{r.nickname}</span>
                        <span className="pz-record-time">{climbLabel(r.ms)}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ---- 문 ---- */}
            {map.portals.map((p) => (
              <div
                key={`${p.to}-${p.x}`}
                className={nearPortal === p ? 'pz-portal is-near' : 'pz-portal'}
                style={{
                  left: `${(p.x / map.w) * 100}%`,
                  top: `${(p.y / map.h) * 100}%`,
                  width: `${(p.w / map.w) * 100}%`,
                }}
              >
                <span className="pz-portal-label">{p.label}</span>
                <span className="pz-portal-key">↑</span>
              </div>
            ))}

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
                  style={{ width: `${(MINIMI_W / map.w) * 100}%` }}
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
                    src={spriteOf(a)}
                    alt=""
                    draggable={false}
                    ref={(el) => {
                      const cur = actorsRef.current.get(id);
                      if (cur) cur.imgEl = el;
                    }}
                    onError={(e) => {
                      // 폴백까지 실패하면 멈춘다(React 합성이벤트라 onerror=null 무효, 무한 요청 방지)
                      const img = e.currentTarget;
                      if (img.dataset.fallback) return;
                      img.dataset.fallback = '1';
                      img.src = '/resources/images/default/defaultMinimiIcon.gif';
                    }}
                  />
                  {/* 그림자도 캐릭터 크기에 맞춘다 — 콩알 미니미에 커다란 그림자가 깔리지 않게 */}
                  <span className="pz-shadow" style={{ width: `${shadowWidth(a.minimi)}%` }} />
                </div>
              );
            })}
          </div>

          {/* 비네트·안내는 카메라와 함께 움직이면 안 되므로 카메라 칸 밖에 둔다 */}
          <div className="pz-vignette" />

          {/* 관리자 공지 — 화면 위쪽에 크게 5초 */}
          {notice && (
            <div className="pz-notice" role="status">
              <span className="pz-notice-label">공지</span>
              <span className="pz-notice-text">{notice}</span>
            </div>
          )}

          {/*
            미니맵 — 세로로 긴 맵에서는 화면에 한 층 남짓만 보여서
            같이 오르는 사람이 위에 있는지 아래에 있는지 알 수가 없다.
            발판은 고정이라 여기서 한 번 그리고, 사람 점과 보고 있는 범위는 루프가 옮긴다.
          */}
          {inForest && (
            <div className="pz-minimap" style={{ aspectRatio: `${map.w} / ${map.h}` }}>
              {map.platforms.map((p) => (
                <span
                  key={`${p.x}-${p.y}`}
                  className={
                    map.summitY != null && p.y <= map.summitY
                      ? 'pz-mini-plat is-summit'
                      : 'pz-mini-plat'
                  }
                  style={{
                    left: `${((p.x - p.w / 2) / map.w) * 100}%`,
                    top: `${(p.y / map.h) * 100}%`,
                    width: `${(p.w / map.w) * 100}%`,
                  }}
                />
              ))}
              {map.portals.map((p) => (
                <span
                  key={`${p.to}-${p.x}`}
                  className="pz-mini-portal"
                  style={{ left: `${(p.x / map.w) * 100}%`, top: `${(p.y / map.h) * 100}%` }}
                />
              ))}
              <div className="pz-mini-view" ref={miniViewRef} />
              {ids.map((id) => {
                const a = actorsRef.current.get(id);
                if (!a) return null;
                return (
                  <span
                    key={id}
                    className={id === myId ? 'pz-mini-dot is-me' : 'pz-mini-dot'}
                    title={a.nickname}
                    ref={(el) => {
                      const cur = actorsRef.current.get(id);
                      if (cur) cur.dotEl = el;
                    }}
                  />
                );
              })}
            </div>
          )}

          {nearPortal && (
            <div className="pz-hint">
              <b>↑</b> {nearPortal.label}(으)로 이동
            </div>
          )}

          {summit && (
            <div
              className={`pz-summit${summit.mine ? ' is-mine' : ''}${summit.done ? ' is-done' : ''}`}
            >
              <span className="pz-summit-icon" aria-hidden="true">
                {summit.done ? '🏆' : '🌳'}
              </span>
              <b>
                {summit.done
                  ? summit.mine
                    ? '완주!'
                    : `${summit.nickname}님 완주!`
                  : summit.mine
                    ? '1층 통과!'
                    : `${summit.nickname}님 1층 통과!`}
              </b>
              <span className="pz-summit-time">{climbLabel(summit.ms)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ---- 채팅 ---- */}
      <div className="pz-chat">
        <div className="pz-log" ref={logRef}>
          {log.length === 0 ? (
            <div className="pz-log-empty">
              방향키(또는 WASD)로 움직이고, Enter 로 채팅해 보세요. SPACE 로 점프합니다.
              <br />
              위쪽 <b>문</b> 앞에서 <b>↑</b> 를 누르면 <b>인내의 숲</b>으로 갑니다 — 발판을 밟고
              정상까지 오르는 곳이에요.
              {myEmotes.length > 0 && (
                <>
                  <br />
                  {myEmotes.map((e, i) => `${i + 1} 번은 ${e.label}`).join(', ')} — 숫자키로 특수
                  동작을 할 수 있습니다.
                </>
              )}
            </div>
          ) : (
            log.map((l) => (
              <div
                key={l.msgId}
                className={`pz-log-line${l.mine ? ' is-mine' : ''}${l.system ? ' is-system' : ''}`}
              >
                <span className="pz-log-body">
                  {l.system ? l.text : <><b>{l.nickname}</b> {linkify(l.text)}</>}
                </span>
                <span className="pz-log-time">{chatTimeLabel(l.ts)}</span>
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

        {/* 관리자만 보이는 공지 입력칸 — 광장 위쪽에 크게 5초 뜬다 */}
        {isAdmin && (
          <div className="pz-chat-bar pz-notice-bar">
            <span className="pz-notice-tag">공지</span>
            <input
              type="text"
              className="pz-chat-input"
              placeholder={`모두에게 크게 띄울 공지 (${NOTICE_MS / 1000}초)`}
              maxLength={NOTICE_MAX}
              value={noticeDraft}
              onChange={(e) => setNoticeDraft(e.target.value)}
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
                  sendNotice();
                } else if (e.key === 'Escape') {
                  e.stopPropagation();
                  e.currentTarget.blur();
                }
              }}
            />
            <button type="button" className="pz-chat-send pz-notice-send" onClick={sendNotice}>
              공지 띄우기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
