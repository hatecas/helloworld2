'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

interface VisitRow {
  seq: number;
  number: number;
  userNickname: string;
  userName: string;
  content: string;
  contentHtml: string;
  update_date: string;
  contentPath: string;
  reply: string | null;
  replyDate: string | null;
}

/** 글자수를 바이트로 세던 구 visit.js countBytes */
function countBytes(str: string): number {
  let length = 0;
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    length += code < 0x80 ? 1 : code < 0x800 ? 2 : 3;
  }
  return length;
}

/** views/miniHome/visit.jsp + resources/js/visit.js */
export default function VisitClient({
  userNickname,
  viewerNickname,
  viewerMinimi,
  ownerName,
  ownerMinimi,
  visits: initialVisits,
  totalPage,
}: {
  userNickname: string;
  viewerNickname: string;
  viewerMinimi: string;
  ownerName: string;
  ownerMinimi: string;
  visits: VisitRow[];
  totalPage: number;
}) {
  const router = useRouter();
  const [visits, setVisits] = useState(initialVisits);
  // router.refresh() 로 서버에서 새 방명록 목록을 받아오면 prop 만 바뀌고
  // useState 초기값은 그대로라 화면이 갱신되지 않는다. prop 이 바뀔 때마다 동기화한다.
  useEffect(() => {
    setVisits(initialVisits);
  }, [initialVisits]);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');
  // 주인장 답글 (열려 있는 방문글 seq / 입력 중인 답글 내용)
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  const isOwner = viewerNickname === userNickname;
  const byteCount = countBytes(draft);

  const saveReply = async (visit: VisitRow) => {
    try {
      const res = await fetch('/mnHome/visitReply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seq: visit.seq, reply: replyDraft }),
      });
      const json = (await res.json()) as { result: string };
      if (json.result === 'Success') {
        const trimmed = replyDraft.trim();
        setVisits((prev) =>
          prev.map((v) => (v.seq === visit.seq ? { ...v, reply: trimmed || null } : v)),
        );
        setReplyingTo(null);
        setReplyDraft('');
        router.refresh(); // 답글 시간까지 정확히 반영
      } else {
        void showAlert('답글 저장에 실패했습니다. 다시 시도해주세요.');
      }
    } catch {
      void showAlert('답글 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const insertComment = async () => {
    if (viewerNickname === userNickname) {
      void showAlert('자신의 방명록에는 글을 작성할 수 없습니다.');
      return;
    }
    if (!viewerNickname) {
      void showAlert('로그인이 필요합니다.');
      return;
    }
    if (!draft.trim()) return;

    try {
      const res = await fetch('/mnHome/visitComment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft, userNickname: viewerNickname, targetNickname: userNickname }),
      });
      const json = (await res.json()) as { result: string };
      if (json.result === 'Success') {
        setDraft('');
        router.refresh();
      } else {
        void showAlert('댓글 작성에 실패했습니다. 다시 시도해주세요.');
      }
    } catch {
      void showAlert('댓글 작성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const confirmEdit = async (visit: VisitRow) => {
    try {
      const res = await fetch('/mnHome/visitCommentUpdate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContent: visit.content,
          newContent: editDraft,
          userNickname: visit.userNickname,
          targetNickname: userNickname,
        }),
      });
      const json = (await res.json()) as { result: string };
      if (json.result === 'Success') {
        void showAlert('변경되었습니다.');
        setVisits((prev) =>
          prev.map((v) =>
            v.number === visit.number
              ? { ...v, content: editDraft, contentHtml: editDraft.replace(/\n/g, '<br>') }
              : v,
          ),
        );
        setEditing(null);
      } else {
        void showAlert('변경에 실패했습니다. 다시 시도해주세요.');
      }
    } catch {
      void showAlert('변경에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const remove = async (visit: VisitRow) => {
    if (!await showConfirm('이 게시물을 삭제하시겠습니까?', { danger: true })) return;
    try {
      const res = await fetch('/mnHome/visitCommentDelete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: visit.content,
          userNickname: visit.userNickname,
          targetNickname: userNickname,
        }),
      });
      const json = (await res.json()) as { result: string };
      if (json.result === 'Success') {
        void showAlert('게시물이 성공적으로 삭제되었습니다.');
        setVisits((prev) => prev.filter((v) => v.number !== visit.number));
      } else {
        void showAlert('게시물 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    } catch {
      void showAlert('게시물 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="visit-overflow">
      <div className="visit-frame">
        <div className="visit-frame-write view-margin">
          <img className="visit-minimi" src={viewerMinimi} alt="내 미니미" />
          <div className="visit-write-text">
            <textarea
              id="visit-comment-insert"
              className="visit-view-inner"
              value={draft}
              onChange={(e) => {
                let next = e.target.value;
                while (countBytes(next) > 5000) next = next.slice(0, -1);
                setDraft(next);
              }}
            />
          </div>
        </div>
        <div className="visit-write-footer">
          <span id="char-count">{byteCount}/5000</span>
          <button
            type="button"
            className="mh-btn"
            id="visit-comment-btn"
            onClick={() => void insertComment()}
          >
            등록
          </button>
        </div>
      </div>

      {visits.map((visit) => (
        <div id={`visit-${visit.number}`} key={visit.number} data-usernickname={visit.userNickname}>
          <div className="visit-line">
            <table>
              <tbody>
                <tr>
                  <td>No. {visit.number}</td>
                  <td>
                    {visit.userName}
                    <a href={`/mnHome/mainView/${visit.userNickname}`}>
                      <img
                        src="/resources/images/minihome/homeIcon.png"
                        className="visit-line-tbImg"
                        alt="홈"
                      />
                    </a>
                  </td>
                  <td>{visit.update_date}</td>
                  {viewerNickname === visit.userNickname && (
                    <>
                      <td>
                        <button
                          type="button"
                          className="mh-act"
                          onClick={() => {
                            if (editing === visit.number) {
                              void confirmEdit(visit);
                            } else {
                              setEditing(visit.number);
                              setEditDraft(visit.content);
                            }
                          }}
                        >
                          {editing === visit.number ? '확인' : '수정'}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="mh-act mh-act--danger"
                          onClick={() => void remove(visit)}
                        >
                          삭제
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="visit-frame-write view-margin">
            <img className="visit-minimi" src={visit.contentPath} alt="미니미" />
            <div className="visit-view">
              {editing === visit.number ? (
                <textarea
                  className="visit-view-inner"
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                />
              ) : (
                <div
                  className="visit-view-inner-list"
                  dangerouslySetInnerHTML={{ __html: visit.contentHtml }}
                />
              )}
            </div>
          </div>

          {(visit.reply || isOwner) && (
            <div className="visit-reply-area">
              {/* 주인장 답글 — 방문글과 동일한 미니미 + 이름 + 날짜 레이아웃 */}
              {visit.reply && replyingTo !== visit.seq && (
                <div className="visit-reply-entry">
                  <div className="visit-line visit-reply-line">
                    <table>
                      <tbody>
                        <tr>
                          <td className="visit-reply-tag">답글</td>
                          <td>
                            {ownerName}
                            <a href={`/mnHome/mainView/${userNickname}`}>
                              <img
                                src="/resources/images/minihome/homeIcon.png"
                                className="visit-line-tbImg"
                                alt="홈"
                              />
                            </a>
                          </td>
                          <td>{visit.replyDate}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="visit-frame-write view-margin">
                    <img className="visit-minimi" src={ownerMinimi} alt="주인 미니미" />
                    <div className="visit-view">
                      <div className="visit-view-inner-list visit-reply-text">{visit.reply}</div>
                    </div>
                  </div>
                </div>
              )}

              {isOwner && replyingTo === visit.seq && (
                <div className="visit-reply-edit">
                  <textarea
                    className="visit-reply-input"
                    value={replyDraft}
                    placeholder="답글을 입력하세요"
                    onChange={(e) => setReplyDraft(e.target.value)}
                  />
                  <div className="visit-reply-btns">
                    <button
                      type="button"
                      className="mh-btn"
                      onClick={() => void saveReply(visit)}
                    >
                      등록
                    </button>
                    <button
                      type="button"
                      className="mh-btn mh-btn--ghost"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyDraft('');
                      }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {isOwner && replyingTo !== visit.seq && (
                <button
                  type="button"
                  className="mh-act"
                  onClick={() => {
                    setReplyingTo(visit.seq);
                    setReplyDraft(visit.reply ?? '');
                  }}
                >
                  {visit.reply ? '답글 수정' : '답글 달기'}
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="page-container">
        {Array.from({ length: totalPage }, (_, i) => i + 1).map((page) => (
          <span
            key={page}
            className="visit-page"
            data-page={`/mnHome/visitView/${userNickname}?page=${page}`}
            onClick={() => router.push(`/mnHome/visitView/${userNickname}?page=${page}`)}
          >
            {page}
          </span>
        ))}
      </div>
    </div>
  );
}
