'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { MiniHomeCommon } from '@/lib/minihome-view';
import type { Tabs } from '@/lib/db/repo';
import { showAlert } from '@/lib/ui/dialog';

interface NewsRow {
  seq: number;
  tableName: string;
  category: string;
  url: string;
  title: string;
}

interface FriendCmt {
  userNickname: string;
  content: string;
  createDate: string;
}

interface MinimiRow {
  seq: number;
  minimiPath: string;
  minimiLeft: string;
  minimiTop: string;
}

/** views/miniHome/main.jsp 의 content-box 안쪽 (업데이트 소식 / 미니룸 / 일촌평) */
export default function MainContent({
  common,
  tabs,
  news,
  minimiList,
  backgroundPath,
  friendCheck,
  friendCmtList: initialCmt,
}: {
  common: MiniHomeCommon;
  tabs: Tabs;
  news: NewsRow[];
  minimiList: MinimiRow[];
  backgroundPath: string;
  friendCheck: number;
  friendCmtList: FriendCmt[];
}) {
  const router = useRouter();
  const [comments, setComments] = useState(initialCmt);
  const [draft, setDraft] = useState('');

  const submitComment = async () => {
    if (friendCheck === 0) {
      void showAlert('일촌이 아니기 때문에 일촌평을 작성할 수 없습니다.');
      return;
    }
    if (friendCheck === 2) {
      void showAlert('자기 자신은 일촌평을 작성할 수 없습니다.');
      return;
    }
    if (!draft.trim()) return;

    try {
      const res = await fetch('/mnHome/friendCmt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userNickname: common.viewerNickname,
          friendNickname: common.userNickname,
          content: draft,
        }),
      });
      setComments((await res.json()) as FriendCmt[]);
      setDraft('');
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
    }
  };

  const menuItem = (
    label: string,
    recent: number,
    total: number,
    href: string,
  ) => (
    <div className="menu-item" onClick={() => router.push(href)}>
      {label}
      <span className="menu-num">
        {recent}/{total}
      </span>
      {recent > 0 && (
        <img src="/resources/images/minihome/newIcon.png" alt="new Icon" className="minihome-nIcon" />
      )}
    </div>
  );

  return (
    <>
      <div className="box-title">
        Updated news <span className="box-title2">TODAY STORY</span>
      </div>

      <div className="news-flex-box">
        <div className="news-box">
          {news.map((row) => (
            <div className="news-row" key={`${row.category}-${row.seq}`}>
              <div className={row.category}>{row.tableName}</div>
              <div className="news-title" data-url={row.url} onClick={() => router.push(row.url)}>
                {row.title}
              </div>
            </div>
          ))}
        </div>

        <div className="update-box">
          <div className="menu-row">
            {menuItem(
              '다이어리',
              tabs.RecentDiaryCount,
              tabs.TotalDiaryCount,
              `/mnHome/diaryView/${common.userNickname}`,
            )}
            {menuItem(
              '사진첩',
              tabs.RecentAlbumCount,
              tabs.TotalAlbumCount,
              `/mnHome/albumView/${common.userNickname}`,
            )}
          </div>
          <div className="menu-row">
            {menuItem(
              '게시판',
              tabs.RecentBoardCount,
              tabs.TotalBoardCount,
              `/mnHome/boardView/${common.userNickname}`,
            )}
            {menuItem(
              '방명록',
              tabs.RecentVisitCount,
              tabs.TotalVisitCount,
              `/mnHome/visitView/${common.userNickname}`,
            )}
          </div>
        </div>
      </div>

      <div className="miniroom">
        <div className="mnr-group">
          <div className="mnr-title">
            <span className="box-title miniroom-title">Miniroom</span>
          </div>
          <div className="mnr-edit">
            {common.isOwner && (
              <a
                className="mnh-Edit"
                onClick={() =>
                  window.open(
                    '/mnHome/miniroomEditView',
                    '_blank',
                    'width=800, height=600, scrollbars=no, resizable=no, toolbars=no, menubar=no, left=100, top=50',
                  )
                }
              >
                미니룸 설정
              </a>
            )}
          </div>
        </div>

        <div className="miniroom-gif-box">
          <div
            className="miniroom-canvas"
            style={{ backgroundImage: `url('${backgroundPath}')` }}
          >
            {minimiList.map((minimi) => (
              <img
                key={minimi.seq}
                className="miniroom-minimi"
                src={minimi.minimiPath}
                alt=""
                style={{ left: minimi.minimiLeft, top: minimi.minimiTop }}
              />
            ))}
          </div>
        </div>
      </div>

      <br />

      <div className="main-cmt">
        {friendCheck === 1 && (
          <div className="main-cmt-write">
            일촌평
            <input
              type="text"
              id="friendCmt"
              className="main-cmt-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitComment();
              }}
            />
            <button type="button" id="btnFriendCmt" onClick={() => void submitComment()}>
              확인
            </button>
          </div>
        )}
        <div className="main-cmt-content">
          <ul>
            {comments.map((cmt, i) => (
              <li key={`${cmt.userNickname}-${cmt.createDate}-${i}`}>
                {cmt.content}
                <span className="main-cmt-info">
                  <a href={`/mnHome/mainView/${cmt.userNickname}`}>{cmt.userNickname}</a>{' '}
                  {cmt.createDate}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
