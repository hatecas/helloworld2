'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { skinBackgroundColor } from '@/lib/minihome-view';
import { showAlert } from '@/lib/ui/dialog';

interface ColorItem {
  productName: string;
  contentPath: string;
}

/**
 * views/miniHome/settingSkin.jsp + settingMenu.jsp
 * (두 화면이 클래스 이름만 다르고 구조가 같아 variant 로 합쳤다)
 */
export default function SettingColorClient({
  variant,
  applied,
  owned,
}: {
  variant: 'skin' | 'menu';
  applied: string;
  owned: ColorItem[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const prefix = variant === 'skin' ? 'skin' : 'menu';
  const label = variant === 'skin' ? '스킨' : '메뉴';

  const apply = async () => {
    if (!selected) {
      void showAlert(`적용할 ${label}을 선택해주세요.`);
      return;
    }
    try {
      const res = await fetch(variant === 'skin' ? '/mnHome/skinChoice' : '/mnHome/menuChoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedProductName: selected }),
      });
      const json = (await res.json()) as { resultCode?: string };
      if (json.resultCode === '1') {
        router.refresh();
      } else {
        void showAlert('잠시 후 다시 시도해주세요.');
      }
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
    }
  };

  const swatchStyle = (color: string, indent: boolean) => ({
    width: 200,
    height: 30,
    marginBottom: 10,
    ...(indent ? { marginLeft: 20 } : { marginRight: 5 }),
    border: '2px solid black',
    borderRadius: 5,
    backgroundColor: skinBackgroundColor(color),
  });

  return (
    <div className={`set-${prefix}-frame`}>
      <div className={`set-${prefix}-selected`}>
        <div className={`set-${prefix}-selected-span`}>
          <span>적용중인 {label}</span>
        </div>
        <div
          className={`set-${prefix}-selected-${prefix}`}
          id={`${prefix}-item-color-select`}
          style={swatchStyle(applied, false)}
        />
      </div>

      <div className={`set-${prefix}-having`}>
        <div className={`set-${prefix}-p`}>
          <p>보유중인 {label}</p>
        </div>
        <div className={`set-${prefix}-list`}>
          {owned.map((item) => (
            <div
              className={`${prefix}-item-group`}
              id={`${prefix}-item-group-select`}
              key={item.productName}
              onClick={() => setSelected(item.productName)}
            >
              <div
                className={`${prefix}-item-color`}
                data-product-name={item.productName}
                style={{
                  ...swatchStyle(item.contentPath, true),
                  outline: selected === item.productName ? '3px solid orange' : undefined,
                }}
              />
              <div className={`${prefix}-item-name`}>{item.productName}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`set-${prefix}-btn`}>
        <input
          type="button"
          className={`set-${prefix}-select apply-${prefix}-button`}
          value="적용"
          onClick={() => void apply()}
        />
      </div>
    </div>
  );
}
