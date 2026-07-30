'use client';

import { useEffect, useRef } from 'react';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

/** views/notice/noticeDetail.jsp */
export default function NoticeDetailClient({
  seq,
  title,
  writer,
  date,
  content,
  isAdmin,
  msg,
}: {
  seq: number;
  title: string;
  writer: string;
  date: string;
  content: string;
  isAdmin: boolean;
  msg: string;
}) {
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const alerted = useRef(false);

  useEffect(() => {
    if (msg && !alerted.current) {
      alerted.current = true;
      void showAlert(msg);
      window.history.replaceState(null, '', `/notice/noticeDetail?seq=${seq}`);
    }
  }, [msg, seq]);

  const buttonType = isAdmin ? 'button' : 'hidden';

  return (
    <div className="noticeDetail-container">
      <div className="notice-default">
        <p>공지사항</p>
      </div>
      <div className="noticeDetail-content-container">
        <div className="notice-info-group">
          <input className="notice-title" type="text" value={`${seq}. ${title}`} readOnly />
          <div className="notice-info">
            작성자 : {writer}
            <div className="notice-write-date">{date}</div>
          </div>
          {/* 공지 본문은 SmartEditor2 로 작성된 HTML 이라 그대로 렌더링한다 */}
          <div className="notice-info-content" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>

      <div className="btn-container">
        <div className="btn-left">
          <input
            className="nd-btn-list"
            type="button"
            id="btnNoticeView"
            value="목록"
            onClick={() => {
              window.location.href = '/notice/noticeView';
            }}
          />
        </div>
        <div className="btn-right">
          <input
            className="nd-btn-update"
            type={buttonType}
            id="btnNoticeUpdate"
            value="수정"
            onClick={() => {
              window.location.href = `/notice/noticeModify?seq=${seq}`;
            }}
          />
          <input
            className="nd-btn-delete"
            type={buttonType}
            id="btnNoticeDelete"
            value="삭제"
            onClick={async () => {
              if (await showConfirm('정말 삭제하시겠습니까?', { danger: true })) {
                deleteFormRef.current?.submit();
              }
            }}
          />
        </div>
      </div>

      <form id="deleteNotice" ref={deleteFormRef} method="post" action="/notice/noticeDelete">
        <input type="hidden" name="seq" value={seq} />
      </form>
    </div>
  );
}
