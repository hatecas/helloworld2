'use client';

import { useEffect, useState } from 'react';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

export interface ThreadComment {
  seq: number;
  userNickname: string;
  content: string;
  update_date_format: string;
  parentSeq: number | null;
}

/**
 * 게시판·사진첩이 공유하는 댓글/답글 목록.
 *
 * 댓글은 flat 하게 받아 parentSeq 로 원댓글 밑에 답글을 묶어 보여 준다(1단계 대댓글).
 * 등록/삭제는 상위에서 넘긴 onAdd/onDelete 로 위임한다.
 *  - onAdd(content, parentSeq): 성공 시 갱신된 전체 목록, 실패 시 null
 *  - onDelete(seq): 성공 여부
 */
export default function CommentThread({
  viewerNickname,
  canComment,
  comments: initial,
  onAdd,
  onDelete,
}: {
  viewerNickname: string;
  canComment: boolean;
  comments: ThreadComment[];
  onAdd: (content: string, parentSeq: number | null) => Promise<ThreadComment[] | null>;
  onDelete: (seq: number) => Promise<boolean>;
}) {
  const [comments, setComments] = useState(initial);
  useEffect(() => setComments(initial), [initial]);

  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  const parents = comments.filter((c) => c.parentSeq == null);
  const repliesOf = (seq: number) => comments.filter((c) => c.parentSeq === seq);

  const submitNew = async () => {
    if (!draft.trim()) return;
    const next = await onAdd(draft, null);
    if (next) {
      setComments(next);
      setDraft('');
    } else {
      void showAlert('댓글 작성에 실패했습니다.');
    }
  };

  const submitReply = async (parentSeq: number) => {
    if (!replyDraft.trim()) return;
    const next = await onAdd(replyDraft, parentSeq);
    if (next) {
      setComments(next);
      setReplyTo(null);
      setReplyDraft('');
    } else {
      void showAlert('답글 작성에 실패했습니다.');
    }
  };

  const remove = async (seq: number) => {
    if (!(await showConfirm('정말로 삭제하시겠습니까?', { danger: true }))) return;
    const ok = await onDelete(seq);
    if (ok) {
      setComments((prev) => prev.filter((c) => c.seq !== seq && c.parentSeq !== seq));
    } else {
      void showAlert('오류가 발생했습니다.');
    }
  };

  const writerLink = (nickname: string, content: string, date: string) => (
    <div className="comment-info">
      <a href={`/mnHome/mainView/${nickname}`}>
        <span className="board-comment-writer">{nickname}</span>
      </a>
      <span className="board-comment-content">{content}</span>
      <span className="board-comment-date">{date}</span>
    </div>
  );

  return (
    <>
      {canComment && (
        <div className="board-comment-write">
          <span>댓글</span>
          <input
            type="text"
            className="comment-content-write"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submitNew();
            }}
          />
          <input type="button" value="확인" onClick={() => void submitNew()} />
        </div>
      )}

      <div className="board-comment-container">
        {parents.map((c) => (
          <div className="board-comment" key={c.seq}>
            {writerLink(c.userNickname, c.content, c.update_date_format)}
            <div className="board-comment-actions">
              {canComment && (
                <span
                  className="board-comment-reply-btn"
                  onClick={() => {
                    setReplyTo((cur) => (cur === c.seq ? null : c.seq));
                    setReplyDraft('');
                  }}
                >
                  답글
                </span>
              )}
              {viewerNickname === c.userNickname && (
                <span className="board-comment-delete" onClick={() => void remove(c.seq)}>
                  삭제
                </span>
              )}
            </div>

            {repliesOf(c.seq).map((r) => (
              <div className="board-comment board-comment-reply-item" key={r.seq}>
                {writerLink(r.userNickname, r.content, r.update_date_format)}
                {viewerNickname === r.userNickname && (
                  <div className="board-comment-actions">
                    <span className="board-comment-delete" onClick={() => void remove(r.seq)}>
                      삭제
                    </span>
                  </div>
                )}
              </div>
            ))}

            {canComment && replyTo === c.seq && (
              <div className="board-comment-write board-reply-write">
                <input
                  type="text"
                  className="comment-content-write"
                  placeholder="답글을 입력하세요"
                  value={replyDraft}
                  autoFocus
                  onChange={(e) => setReplyDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void submitReply(c.seq);
                  }}
                />
                <input type="button" value="등록" onClick={() => void submitReply(c.seq)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
