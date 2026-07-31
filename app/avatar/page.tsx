'use client';

import { useEffect, useState } from 'react';

import Stylesheets from '@/components/Stylesheets';
import AvatarView from '@/components/minihome/avatar/AvatarView';
import { CATALOG, DEFAULT_PARTS, type AvatarParts, type Gender } from '@/lib/avatar/parts';
import { showAlert } from '@/lib/ui/dialog';

const STORAGE_KEY = 'helloworld_avatar';
const TABS: Array<{ key: 'hair' | 'bottom'; label: string }> = [
  { key: 'hair', label: '헤어' },
  { key: 'bottom', label: '하의' },
];

/** 아바타 꾸미기 (실제 LPC 도트 에셋). 저장은 우선 브라우저(localStorage). */
export default function AvatarEditPage() {
  const [parts, setParts] = useState<AvatarParts>(DEFAULT_PARTS);
  const [tab, setTab] = useState<'hair' | 'bottom'>('hair');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setParts({ ...DEFAULT_PARTS, ...(JSON.parse(raw) as Partial<AvatarParts>) });
    } catch {
      /* 무시 */
    }
  }, []);

  const setPart = <K extends keyof AvatarParts>(key: K, value: AvatarParts[K]) =>
    setParts((p) => ({ ...p, [key]: value }));

  const randomize = () => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    setParts({
      gender: pick(CATALOG.gender).id,
      hair: pick(CATALOG.hair).id,
      bottom: pick(CATALOG.bottom).id,
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
            <AvatarView parts={parts} size={200} />
          </div>

          <div className="av-controls">
            <div className="av-gender">
              {CATALOG.gender.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={parts.gender === g.id ? 'av-gender-btn is-on' : 'av-gender-btn'}
                  onClick={() => setPart('gender', g.id as Gender)}
                >
                  {g.label}
                </button>
              ))}
            </div>

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
                    <AvatarView parts={preview} size={56} />
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
          실제 픽셀아트(LPC) 에셋으로 만든 프로토타입이에요. 상의·신발·눈·악세사리 등 파트는
          정렬 포맷을 맞춰 계속 추가하고, 저장·프로필/광장 연동도 다음 단계에서 붙입니다.
        </p>
      </div>
    </>
  );
}
