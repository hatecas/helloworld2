'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

/**
 * 구 resources/js/datePicker.js 의 jQuery UI 달력.
 *
 * 다이어리 화면의 좌측 달력은 jQuery UI datepicker 그대로가 디자인이라
 * (css/minihome/jquery-ui(1.13.2).css 가 그 마크업을 스타일링한다) 원본을 유지했다.
 * 스크립트를 못 불러오면 기본 <input type="date"> 로 자동 대체된다.
 */

type JQueryLike = ((selector: unknown) => {
  datepicker: (options?: Record<string, unknown>) => void;
}) & {
  datepicker?: { setDefaults: (options: Record<string, unknown>) => void };
};

const KO_DEFAULTS: Record<string, unknown> = {
  dateFormat: 'yymmdd',
  prevText: '이전 달',
  nextText: '다음 달',
  monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  dayNames: ['일', '월', '화', '수', '목', '금', '토'],
  dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
  dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
  showMonthAfterYear: true,
  yearSuffix: '년',
};

/** yymmdd(=YYYYMMDD) 를 YYYY-MM-DD 로 */
function toIsoDate(value: string): string {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

export default function JqueryDatePicker({
  id,
  inline,
  onSelect,
}: {
  id: string;
  /** true 면 달력을 항상 펼쳐 둔다 (다이어리 조회 화면) */
  inline: boolean;
  onSelect: (isoDate: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // 콜백이 바뀌어도 datepicker 를 다시 만들지 않도록 ref 에 담아 둔다
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!ready) return;
    const jq = (window as unknown as { jQuery?: JQueryLike }).jQuery;
    const target = inline ? containerRef.current : inputRef.current;
    if (!jq || !jq.datepicker || !target) {
      setFailed(true);
      return;
    }

    jq.datepicker.setDefaults(KO_DEFAULTS);
    jq(target).datepicker({
      onSelect: (dateText: string) => onSelectRef.current(toIsoDate(dateText)),
    });
  }, [ready, inline]);

  return (
    <>
      {!failed && (
        <>
          <Script
            src="/resources/js/jquery-3.7.1.min.js"
            strategy="afterInteractive"
            onError={() => setFailed(true)}
          />
          <Script
            src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js"
            strategy="afterInteractive"
            onReady={() => setReady(true)}
            onError={() => setFailed(true)}
          />
        </>
      )}

      {inline ? (
        // jQuery UI 가 이 div 안을 통째로 그리므로 React 는 건드리지 않는다
        <div id={id} ref={containerRef} suppressHydrationWarning>
          {failed && (
            <input
              type="date"
              onChange={(e) => {
                if (e.target.value) onSelectRef.current(e.target.value);
              }}
            />
          )}
        </div>
      ) : failed ? (
        <input
          type="date"
          id={id}
          onChange={(e) => {
            if (e.target.value) onSelectRef.current(e.target.value);
          }}
        />
      ) : (
        <input type="text" id={id} ref={inputRef} readOnly />
      )}
    </>
  );
}
