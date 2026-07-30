'use client';

import { createRoot, type Root } from 'react-dom/client';

/**
 * 프로젝트 디자인으로 통일한 알림 / 확인 창.
 *
 * 구 코드는 window.alert() · window.confirm() 를 그대로 썼는데 브라우저마다
 * 생김새가 달라 화면과 따로 놀았다. 같은 모양의 모달로 대체한다.
 *
 * Provider 없이 아무 클라이언트 컴포넌트에서나 부를 수 있도록
 * 필요할 때 DOM 에 붙였다 떼는 방식으로 만들었다.
 */

type Variant = 'info' | 'ask' | 'warn';

interface Options {
  confirmText?: string;
  cancelText?: string;
  variant?: Variant;
  danger?: boolean;
}

const ICON: Record<Variant, string> = {
  info: '!',
  ask: '?',
  warn: '!',
};

function mount(render: (close: () => void) => React.ReactElement): () => void {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root: Root = createRoot(host);

  const close = () => {
    // unmount 는 렌더 사이클 밖에서 호출해야 한다
    window.setTimeout(() => {
      root.unmount();
      host.remove();
    }, 0);
  };

  root.render(render(close));
  return close;
}

function Dialog({
  message,
  variant,
  confirmText,
  cancelText,
  danger,
  onResolve,
}: {
  message: string;
  variant: Variant;
  confirmText: string;
  cancelText?: string;
  danger?: boolean;
  onResolve: (value: boolean) => void;
}) {
  return (
    <div
      className="hw-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        // 바깥을 누르면 취소로 본다 (확인창일 때만)
        if (e.target === e.currentTarget && cancelText) onResolve(false);
      }}
    >
      <div className="hw-dialog">
        <div className="hw-dialog-body">
          <div className={`hw-dialog-icon ${variant}`} aria-hidden="true">
            {ICON[variant]}
          </div>
          <div className="hw-dialog-message">{message}</div>
        </div>
        <div className="hw-dialog-actions">
          {cancelText && (
            <button
              type="button"
              className="hw-dialog-btn ghost"
              onClick={() => onResolve(false)}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className={`hw-dialog-btn ${danger ? 'danger' : 'primary'}`}
            autoFocus
            onClick={() => onResolve(true)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/** window.alert 대체 */
export function showAlert(message: string, options: Options = {}): Promise<void> {
  return new Promise((resolve) => {
    const close = mount((dismiss) => (
      <Dialog
        message={message}
        variant={options.variant ?? 'info'}
        confirmText={options.confirmText ?? '확인'}
        onResolve={() => {
          dismiss();
          resolve();
        }}
      />
    ));
    // 렌더 직후 close 참조가 필요 없으면 그대로 둔다
    void close;
  });
}

/** window.confirm 대체 */
export function showConfirm(message: string, options: Options = {}): Promise<boolean> {
  return new Promise((resolve) => {
    mount((dismiss) => (
      <Dialog
        message={message}
        variant={options.variant ?? 'ask'}
        confirmText={options.confirmText ?? '확인'}
        cancelText={options.cancelText ?? '취소'}
        danger={options.danger}
        onResolve={(value) => {
          dismiss();
          resolve(value);
        }}
      />
    ));
  });
}
