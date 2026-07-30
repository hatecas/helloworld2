'use client';

import { useState } from 'react';
import { showAlert } from '@/lib/ui/dialog';

/**
 * 미니홈피 상단 제목 줄 + 제목 수정 (구 resources/js/default.js 의 #btn-title-edit / #btn-title-save)
 */
export default function ContentTitle({
  userNickname,
  title: initialTitle,
  isOwner,
}: {
  userNickname: string;
  title: string;
  isOwner: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [draft, setDraft] = useState(initialTitle);
  const [editing, setEditing] = useState(false);

  const save = async () => {
    try {
      const res = await fetch('/mnHome/titleUpdate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draft, userNickname }),
      });
      const data = (await res.json()) as { msg?: string };
      if (data.msg === '성공') {
        setTitle(draft);
      } else {
        throw new Error(data.msg ?? 'fail');
      }
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
      setDraft(title);
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="header content-title">
      <div
        id="divHomeTitle"
        className="content-title-name"
        style={{ display: editing ? 'none' : 'block' }}
      >
        {title}
      </div>
      <input
        id="newTitle"
        className="content-title-name"
        type={editing ? 'text' : 'hidden'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <input id="hiddenUserNickname" type="hidden" value={userNickname} readOnly />

      {isOwner && (
        <div>
          <input
            type={editing ? 'hidden' : 'button'}
            id="btn-title-edit"
            className="btn-edit"
            value="수정"
            onClick={() => {
              setDraft(title);
              setEditing(true);
            }}
          />
          <input
            type={editing ? 'button' : 'hidden'}
            id="btn-title-save"
            className="btn-edit"
            value="저장"
            onClick={() => void save()}
          />
        </div>
      )}

      <div className="content-title-url">
        http://corehelloworld.shop/mnHome/mainView/{userNickname}
      </div>
    </div>
  );
}
