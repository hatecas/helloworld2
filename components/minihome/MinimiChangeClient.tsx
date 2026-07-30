'use client';

import { useRef, useState } from 'react';
import { showAlert } from '@/lib/ui/dialog';

/** views/miniHome/mnhMinimiChange.jsp — 보유 미니미 중 대표 미니미 하나를 고른다 */
export default function MinimiChangeClient({
  items,
}: {
  items: Array<{ productName: string; contentPath: string; allocation: 0 | 1 }>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selected, setSelected] = useState<string | null>(
    items.find((i) => i.allocation === 1)?.productName ?? null,
  );

  return (
    <div className="mnm-frame">
      <form id="mnmForm" ref={formRef} action="/mnHome/mnhMinimiChangeAction" method="POST">
        <div className="mnm-change">
          {items.map((item) => (
            <div
              className="mnm-change-group"
              key={item.productName}
              style={{
                border: `2px solid ${selected === item.productName ? 'red' : 'orange'}`,
                borderRadius: 5,
              }}
              onClick={() => setSelected(item.productName)}
            >
              <img src={item.contentPath} className="mnm-change-img" alt={item.productName} />
              <p className="mnm-change-p">{item.productName}</p>
              <input
                type="checkbox"
                className="mnm-ckbox"
                checked={selected === item.productName}
                onChange={() => setSelected(item.productName)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>

        <input type="hidden" name="selectedUserStorage" value={selected ?? ''} readOnly />

        <div className="mnm-change-btn-group">
          <input
            type="button"
            className="mnm-change-btn-cancle"
            id="cancel"
            value="취소"
            onClick={() => window.close()}
          />
          <input
            type="button"
            className="mnm-change-btn-choice"
            id="choice"
            value="적용"
            onClick={() => {
              if (!selected) {
                void showAlert('미니미를 선택해주세요.');
                return;
              }
              formRef.current?.submit();
            }}
          />
        </div>
      </form>
    </div>
  );
}
