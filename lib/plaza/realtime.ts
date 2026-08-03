'use client';

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

import {
  CHANNEL,
  type ChatMsg,
  type ClaimMsg,
  type EmoteMsg,
  type HelloMsg,
  type NoticeMsg,
  type PosMsg,
  type SummitMsg,
} from './protocol';

/**
 * 광장 실시간 전송 계층.
 *
 * Supabase Realtime 채널 하나를 열고 presence(누가 있는지) + broadcast(좌표·채팅)를 다룬다.
 * 화면(PlazaClient)은 이 인터페이스만 보므로, 나중에 전송 수단을 바꿔도 화면은 그대로다.
 */

export interface PlazaHandlers {
  /**
   * presence 로 파악한 현재 접속자가 바뀔 때 — id → 닉네임.
   *
   * 닉네임까지 주는 이유: 나간 사람을 알릴 때 쓴다. 좌표를 한 번도 보내지 않고
   * 바로 나간 사람은 화면이 닉네임을 모르는데, presence 에는 처음부터 실려 있다.
   */
  onRoster: (roster: Map<string, string>) => void;
  onPos: (msg: PosMsg) => void;
  onChat: (msg: ChatMsg) => void;
  /** 누군가 특수 동작을 했다 */
  onEmote: (msg: EmoteMsg) => void;
  /** 누군가 인내의 숲 정상에 올랐다 (기록을 같이 보며 경쟁하는 맛) */
  onSummit: (msg: SummitMsg) => void;
  /** 관리자 공지 — 보낸 사람이 정말 관리자인지는 화면에서 확인한다 */
  onNotice: (msg: NoticeMsg) => void;
  /** 새로 들어온 사람이 인사하면 — 내 좌표를 한 번 쏴 주라는 신호 */
  onHello: (msg: HelloMsg) => void;
  /** 같은 닉네임이 다른 곳에서 접속했다 — 이 창은 물러나야 한다 */
  onClaim: (msg: ClaimMsg) => void;
  onStatus: (status: PlazaStatus) => void;
}

export type PlazaStatus = 'connecting' | 'online' | 'offline' | 'unconfigured';

export interface PlazaConnection {
  sendPos: (msg: PosMsg) => void;
  sendChat: (msg: ChatMsg) => void;
  sendEmote: (msg: EmoteMsg) => void;
  sendHello: (msg: HelloMsg) => void;
  sendClaim: (msg: ClaimMsg) => void;
  sendSummit: (msg: SummitMsg) => void;
  sendNotice: (msg: NoticeMsg) => void;
  leave: () => void;
}

/**
 * 광장 채널에 접속한다.
 * url/anonKey 가 없으면 접속하지 않고 'unconfigured' 만 알린다 (혼자 걸어다니는 상태).
 */
export async function joinPlaza(
  url: string,
  anonKey: string,
  me: { id: string; nickname: string; minimi: string },
  handlers: PlazaHandlers,
): Promise<PlazaConnection> {
  const noop: PlazaConnection = {
    sendPos: () => {},
    sendChat: () => {},
    sendEmote: () => {},
    sendHello: () => {},
    sendClaim: () => {},
    sendSummit: () => {},
    sendNotice: () => {},
    leave: () => {},
  };

  if (!url || !anonKey) {
    handlers.onStatus('unconfigured');
    return noop;
  }

  handlers.onStatus('connecting');

  let client: SupabaseClient;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    client = createClient(url, anonKey, {
      auth: { persistSession: false },
      // 좌표를 초당 여러 번 보내므로 기본값(10)보다 넉넉하게
      realtime: { params: { eventsPerSecond: 30 } },
    });
  } catch {
    handlers.onStatus('offline');
    return noop;
  }

  const channel: RealtimeChannel = client.channel(CHANNEL, {
    config: {
      // 내가 보낸 건 이미 화면에 그렸으니 되돌려받지 않는다
      broadcast: { self: false },
      presence: { key: me.id },
    },
  });

  const pushRoster = () => {
    const state = channel.presenceState<{ nickname?: string }>();
    const roster = new Map<string, string>();
    for (const [id, entries] of Object.entries(state)) {
      roster.set(id, entries[0]?.nickname ?? '');
    }
    handlers.onRoster(roster);
  };

  channel
    .on('presence', { event: 'sync' }, pushRoster)
    .on('presence', { event: 'join' }, pushRoster)
    .on('presence', { event: 'leave' }, pushRoster)
    .on('broadcast', { event: 'pos' }, ({ payload }) => handlers.onPos(payload as PosMsg))
    .on('broadcast', { event: 'chat' }, ({ payload }) => handlers.onChat(payload as ChatMsg))
    .on('broadcast', { event: 'emote' }, ({ payload }) => handlers.onEmote(payload as EmoteMsg))
    .on('broadcast', { event: 'hello' }, ({ payload }) => handlers.onHello(payload as HelloMsg))
    .on('broadcast', { event: 'claim' }, ({ payload }) => handlers.onClaim(payload as ClaimMsg))
    .on('broadcast', { event: 'summit' }, ({ payload }) => handlers.onSummit(payload as SummitMsg))
    .on('broadcast', { event: 'notice' }, ({ payload }) => handlers.onNotice(payload as NoticeMsg));

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      handlers.onStatus('online');
      void channel.track({ nickname: me.nickname, minimi: me.minimi });
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      handlers.onStatus('offline');
    }
  });

  const send = (event: string, payload: unknown) => {
    void channel.send({ type: 'broadcast', event, payload });
  };

  return {
    sendPos: (msg) => send('pos', msg),
    sendChat: (msg) => send('chat', msg),
    sendEmote: (msg) => send('emote', msg),
    sendHello: (msg) => send('hello', msg),
    sendClaim: (msg) => send('claim', msg),
    sendSummit: (msg) => send('summit', msg),
    sendNotice: (msg) => send('notice', msg),
    leave: () => {
      void channel.unsubscribe();
      void client.removeAllChannels();
    },
  };
}
