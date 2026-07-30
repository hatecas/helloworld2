'use client';

import { useRef, useState } from 'react';

import SmartEditor, { type SmartEditorHandle } from '@/components/SmartEditor';
import { showAlert } from '@/lib/ui/dialog';

/** views/notice/noticeWrite.jsp + noticeModify.jsp (거의 동일해서 하나로 합쳤다) */
export default function NoticeEditorClient({
  mode,
  userNickname,
  seq,
  title: initialTitle = '',
  content: initialContent = '',
}: {
  mode: 'write' | 'modify';
  userNickname: string;
  seq?: number;
  title?: string;
  content?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<SmartEditorHandle>(null);
  const hiddenContentRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialTitle);

  const submit = () => {
    if (!title.trim()) {
      void showAlert('제목을 입력하세요.');
      return;
    }
    const content = (editorRef.current?.getContent() ?? '').replace(/\r\n/g, '');
    if (!content.trim()) {
      void showAlert('내용을 입력하세요.');
      return;
    }
    if (hiddenContentRef.current) hiddenContentRef.current.value = content;
    formRef.current?.submit();
  };

  return (
    <>
      <div className="notice-write">
        <p>공지사항 글쓰기 </p>
      </div>
      <div className="notice-write-group">
        <input
          className="notice-write-title"
          id="noticeTitle"
          type="text"
          placeholder="제목을 입력하세요."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <SmartEditor
          ref={editorRef}
          id="txtContent"
          name="content"
          className="notice-write-content"
          rows={10}
          cols={100}
          placeholder="내용을 입력하세요."
          defaultValue={initialContent}
        />
      </div>

      <div className="btn-container">
        <input
          className="nw-btn-list"
          type="button"
          id="btnNoticeView"
          value="목록"
          onClick={() => {
            window.location.href = '/notice/noticeView';
          }}
        />
        <input
          className="nw-btn-write"
          type="button"
          id="btnNoticeWrite"
          value="작성"
          onClick={submit}
        />
      </div>

      <form
        id="frmNotice"
        ref={formRef}
        method="POST"
        action={mode === 'write' ? '/notice/write' : '/notice/modify'}
      >
        <input type="hidden" name="title" value={title} readOnly />
        <input type="hidden" name="content" ref={hiddenContentRef} defaultValue={initialContent} />
        <input type="hidden" name="userNickname" value={userNickname} readOnly />
        {mode === 'modify' && <input type="hidden" name="seq" value={seq} readOnly />}
      </form>
    </>
  );
}
