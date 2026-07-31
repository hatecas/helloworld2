'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { showAlert } from '@/lib/ui/dialog';

interface BoardRow {
  seq: number;
  userNickname: string;
  title: string;
  hits: number;
  newcontent: 0 | 1;
  commentCnt: number;
}

/** views/miniHome/board.jsp + resources/js/board.js 의 목록/삭제/페이징 */
export default function BoardListClient({
  userNickname,
  isOwner,
  list,
  totalPage,
}: {
  userNickname: string;
  isOwner: boolean;
  list: BoardRow[];
  totalPage: number;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState<number[]>([]);

  const toggle = (seq: number) =>
    setChecked((prev) => (prev.includes(seq) ? prev.filter((s) => s !== seq) : [...prev, seq]));

  const deleteSelected = async () => {
    if (checked.length === 0) {
      void showAlert('삭제할 글을 선택해주세요');
      return;
    }
    try {
      await fetch('/mnHome/boardDelete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checked.map(String)),
      });
      await showAlert('삭제되었습니다.');
      router.refresh();
      setChecked([]);
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="board-container">
      <table className="board-table">
        <thead>
          <tr>
            <th className="th-checkbox">
              {isOwner && (
                <input
                  type="checkbox"
                  id="checkbox-all"
                  checked={list.length > 0 && checked.length === list.length}
                  onChange={(e) => setChecked(e.target.checked ? list.map((b) => b.seq) : [])}
                />
              )}
            </th>
            <th className="th-title">제목</th>
            <th className="th-writer">작성자</th>
            <th className="th-view">조회수</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr>
              <td colSpan={4} className="noneMsg">
                아직 게시물이 없습니다.
              </td>
            </tr>
          ) : (
            list.map((board) => (
              <tr key={board.seq}>
                <td className="td-checkbox">
                  {isOwner && (
                    <input
                      type="checkbox"
                      className="boardCheck"
                      name="boardDel"
                      value={board.seq}
                      checked={checked.includes(board.seq)}
                      onChange={() => toggle(board.seq)}
                    />
                  )}
                </td>
                <td
                  className="td-title"
                  data-boarddetail={`/mnHome/boardDetail/${board.userNickname}/${board.seq}`}
                  onClick={() =>
                    router.push(`/mnHome/boardDetail/${board.userNickname}/${board.seq}`)
                  }
                >
                  {board.title}
                  {board.commentCnt > 0 && (
                    <span className="comment-count">[{board.commentCnt}]</span>
                  )}
                  {board.newcontent === 1 && (
                    <img src="/resources/images/minihome/newIcon.png" className="newIcon" alt="new" />
                  )}
                </td>
                <td className="td-writer">
                  <a href={`/mnHome/mainView/${board.userNickname}`}>{board.userNickname}</a>
                </td>
                <td className="td-view">{board.hits}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="board-btn">
        {isOwner && (
          <>
            <input
              type="button"
              id="btnBoardDelete"
              value="삭제"
              onClick={() => void deleteSelected()}
            />
            <input
              type="button"
              className="btnBoardWrite"
              value="등록"
              onClick={() => router.push(`/mnHome/boardWriteView/${userNickname}`)}
            />
          </>
        )}
      </div>

      <div className="board-pages">
        {Array.from({ length: totalPage }, (_, i) => i + 1).map((page) => (
          <span
            key={page}
            className="board-page"
            data-page={`/mnHome/boardView/${userNickname}/${page}`}
            onClick={() => router.push(`/mnHome/boardView/${userNickname}/${page}`)}
          >
            {page}
          </span>
        ))}
      </div>
    </div>
  );
}
