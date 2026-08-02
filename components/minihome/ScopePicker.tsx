'use client';

import { SCOPE_OPTIONS, type Scope } from '@/lib/db/visibility';

/**
 * 공개범위 선택 (전체공개 / 일촌공개 / 나만보기).
 *
 * 예전엔 다이어리·사진첩이 같은 마크업을 각자 복사해 두 가지(전체공개/비공개)만
 * 골랐다. 게시판·방명록까지 같은 UI 를 쓰도록 한 곳으로 모았다.
 */
export default function ScopePicker({
  value,
  onChange,
  label = '공개설정',
  compact = false,
}: {
  value: Scope;
  onChange: (next: Scope) => void;
  label?: string;
  /** 방명록처럼 좁은 자리에 들어갈 때 */
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'write-scope write-scope--compact' : 'write-scope'}>
      <span className="write-scope-label">{label}</span>
      <div className="scope-toggle" role="radiogroup" aria-label={label}>
        {SCOPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            title={opt.hint}
            className={value === opt.value ? 'scope-opt is-on' : 'scope-opt'}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
