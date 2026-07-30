'use client';

/**
 * 팝업 창(프로필 수정 · 미니미 설정 · 미니룸 설정 · 프로필 히스토리)의 결과 화면.
 *
 * 예전에는 화면마다 마크업이 제각각이었고, 업로드 성공 화면은 확인 버튼이
 * 3초 동안 비활성이라 실제보다 훨씬 느리게 느껴졌다. 그 지연을 없애고
 * 모든 결과 화면을 같은 모양으로 통일했다.
 */
export default function PopupResult({
  text,
  sub,
  tone = 'success',
  notifyOpener = false,
  confirmText = '확인',
}: {
  text: string;
  sub?: string;
  tone?: 'success' | 'fail';
  /** 확인 시 부모 창(미니홈피)을 새로고침한다 */
  notifyOpener?: boolean;
  confirmText?: string;
}) {
  const closeWindow = () => {
    const opener = window.opener as (Window & { onChildButtonClick?: () => void }) | null;
    if (notifyOpener && opener && !opener.closed) {
      opener.onChildButtonClick?.();
    }
    window.close();
  };

  return (
    <div className="hw-result">
      <div className="hw-result-card">
        <div className={tone === 'fail' ? 'hw-result-icon fail' : 'hw-result-icon'} aria-hidden="true">
          {tone === 'fail' ? '!' : '✓'}
        </div>
        <div className="hw-result-text">{text}</div>
        {sub && <div className="hw-result-sub">{sub}</div>}
        <button type="button" className="hw-result-btn" autoFocus onClick={closeWindow}>
          {confirmText}
        </button>
      </div>
    </div>
  );
}
