'use client';

import { useEffect, useRef, useState } from 'react';

import { kstTodayParts } from '@/lib/db/format';

/**
 * 미니홈피 달력.
 *
 * 예전엔 CDN 의 jQuery UI datepicker(2010년대 디자인)를 불러 썼는데,
 * 외부 의존성을 없애고 사이트 톤에 맞춘 현대식 달력으로 새로 그렸다.
 *
 * props 는 구 JqueryDatePicker 와 동일해서 그대로 갈아끼울 수 있다.
 *  - inline=true  : 항상 펼쳐진 달력 (다이어리 조회 좌측)
 *  - inline=false : 클릭하면 열리는 팝업 (다이어리 작성 화면)
 */

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export default function Calendar({
  id,
  inline,
  onSelect,
}: {
  id: string;
  inline: boolean;
  onSelect: (isoDate: string) => void;
}) {
  // '오늘' 은 한국 시간 기준. (서버는 UTC 라 로컬 Date 로 잡으면 SSR/CSR 이 어긋난다)
  const today = kstTodayParts();
  const [view, setView] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 팝업 모드: 바깥을 클릭하면 닫는다
  useEffect(() => {
    if (inline || !open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [inline, open]);

  const { year, month } = view;
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const moveMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const pick = (day: number) => {
    const iso = toIso(year, month, day);
    setSelected(iso);
    onSelect(iso);
    if (!inline) setOpen(false);
  };

  const isToday = (day: number) =>
    year === today.year && month === today.month && day === today.day;

  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const grid = (
    <div className="cal" role="group" aria-label="달력">
      <div className="cal-header">
        <button type="button" className="cal-nav" onClick={() => moveMonth(-1)} aria-label="이전 달">
          ‹
        </button>
        <span className="cal-title">
          {year}년 {month + 1}월
        </span>
        <button type="button" className="cal-nav" onClick={() => moveMonth(1)} aria-label="다음 달">
          ›
        </button>
      </div>

      <div className="cal-weekdays">
        {WEEKDAYS.map((w, i) => (
          <span
            key={w}
            className={i === 0 ? 'cal-weekday cal-sun' : i === 6 ? 'cal-weekday cal-sat' : 'cal-weekday'}
          >
            {w}
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} className="cal-cell cal-empty" />;
          const iso = toIso(year, month, day);
          const dow = (firstWeekday + day - 1) % 7;
          const classes = ['cal-cell', 'cal-day'];
          if (iso === selected) classes.push('cal-selected');
          if (isToday(day)) classes.push('cal-today');
          if (dow === 0) classes.push('cal-sun');
          if (dow === 6) classes.push('cal-sat');
          return (
            <button type="button" key={iso} className={classes.join(' ')} onClick={() => pick(day)}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (inline) {
    return (
      <div id={id} ref={rootRef} className="cal-inline">
        {grid}
      </div>
    );
  }

  return (
    <div id={id} ref={rootRef} className="cal-popup-wrap">
      <input
        type="text"
        className="cal-input"
        value={selected ?? ''}
        placeholder="날짜 선택"
        readOnly
        onClick={() => setOpen((v) => !v)}
      />
      {open && <div className="cal-popup">{grid}</div>}
    </div>
  );
}
