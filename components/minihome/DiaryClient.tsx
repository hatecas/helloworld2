'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

interface DiaryData {
  seq: number;
  title: string;
  content: string;
  openScope: 0 | 1;
  formatted_update_date: string;
}

interface DiaryComment {
  seq: number;
  userNickname: string;
  content: string;
  cmtDate: string;
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
  initialComments: DiaryComment[];
}) {
  const router = useRouter();
  const [diary, setDiary] = useState<DiaryData | null>(initialDiary);
  const [comments, setComments] = useState<DiaryComment[]>(initialComments);
  const [draft, setDraft] = useState('');
  const [, setSelectedDate] = useState(initialDate);

  const loadComments = useCallback(async (seq: number) => {
    try {
      const res = await fetch('/mnHome/getDiaryCmt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seq }),
      });
      const json = (await res.json()) as { cmt?: DiaryComment[] };
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

  const addComment = async () => {
    if (!diary || !draft.trim()) return;
    if (!viewerNickname) {
      void showAlert('로그인이 필요합니다.');
      return;
    }
    try {
      const res = await fetch('/mnHome/diaryAddCMT', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diarySeq: diary.seq, userNickname: viewerNickname, content: draft }),
      });
      const json = (await res.json()) as { resultCode: string };
      if (json.resultCode === '1') {
        void showAlert('작성 완료');
        setDraft('');
        await loadComments(diary.seq);
      } else {
        void showAlert('작성 실패');
      }
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
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
                <div className="board-comment-write" id="cmtInputContainer">
                  <span>댓글</span>
                  <input
                    type="text"
                    className="comment-content-write"
                    id={`cmtContent${diary.seq}`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void addComment();
                    }}
                  />
                  <input type="button" value="확인" onClick={() => void addComment()} />
                </div>
              )}

              <div className="board-comment-container" id="diaryCmtContainer">
                {comments.map((comment) => (
                  <div className="board-comment" key={comment.seq}>
                    <span className="board-comment-writer">{comment.userNickname}</span>
                    <span className="board-comment-content">{comment.content}</span>
                    <span className="board-comment-date">{comment.cmtDate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
