'use client';

/** 도토리 충전 / BGM 구매 결과 화면 — 팝업 결과 화면과 같은 디자인을 쓴다 */
export default function PurchaseResult({ reason }: { reason?: string }) {
  const closeWindow = () => {
    if (window.opener && !window.opener.closed) {
      window.opener.location.reload();
    }
    window.close();
  };

  const failed = reason != null;

  return (
    <div className="hw-result">
      <div className="hw-result-card">
        <div className={failed ? 'hw-result-icon fail' : 'hw-result-icon'} aria-hidden="true">
          {failed ? '!' : '✓'}
        </div>
        <div className="hw-result-text">
          {failed ? '구입에 실패하였습니다' : '구입이 완료되었습니다'}
        </div>
        {failed && reason.trim() !== '' && <div className="hw-result-sub">{reason}</div>}
        <button type="button" className="hw-result-btn" autoFocus onClick={closeWindow}>
          확인
        </button>
      </div>
    </div>
  );
}
