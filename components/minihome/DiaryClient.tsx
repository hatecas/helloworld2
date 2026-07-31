'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

import CommentThread, { type ThreadComment } from '@/components/minihome/CommentThread';

interface DiaryData {
  seq: number;
  title: string;
  content: string;
  openScope: 0 | 1;
  formatted_update_date: string;
}

/** views/miniHome/diary.jsp + resources/js/datePicker.js + diaryComment.js */
export default function DiaryClient({
  userNickname,
  viewerNickname,
  isOwner,
  initialDate,
  initialDiary,
  initialComments,
}: {
  userNickname: string;
  viewerNickname: string;
  isOwner: boolean;
  initialDate: string;
  initialDiary: DiaryData | null;
  initialComments: ThreadComment[];
}) {
  const router = useRouter();
  const [diary, setDiary] = useState<DiaryData | null>(initialDiary);
  const [comments, setComments] = useState<ThreadComment[]>(initialComments);
  const [, setSelectedDate] = useState(initialDate);

  const loadComments = useCallback(async (seq: number) => {
    try {
      const res = await fetch('/mnHome/getDiaryCmt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seq }),
      });
      const json = (await res.json()) as { cmt?: ThreadComment[] };
      setComments(json.cmt ?? []);
    } catch {
      setComments([]);
    }
  }, []);

  const loadDiary = useCallback(
    async (date: string) => {
      setSelectedDate(date);
      try {
        const res = await fetch('/mnHome/diaryTest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, userNickname }),
        });
        const json = (await res.json()) as Partial<DiaryData>;

        // 비공개 글은 주인에게만 보인다 (구 datePicker.js 의 조건 그대로)
        if (json.title === undefined || (json.openScope === 0 && !isOwner)) {
          setDiary(null);
          setComments([]);
          return;
        }
        setDiary(json as DiaryData);
        if (json.seq != null) await loadComments(json.seq);
      } catch {
        setDiary(null);
        setComments([]);
      }
    },
    [userNickname, isOwner, loadComments],
  );

  // 좌측 달력(DiaryProfileBox)에서 날짜를 고르면 이 이벤트가 온다
  useEffect(() => {
    const handler = (e: Event) => {
      const date = (e as CustomEvent<string>).detail;
      if (date) void loadDiary(date);
    };
    window.addEventListener('diary:selectDate', handler);
    return () => window.removeEventListener('diary:selectDate', handler);
  }, [loadDiary]);

  // 게시판·사진첩과 동일한 CommentThread 계약: 성공하면 갱신된 목록, 실패하면 null
  const addComment = async (content: string, parentSeq: number | null) => {
    if (!diary) return null;
    if (!viewerNickname) {
      void showAlert('로그인이 필요합니다.');
      return null;
    }
    try {
      const res = await fetch('/mnHome/diaryAddCMT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diarySeq: diary.seq, content, parentSeq }),
      });
      const json = (await res.json()) as ThreadComment[];
      if (json.length === 0) return null;
      setComments(json);
      return json;
    } catch {
      return null;
    }
  };

  const deleteComment = async (commentSeq: number) => {
    try {
      const res = await fetch('/mnHome/diaryCommentDelete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seq: commentSeq }),
      });
      const ok = ((await res.json()) as number) === 1;
      if (ok && diary) await loadComments(diary.seq);
      return ok;
    } catch {
      return false;
    }
  };

  const deleteDiary = async () => {
    if (!diary) return;
    if (!await showConfirm('정말 삭제하시겠습니까?', { danger: true })) return;
    try {
      const res = await fetch('/mnHome/diaryDelete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seq: diary.seq }),
      });
      const json = (await res.json()) as { resultCode: string };
      if (json.resultCode === '1') {
        await showAlert('삭제되었습니다.');
        setDiary(null);
        setComments([]);
        router.refresh();
      } else {
        void showAlert('잠시 후 다시 시도해주세요.');
      }
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <>
      <div className=" album-submit">
        {isOwner && (
          <input
            type="button"
            id="btnUpload"
            className="btnDiaryWrite"
            value="글쓰기"
            onClick={() => router.push(`/mnHome/diaryWriteView/${userNickname}`)}
          />
        )}
      </div>

      <div className="album-overflow">
        <div className="album-container3">
          <div className="album-container2">
            <div className="diary-container1">
              <div className="album-db-group">
                <div id="diaryTitle" className="diary-title">
                  {diary ? diary.title : '다이어리를 작성해주세요.'}
                </div>
                <div id="diaryDate" className="diary-date-right">
                  {diary?.formatted_update_date ?? ''}
                </div>
                {/* 본문은 SmartEditor2 가 만든 HTML */}
                {diary ? (
                  <div
                    id="diaryContent"
                    className="diary-content"
                    dangerouslySetInnerHTML={{ __html: diary.content }}
                  />
                ) : (
                  <div id="diaryContent" className="diary-content">
                    매일매일 일촌들과 일상을 공유해보아요!
                  </div>
                )}
              </div>

              {isOwner && diary && (
                <div className="album-public" id="diary-public" style={{ display: 'flex' }}>
                  <div className="album-dropDown ">
                    <span>공개설정 :</span>
                    <select id="select-scope" disabled style={{ appearance: 'none' }} value={diary.openScope}>
                      <option value={0}>비공개</option>
                      <option value={1}>전체공개</option>
                    </select>
                  </div>
                  <div className="album-under">
                    <a
                      id="diarymodify"
                      className="album-under-right"
                      onClick={() =>
                        router.push(`/mnHome/diaryModifyView/${userNickname}/${diary.seq}`)
                      }
                    >
                      수정
                    </a>
                    <a className="album-under-right" onClick={() => void deleteDiary()}>
                      삭제
                    </a>
                  </div>
                </div>
              )}

              {diary && (
                <div className="album-comment-section" id="diaryCmtContainer">
                  <CommentThread
                    viewerNickname={viewerNickname}
                    canComment={!!viewerNickname}
                    comments={comments}
                    onAdd={addComment}
                    onDelete={deleteComment}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
