'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import RichTextEditor, { type RichTextEditorHandle } from '@/components/minihome/RichTextEditor';
import ScopePicker from '@/components/minihome/ScopePicker';
import type { Scope } from '@/lib/db/visibility';
import Calendar from '@/components/minihome/Calendar';
import { showAlert } from '@/lib/ui/dialog';

/** views/miniHome/diaryWrite.jsp + diaryModify.jsp (resources/js/diary.js) */
export default function DiaryEditorClient({
  mode,
  userNickname,
  userName,
  seq,
  title: initialTitle = '',
  content: initialContent = '',
  diaryDate: initialDate = '',
  openScope: initialScope = 1,
}: {
  mode: 'write' | 'modify';
  userNickname: string;
  userName: string;
  seq?: number;
  title?: string;
  content?: string;
  diaryDate?: string;
  openScope?: Scope;
}) {
  const router = useRouter();
  const editorRef = useRef<RichTextEditorHandle>(null);

  const [title, setTitle] = useState(initialTitle);
  const [diaryDate, setDiaryDate] = useState(initialDate);
  const [visibility, setVisibility] = useState<Scope>(initialScope);

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
    if (mode === 'write' && diaryDate.length < 10) {
      void showAlert('작성일을 선택해주세요.');
      return;
    }

    try {
      const res = await fetch(mode === 'write' ? '/mnHome/diaryAdd' : '/mnHome/diaryModify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          userNickname,
          title,
          seq,
          diary_date: diaryDate,
          visibility,
        }),
      });
      const json = (await res.json()) as { resultCode: string };

      if (json.resultCode === '1') {
        await showAlert(mode === 'write' ? '등록되었습니다.' : '저장했습니다.');
        router.push(`/mnHome/diaryView/${userNickname}`);
        router.refresh();
      } else if (json.resultCode === '-1') {
        void showAlert('작성된 일기가 존재합니다. 다른 날짜를 선택해주세요.');
      } else {
        void showAlert(
          mode === 'write'
            ? '다이어리 작성에 실패했습니다. 다시 시도해주세요.'
            : '저장에 실패했습니다. 다시 시도해주세요.',
        );
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
          id="diaryTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="write-meta">
          <span className="write-writer">{userName}</span>
          <span className="write-date">
            <span className="write-date-label">작성일</span>
            {mode === 'write' ? (
              <Calendar id="datepicker2" inline={false} onSelect={setDiaryDate} />
            ) : (
              <input className="write-date-input" type="text" id="datepicker2" value={diaryDate} readOnly />
            )}
          </span>
        </div>
      </div>

      <RichTextEditor ref={editorRef} id="txtContent" defaultValue={initialContent} />

      <ScopePicker value={visibility} onChange={setVisibility} />

      <div className="btn-container">
        <div className="btn-left">
          <input
            className="btn-diarylist"
            type="button"
            id="btnBoardView"
            value="목록"
            onClick={() => router.push(`/mnHome/diaryView/${userNickname}`)}
          />
        </div>
        <div className="btn-right">
          <input
            className="btn-write"
            type="button"
            id="btnBoardWrite"
            value={mode === 'write' ? '글쓰기' : '저장'}
            onClick={() => void submit()}
          />
        </div>
      </div>
    </div>
  );
}
