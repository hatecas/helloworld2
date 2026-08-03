'use client';

import { useRouter } from 'next/navigation';

import CommentThread, { type ThreadComment } from '@/components/minihome/CommentThread';
import ScrapButton from '@/components/minihome/ScrapButton';

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
  canScrap,
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
  /** 일촌의 글이라 내 게시판으로 퍼갈 수 있는가 */
  canScrap: boolean;
  comments: ThreadComment[];
}) {
  const router = useRouter();

  const addComment = async (content: string, parentSeq: number | null) => {
    try {
      const res = await fetch('/mnHome/addComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardSeq: String(seq), content, parentSeq }),
      });
      const json = (await res.json()) as ThreadComment[];
      return json.length > 0 ? json : null;
    } catch {
      return null;
    }
  };

  const deleteComment = async (commentSeq: number) => {
    try {
      const res = await fetch('/mnHome/deleteComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ seq: String(commentSeq) }),
      });
      return ((await res.json()) as number) === 1;
    } catch {
      return false;
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
        {canScrap && <ScrapButton kind="board" seq={seq} viewerNickname={viewerNickname} />}
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

      <CommentThread
        viewerNickname={viewerNickname}
        canComment={canComment}
        comments={initialComments}
        onAdd={addComment}
        onDelete={deleteComment}
      />
    </>
  );
}
