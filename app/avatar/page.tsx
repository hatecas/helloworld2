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
    // 카테고리가 늘어나도 여기를 고칠 필요가 없도록 카탈로그를 돌면서 뽑는다
    const next = { ...DEFAULT_PARTS };
    for (const key of Object.keys(CATALOG) as Category[]) {
      next[key] = pick(CATALOG[key]).id;
    }
    setParts(next);
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
          민머리·속옷 차림의 <b>base</b> 위에 눈·헤어·상의·하의·신발·모자·악세를 겹쳐 조합해요.
          모든 파트는 같은 512×768 캔버스에 제자리로 그린 투명 PNG 라 그냥 겹치면 정렬이 맞습니다.
          규격은 <code>public/resources/images/avatar/SPEC.md</code>, 새 파일을 넣은 뒤에는{' '}
          <code>node scripts/check-avatar-assets.mjs</code> 로 정렬을 확인하세요.
        </p>
      </div>
    </>
  );
}
