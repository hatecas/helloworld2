'use client';

import { useEffect, useState } from 'react';

import Stylesheets from '@/components/Stylesheets';
import AvatarView from '@/components/minihome/avatar/AvatarView';
import { CATALOG, DEFAULT_PARTS, type AvatarParts, type Gender } from '@/lib/avatar/parts';
import { showAlert } from '@/lib/ui/dialog';

const STORAGE_KEY = 'helloworld_avatar';
const TABS: Array<{ key: 'eyes' | 'hair' | 'top' | 'acc'; label: string }> = [
  { key: 'eyes', label: '눈' },
  { key: 'hair', label: '헤어' },
  { key: 'top', label: '옷' },
  { key: 'acc', label: '악세사리' },
];

/** 도트 감성 아바타 꾸미기 (프로토타입). 저장은 우선 브라우저(localStorage). */
export default function AvatarEditPage() {
  const [parts, setParts] = useState<AvatarParts>(DEFAULT_PARTS);
  const [tab, setTab] = useState<'eyes' | 'hair' | 'top' | 'acc'>('hair');

  // 저장해 둔 아바타가 있으면 불러온다
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
      eyes: pick(CATALOG.eyes).id,
      hair: pick(CATALOG.hair).id,
      top: pick(CATALOG.top).id,
      acc: pick(CATALOG.acc).id,
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
          {/* 미리보기 */}
          <div className="av-preview">
            <AvatarView parts={parts} size={168} />
          </div>

          {/* 컨트롤 */}
          <div className="av-controls">
            {/* 성별(기본 프리셋) */}
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

            {/* 카테고리 탭 */}
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

            {/* 선택지 (미니 미리보기로 표시) */}
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
                    <AvatarView parts={preview} size={48} />
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
          도트 예시 프로토타입이에요. 파트를 실제 도트 이미지로 교체하고, 저장·프로필/광장 연동은
          다음 단계에서 붙입니다.
        </p>
      </div>
    </>
  );
}
