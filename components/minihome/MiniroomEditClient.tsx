'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { showAlert } from '@/lib/ui/dialog';

const BACKGROUNDS = [
  '/resources/images/miniroom/aquariumBg.png',
  '/resources/images/miniroom/cursedtempleBg.png',
  '/resources/images/miniroom/ludibriumBg.png',
  '/resources/images/miniroom/orbisBg.png',
];

const MAX_MINIMI = 5;

interface PlacedMinimi {
  id: number;
  src: string;
  left: number;
  top: number;
}

/** 파일 경로에서 확장자 없는 이름만 (구 miniroomEditor.js 가 하던 것) */
function baseName(src: string): string {
  return src.split('/').pop()?.split('.')[0] ?? '';
}

/** views/miniHome/miniroomEdit.jsp + resources/js/miniroomEditor.js */
export default function MiniroomEditClient({ minimi }: { minimi: string[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const [background, setBackground] = useState<string | null>(null);
  const [placed, setPlaced] = useState<PlacedMinimi[]>([]);
  const [dragging, setDragging] = useState<{ id: number; offsetX: number; offsetY: number } | null>(
    null,
  );
  const nextId = useRef(1);

  const addMinimi = (src: string) => {
    if (placed.length >= MAX_MINIMI) {
      void showAlert(`미니미는 최대 ${MAX_MINIMI}개까지만 추가할 수 있습니다.`);
      return;
    }
    setPlaced((prev) => [...prev, { id: nextId.current++, src, left: 0, top: 0 }]);
  };

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!dragging || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      const newX = Math.max(0, Math.min(e.clientX - rect.left - dragging.offsetX, rect.width - 100));
      const newY = Math.max(0, Math.min(e.clientY - rect.top - dragging.offsetY, rect.height - 120));

      setPlaced((prev) =>
        prev.map((m) => (m.id === dragging.id ? { ...m, left: newX, top: newY } : m)),
      );
    },
    [dragging],
  );

  useEffect(() => {
    if (!dragging) return;
    const onUp = () => setDragging(null);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [dragging, onMouseMove]);

  const confirmEdit = () => {
    if (!background) {
      void showAlert('배경을 선택해 주세요.');
      return;
    }
    formRef.current?.submit();
  };

  return (
    <>
      <div className="section-over">
        <div className="section1">
          <div className="miniroom-title">미니룸 배경</div>
          <div
            className="div-canvas"
            id="div-canvas"
            ref={canvasRef}
            style={
              background
                ? { background: `url(${background}) no-repeat center / 100% 100%` }
                : undefined
            }
          >
            {placed.map((m) => (
              <div
                key={m.id}
                className="minimiContainer"
                style={{
                  width: 100,
                  height: 100,
                  position: 'absolute',
                  left: m.left,
                  top: m.top,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDragging({
                    id: m.id,
                    offsetX: e.clientX - rect.left,
                    offsetY: e.clientY - rect.top,
                  });
                }}
              >
                <div className="btnContainer" style={{ width: 100, height: 20 }}>
                  <button
                    className="minimiBtnDelete"
                    style={{ width: 20, height: 20 }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => setPlaced((prev) => prev.filter((p) => p.id !== m.id))}
                  >
                    X
                  </button>
                </div>
                <img className="minimi" style={{ width: 100, height: 100 }} src={m.src} alt="" />
              </div>
            ))}
          </div>
        </div>

        <div className="section2">
          <div className="background-title">배경 목록</div>
          <div className="mnr-bg">
            {BACKGROUNDS.map((src) => (
              <img key={src} src={src} alt="" onClick={() => setBackground(src)} />
            ))}
          </div>
        </div>
      </div>

      <div className="section-under">
        <div className="section3">
          <div className="minimi-title">미니미</div>
          <div className="minimiImg">
            {minimi.map((src) => (
              <img key={src} src={src} alt="" onClick={() => addMinimi(src)} />
            ))}
          </div>
        </div>
      </div>

      <div className="button-section">
        <form id="minimiForm" ref={formRef} action="/mnHome/miniroomSave" method="post">
          <input type="hidden" name="backgroundName" value={background ? baseName(background) : ''} readOnly />
          {placed.map((m, index) => (
            <span key={m.id}>
              <input type="hidden" name={`minimiName${index}`} value={baseName(m.src)} readOnly />
              <input type="hidden" name={`minimiLeft${index}`} value={`${m.left}px`} readOnly />
              <input type="hidden" name={`minimiTop${index}`} value={`${m.top}px`} readOnly />
            </span>
          ))}
          <input type="button" className="btn-confirm" value="적용" onClick={confirmEdit} />
          <input
            type="button"
            className="btn-cancel"
            value="취소"
            onClick={() => window.close()}
          />
        </form>
      </div>
    </>
  );
}
