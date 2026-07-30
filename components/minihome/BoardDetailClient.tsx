'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

interface Comment {
  seq: number;
  userNickname: string;
  content: string;
  update_date_format: string;
}

/** views/miniHome/boardDetail.jsp + resources/js/board.js 의 댓글 처리 */
export default function BoardDetailClient({
  userNickname,
  viewerNickname,
  isOwner,
  seq,
  title,
  content,
  writer,
  createDate,
  canComment,
  comments: initialComments,
}: {
  userNickname: string;
  viewerNickname: string;
  isOwner: boolean;
  seq: number;
  title: string;
  content: string;
  writer: string;
  createDate: string;
  canComment: boolean;
  comments: Comment[];
}) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState('');

  const addComment = async () => {
    if (!draft.trim()) return;
    try {
      const res = await fetch('/mnHome/addComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardSeq: String(seq), userNickname: viewerNickname, content: draft }),
      });
      const json = (await res.json()) as Comment[];
      if (json.length === 0) {
        void showAlert('댓글 작성에 실패했습니다.');
        return;
      }
      setComments(json);
      setDraft('');
      void showAlert('댓글이 성공적으로 등록되었습니다.');
    } catch {
      void showAlert('댓글 작성에 실패했습니다.');
    }
  };

  const deleteComment = async (commentSeq: number) => {
    if (!await showConfirm('정말로 댓글을 삭제하시겠습니까?', { danger: true })) return;
    try {
      const body = new URLSearchParams({ seq: String(commentSeq) });
      const res = await fetch('/mnHome/deleteComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const result = (await res.json()) as number;
      if (result === 1) {
        void showAlert('댓글이 정상적으로 삭제되었습니다.');
        setComments((prev) => prev.filter((c) => c.seq !== commentSeq));
      } else {
        void showAlert('오류가 발생했습니다.');
      }
    } catch {
      void showAlert('오류가 발생했습니다.');
    }
  };

  return (
    <>
      <div className="board-outer-container">
        <div className="board-detail-title">{title}</div>
        <input type="hidden" value={seq} id="boardSeq" readOnly />
        <input type="hidden" value={viewerNickname} id="userNickname" readOnly />
      </div>
      <div className="board-write-container">
        <span className="board-writer">{writer}</span>
        <span className="board-write-date">{createDate}</span>
      </div>
      {/* 본문은 SmartEditor2 가 만든 HTML 이라 그대로 렌더링한다 */}
      <div className="board-content-container" dangerouslySetInnerHTML={{ __html: content }} />

      <div className="board-detail-right">
        <button
          className="btn-boardlist"
          id="btnBoardView"
          onClick={() => router.push(`/mnHome/boardView/${userNickname}`)}
        >
          목록
        </button>
        {isOwner && (
          <button
            className="btnBoardWrite"
            onClick={() => router.push(`/mnHome/boardModifyView/${userNickname}/${seq}`)}
          >
            수정
          </button>
        )}
      </div>

      {canComment && (
        <div className="board-comment-write">
          <span>댓글</span>
          <input
            type="text"
            className="comment-content-write"
            id="inputComment"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void addComment();
            }}
          />
          <input type="button" value="확인" id="btnComment" onClick={() => void addComment()} />
        </div>
      )}

      <div className="board-comment-container" id="board-comment-container">
        {comments.map((comment) => (
          <div className="board-comment" key={comment.seq}>
            <div className="comment-info">
              <a href={`/mnHome/mainView/${comment.userNickname}`}>
                <span className="board-comment-writer">{comment.userNickname}</span>
              </a>
              <span className="board-comment-content">{comment.content}</span>
              <span className="board-comment-date">{comment.update_date_format}</span>
            </div>
            {viewerNickname === comment.userNickname && (
              <div className="board-comment-actions">
                <span
                  className="board-comment-delete"
                  onClick={() => void deleteComment(comment.seq)}
                >
                  삭제
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
