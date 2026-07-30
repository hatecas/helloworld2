'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

interface FriendRow {
  seq: number;
  userName: string;
  createDate: string;
  otherNickname: string;
}

interface SearchResult {
  userName: string;
  userEmail: string;
  userNickname: string;
}

/** views/miniHome/settingFriends.jsp + resources/js/searchFriends.js */
export default function SettingFriendsClient({
  userNickname,
  searchName,
  bf,
  fReq,
  fRes,
}: {
  userNickname: string;
  searchName: string;
  bf: FriendRow[];
  fReq: FriendRow[];
  fRes: FriendRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'friend' | 'request' | 'accept'>('friend');
  const [keyword, setKeyword] = useState('');
  const [nameFilter, setNameFilter] = useState(searchName);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);

  const searchUser = async () => {
    if (!keyword.trim()) return;
    try {
      const res = await fetch('/mnHome/searchFriends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userNickname: keyword }),
      });
      const json = (await res.json()) as SearchResult & { resultCode: string };
      if (json.resultCode === '1') {
        setResult(json);
        setNotFound(false);
      } else {
        setResult(null);
        setNotFound(true);
      }
    } catch {
      setResult(null);
      setNotFound(true);
    }
  };

  const updateFriendship = async (
    url: string,
    body: Record<string, unknown>,
    confirmText: string,
    doneText: string,
  ) => {
    if (!await showConfirm(confirmText)) return;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await showAlert(doneText);
      router.refresh();
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
    }
  };

  const table = (
    rows: FriendRow[],
    emptyText: string,
    actions: (row: FriendRow) => React.ReactNode,
  ) =>
    rows.length === 0 ? (
      <span>{emptyText}</span>
    ) : (
      <table className="set-frd-bf-table">
        <tbody>
          <tr>
            <td>신청번호</td>
            <td>이름</td>
            <td>닉네임</td>
            <td>신청일</td>
            <td />
          </tr>
          {rows.map((row, index) => (
            <tr key={row.seq}>
              <td>{index + 1}</td>
              <td>{row.userName}</td>
              <td>{row.otherNickname}</td>
              <td>{row.createDate}</td>
              <td>{actions(row)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  return (
    <div className="set-frd-frame">
      <div className="set-frd-search-frame">
        <div className="set-frd-search-title KyoboHand">친구찾기</div>
        <div className="set-frd-search">
          <input
            type="text"
            className="set-frd-search-input"
            id="searchInput"
            placeholder="닉네임을 입력하세요"
            maxLength={18}
            autoFocus
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === 'Enter') void searchUser();
            }}
          />
          <input
            type="button"
            id="btnSearchUser"
            className="set-frd-search-btn"
            value="찾기"
            onClick={() => void searchUser()}
          />
        </div>
        <div id="searchResult" className="set-frd-search-place popup">
          {notFound && '검색결과가 없습니다.'}
          {result && (
            <>
              <div className={popupOpen ? 'popuptext show' : 'popuptext'} id="myPopup">
                <a href={`/mnHome/mainView/${result.userNickname}`}>방문하기</a>
              </div>
              <div className="popup" id="resultContainer" onClick={() => setPopupOpen((v) => !v)}>
                <img
                  src="/resources/images/minihome/homeIcon.png"
                  className="friend-home-Img"
                  id="friend-home-popup"
                  alt="홈"
                />
                {result.userName}({result.userEmail})
              </div>
            </>
          )}
        </div>
      </div>

      <div className="set-frd-mid">
        <div className="set-frd-mid-btn">
          <div className="set-frd-mid-bf">
            <input
              type="button"
              className="set-frd-mid-bf-ipt"
              value="나의일촌"
              onClick={() => setTab('friend')}
            />
          </div>
          <div className="set-frd-mid-request">
            <input
              type="button"
              className="set-frd-mid-req-ipt"
              value="받은신청"
              onClick={() => setTab('request')}
            />
          </div>
          <div className="set-frd-mid-accept">
            <input
              type="button"
              className="set-frd-act-bf-ipt"
              value="보낸신청"
              onClick={() => setTab('accept')}
            />
          </div>
          <div className="set-frd-mid-search">
            <input
              type="text"
              className="set-frd-mid-input"
              placeholder="닉네임을 입력하세요"
              id="searchBfName"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
            <input
              type="button"
              value="찾기"
              id="searchBf"
              onClick={() =>
                router.push(
                  nameFilter
                    ? `/mnHome/settingFriends/${userNickname}/${encodeURIComponent(nameFilter)}`
                    : `/mnHome/settingFriends/${userNickname}`,
                )
              }
            />
          </div>
        </div>

        <div className="set-frd-mid-bg">
          <div className="set-frd-bf-list" style={{ display: tab === 'friend' ? 'block' : 'none' }}>
            {table(bf, '아직 일촌이 없습니다.', (row) => (
              <>
                <input
                  type="button"
                  className="set-frd-bf-tb-input"
                  value="방문하기"
                  onClick={() => router.push(`/mnHome/mainView/${row.otherNickname}`)}
                />
                <input
                  type="button"
                  className="set-frd-bf-tb-input"
                  value="일촌끊기"
                  id="unfriend"
                  onClick={() =>
                    void updateFriendship(
                      '/mnHome/cancleFriends',
                      { seq: row.seq, del: 'Y' },
                      '일촌을 끊으시겠습니까?',
                      '일촌을 끊었습니다.',
                    )
                  }
                />
              </>
            ))}
          </div>

          <div
            className="set-frd-bf-request"
            style={{ display: tab === 'request' ? 'block' : 'none' }}
          >
            {table(fRes, '앗! 아직 일촌 신청이 안왔어요.', (row) => (
              <>
                <input
                  type="button"
                  className="set-frd-bf-tb-input accept"
                  value="수락"
                  onClick={() =>
                    void updateFriendship(
                      '/mnHome/acceptFriends',
                      { seq: row.seq, fStatus: 1 },
                      '일촌신청을 수락하시겠습니까?',
                      '일촌신청을 수락했습니다.',
                    )
                  }
                />
                <input
                  type="button"
                  className="set-frd-bf-tb-input reject"
                  value="거절"
                  onClick={() =>
                    void updateFriendship(
                      '/mnHome/rejectFriends',
                      { seq: row.seq, fStatus: -1 },
                      '일촌신청을 거절하시겠습니까?',
                      '일촌신청을 거절했습니다.',
                    )
                  }
                />
              </>
            ))}
          </div>

          <div
            className="set-frd-bf-accept"
            style={{ display: tab === 'accept' ? 'block' : 'none' }}
          >
            {table(fReq, '일촌 신청 목록이 없습니다.', (row) => (
              <input
                type="button"
                className="set-frd-bf-tb-input cancle"
                value="취소"
                onClick={() =>
                  void updateFriendship(
                    '/mnHome/cancleFriends',
                    { seq: row.seq, del: 'Y' },
                    '일촌신청을 취소하시겠습니까?',
                    '일촌신청을 취소했습니다.',
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
