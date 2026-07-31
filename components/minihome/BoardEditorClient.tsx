'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import RichTextEditor, { type RichTextEditorHandle } from '@/components/minihome/RichTextEditor';
import { showAlert } from '@/lib/ui/dialog';

/**
 * views/miniHome/boardWrite.jsp + boardModify.jsp
 * (resources/js/boardWrite.js 의 writeBoard / board.js 의 modifyBoard)
 */
export default function BoardEditorClient({
  mode,
  userNickname,
  userName,
  seq,
  title: initialTitle = '',
  content: initialContent = '',
}: {
  mode: 'write' | 'modify';
  userNickname: string;
  userName: string;
  seq?: number;
  title?: string;
  content?: string;
}) {
  const router = useRouter();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [title, setTitle] = useState(initialTitle);

  const today = new Date();
  const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const submit = async () => {
    if (!title.trim()) {
      void showAlert('제목을 입력하여 주세요.');
      return;
    }
    const content = (editorRef.current?.getContent() ?? '').replace(/\r\n/g, '');
    if (!content.trim() || content === '<p>&nbsp;</p>') {
      void showAlert('내용을 입력하여 주세요.');
      return;
    }

    try {
      const res = await fetch(mode === 'write' ? '/mnHome/boardWrite' : '/mnHome/boardModify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userNickname, title, seq }),
      });
      const json = (await res.json()) as { resultCode: string };
      if (json.resultCode === '1') {
        await showAlert('저장되었습니다.');
        router.push(`/mnHome/boardView/${userNickname}`);
        router.refresh();
      } else {
        void showAlert('잠시 후 다시 시도해주세요.');
      }
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="board-overflow">
      <div className="write-card">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          className="write-title"
          maxLength={30}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="write-meta">
          <span className="write-writer">{userName}</span>
          <span className="write-date">
            <span className="write-date-label">작성일</span>
            <span className="write-date-input">{formattedToday}</span>
          </span>
        </div>
      </div>

      <RichTextEditor ref={editorRef} id="txtContent" defaultValue={initialContent} />

      <div className="btn-container">
        <div className="btn-left" />
        <div className="btn-right">
          <input
            className="btn-boardlist"
            type="button"
            id="btnBoardView"
            value="목록"
            onClick={() => router.push(`/mnHome/boardView/${userNickname}`)}
          />
          <input
            className="btn-write"
            type="button"
            id={mode === 'write' ? 'btnBoardWrite' : 'btnBoardModify'}
            value="등록"
            onClick={() => void submit()}
          />
        </div>
      </div>
    </div>
  );
}
