'use client';

import { useEffect, useState } from 'react';

import Stylesheets from '@/components/Stylesheets';
import AvatarView from '@/components/minihome/avatar/AvatarView';
import { CATALOG, DEFAULT_PARTS, TABS, type AvatarParts, type Category } from '@/lib/avatar/parts';
import { showAlert } from '@/lib/ui/dialog';

const STORAGE_KEY = 'helloworld_avatar';

/** 아바타 꾸미기 — 실제 도트 파트 레이어(SPEC.md 규격). 저장은 우선 브라우저(localStorage). */
export default function AvatarEditPage() {
  const [parts, setParts] = useState<AvatarParts>(DEFAULT_PARTS);
  const [tab, setTab] = useState<Category>('hair');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setParts({ ...DEFAULT_PARTS, ...(JSON.parse(raw) as Partial<AvatarParts>) });
    } catch {
      /* 무시 */
    }
  }, []);

  const setPart = (key: Category, value: string) => setParts((p) => ({ ...p, [key]: value }));

  const randomize = () => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    setParts({
      hair: pick(CATALOG.hair).id,
      outfit: pick(CATALOG.outfit).id,
      eyes: pick(CATALOG.eyes).id,
    });
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
      void showAlert('아바타를 저장했어요! (프로토타입: 이 브라우저에 저장)');
    } catch {
      void showAlert('저장에 실패했어요.');
    }
  };

  return (
    <>
      <Stylesheets hrefs={['/resources/css/avatar.css']} />
      <div className="av-page">
        <h1 className="av-title">아바타 꾸미기</h1>

        <div className="av-stage">
          <div className="av-preview">
            <AvatarView parts={parts} width={200} />
          </div>

          <div className="av-controls">
            <div className="av-tabs">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={tab === t.key ? 'av-tab is-on' : 'av-tab'}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="av-options">
              {CATALOG[tab].map((opt) => {
                const preview: AvatarParts = { ...parts, [tab]: opt.id };
                const selected = parts[tab] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={selected ? 'av-option is-on' : 'av-option'}
                    onClick={() => setPart(tab, opt.id)}
                    title={opt.label}
                  >
                    <AvatarView parts={preview} width={56} />
                    <span className="av-option-label">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="av-actions">
              <button type="button" className="av-btn av-btn--ghost" onClick={randomize}>
                랜덤
              </button>
              <button type="button" className="av-btn" onClick={save}>
                저장
              </button>
            </div>
          </div>
        </div>

        <p className="av-note">
          실제 도트 파트를 레이어로 겹쳐 조합해요. 지금은 헤어·눈·의상 각 1종이고, 파트 이미지를
          폴더에 추가하면 계속 늘어납니다. 후드 속 얼굴 피부는 base(민머리·맨몸) 에셋이 들어오면
          채워집니다.
        </p>
      </div>
    </>
  );
}
