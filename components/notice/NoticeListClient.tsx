'use client';

import { useEffect, useRef, useState } from 'react';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

interface NoticeRow {
  seq: number;
  title: string;
  date: string;
}

/** views/notice/notice.jsp 의 목록/삭제/페이징 부분 */
export default function NoticeListClient({
  list,
  totalPage,
  currentPage,
  isAdmin,
  msg,
}: {
  list: NoticeRow[];
  totalPage: number;
  currentPage: number;
  isAdmin: boolean;
  msg: string;
}) {
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const alerted = useRef(false);
  const [checked, setChecked] = useState<number[]>([]);

  useEffect(() => {
    if (msg && !alerted.current) {
      alerted.current = true;
      void showAlert(msg);
      window.history.replaceState(null, '', `/notice/noticeView?page=${currentPage}`);
    }
  }, [msg, currentPage]);

  const toggle = (seq: number) =>
    setChecked((prev) => (prev.includes(seq) ? prev.filter((s) => s !== seq) : [...prev, seq]));

  const onDelete = async () => {
    if (checked.length === 0) {
      void showAlert('삭제할 게시물을 선택해주세요.');
      return;
    }
    if (await showConfirm('정말 삭제하시겠습니까?', { danger: true })) {
      deleteFormRef.current?.submit();
    }
  };

  return (
    <>
      <div className="notice-table-title">
        <table className="notice-tanle">
          <colgroup>
            {isAdmin && <col className="col-choice" />}
            <col className="col-number" />
            <col className="col-title" />
            <col className="col-date" />
          </colgroup>
          <tbody>
            <tr>
              {isAdmin && <th>선택</th>}
              <th>번호</th>
              <th>제목</th>
              <th>등록일</th>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="notice-table-title-mid">
        <table className="notice-tanle">
          <colgroup>
            {isAdmin && <col className="col-choice" />}
            <col className="col-number" />
            <col className="col-title" />
            <col className="col-date" />
          </colgroup>
          <tbody>
            {list.map((notice) => (
              <tr className="notice-table-tr" key={notice.seq}>
                {isAdmin && (
                  <td>
                    <input
                      type="checkbox"
                      className="notice-cbx"
                      checked={checked.includes(notice.seq)}
                      onChange={() => toggle(notice.seq)}
                    />
                  </td>
                )}
                <td>{notice.seq}</td>
                <td
                  className="notice-td-title"
                  data-seq={notice.seq}
                  onClick={() => {
                    window.location.href = `/notice/noticeDetail?seq=${notice.seq}`;
                  }}
                >
                  {notice.title}
                </td>
                <td>{notice.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="btnNoticeGroup">
        <form id="frm1" ref={deleteFormRef} method="POST" action="/notice/noticeDelete">
          {checked.map((seq) => (
            <input key={seq} type="hidden" name="seq" value={seq} />
          ))}
          <input
            type={isAdmin ? 'button' : 'hidden'}
            className="btn-notice"
            id="btnDelete"
            value="삭제"
            onClick={onDelete}
          />
        </form>
        <input
          type={isAdmin ? 'button' : 'hidden'}
          className="btn-notice"
          id="btnWrite"
          value="등록"
          onClick={() => {
            window.location.href = '/notice/noticeWrite';
          }}
        />
      </div>

      {/* paging */}
      <div className="notice-paging" onMouseDown={(e) => e.preventDefault()} style={{ cursor: 'default' }}>
        {Array.from({ length: totalPage }, (_, i) => i + 1).map((page) => (
          <span
            key={page}
            className="spanPage"
            data-page={page}
            style={
              page === currentPage
                ? { color: page === 1 ? 'orange' : 'blue', fontWeight: 700 }
                : undefined
            }
            onClick={() => {
              window.location.href = `/notice/noticeView?page=${page}`;
            }}
          >
            {page}
          </span>
        ))}
      </div>
    </>
  );
}
