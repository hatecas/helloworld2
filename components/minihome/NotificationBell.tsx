'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface NotiItem {
  id: string;
  type: string;
  actor: string;
  text: string;
  dateLabel: string;
  link: string;
  unread: boolean;
}

const ICON: Record<string, string> = {
  board: '📝',
  album: '📷',
  diary: '📔',
  guestbook: '📖',
  friendcmt: '💬',
  friend: '🤝',
};

/** 미니홈피 우측 상단 알림 벨 — 안 읽은 알림이 있으면 빨간 점, 모두 읽으면 사라진다. */
export default function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<NotiItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/mnHome/notifications', { cache: 'no-store' });
      const json = (await res.json()) as { items: NotiItem[]; unread: number };
      setItems(json.items ?? []);
      setUnread(json.unread ?? 0);
    } catch {
      // 조용히 무시 (다음 폴링에서 재시도)
    }
  }, []);

  // 최초 + 60초마다 갱신
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const markAllRead = async () => {
    try {
      await fetch('/api/mnHome/notifications', { method: 'POST' });
      setUnread(0);
      setItems((prev) => prev.map((it) => ({ ...it, unread: false })));
    } catch {
      // 무시
    }
  };

  const go = (link: string) => {
    setOpen(false);
    router.push(link);
  };

  return (
    <div className="noti" ref={rootRef}>
      <button
        type="button"
        className="noti-bell"
        aria-label="알림"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && <span className="noti-dot">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="noti-panel">
          <div className="noti-panel-head">
            <span className="noti-panel-title">알림</span>
            {unread > 0 && (
              <button type="button" className="noti-readall" onClick={() => void markAllRead()}>
                모두 읽음
              </button>
            )}
          </div>

          <div className="noti-list">
            {items.length === 0 ? (
              <div className="noti-empty">새로운 알림이 없어요</div>
            ) : (
              items.map((it) => (
                <button
                  type="button"
                  key={it.id}
                  className={it.unread ? 'noti-item is-unread' : 'noti-item'}
                  onClick={() => go(it.link)}
                >
                  <span className="noti-item-icon" aria-hidden="true">
                    {ICON[it.type] ?? '🔔'}
                  </span>
                  <span className="noti-item-body">
                    <span className="noti-item-text">{it.text}</span>
                    <span className="noti-item-date">{it.dateLabel}</span>
                  </span>
                  {it.unread && <span className="noti-item-dot" aria-hidden="true" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
