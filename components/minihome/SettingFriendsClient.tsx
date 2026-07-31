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

  const requestFriendship = async (responseUser: string) => {
    if (responseUser === userNickname) {
      void showAlert('자기 자신에게는 일촌신청을 할 수 없습니다.');
      return;
    }
    if (!await showConfirm(`${responseUser}님께 일촌신청을 보내겠습니까?`)) return;
    try {
      const res = await fetch('/mnHome/friendRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestUser: userNickname, responseUser }),
      });
      const data = (await res.json()) as { code?: string };
      if (data.code === '1') void showAlert('일촌신청을 보냈습니다.');
      else if (data.code === '-1') void showAlert('이미 신청 내역이 있습니다.');
      else void showAlert('잠시 후 다시 시도해주세요.');
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
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

  const goVisit = (nickname: string) => router.push(`/mnHome/mainView/${nickname}`);

  return (
    <div className="set-frd-frame">
      <div className="set-frd-search-frame">
        <div className="set-frd-search-title">친구찾기</div>
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
          <button type="button" id="btnSearchUser" className="set-frd-search-btn" onClick={() => void searchUser()}>
            찾기
          </button>
        </div>

        {notFound && <div className="set-frd-search-empty">검색결과가 없습니다.</div>}
        {result && (
          <div className="set-frd-result-card">
            <span className="set-frd-result-name">
              <img src="/resources/images/minihome/homeIcon.png" className="friend-home-Img" alt="홈" />
              {result.userName}
              <span className="set-frd-result-email">({result.userEmail})</span>
            </span>
            <span className="set-frd-result-actions">
              <button type="button" onClick={() => goVisit(result.userNickname)}>
                방문하기
              </button>
              <button type="button" className="set-frd-result-req" onClick={() => void requestFriendship(result.userNickname)}>
                일촌신청
              </button>
            </span>
          </div>
        )}
      </div>

      <div className="set-frd-mid">
        <div className="set-frd-tabs">
          <button
            type="button"
            className={tab === 'friend' ? 'set-frd-tab active' : 'set-frd-tab'}
            onClick={() => setTab('friend')}
          >
            나의일촌
          </button>
          <button
            type="button"
            className={tab === 'request' ? 'set-frd-tab active' : 'set-frd-tab'}
            onClick={() => setTab('request')}
          >
            받은신청
          </button>
          <button
            type="button"
            className={tab === 'accept' ? 'set-frd-tab active' : 'set-frd-tab'}
            onClick={() => setTab('accept')}
          >
            보낸신청
          </button>
          <div className="set-frd-namefilter">
            <input
              type="text"
              className="set-frd-mid-input"
              placeholder="닉네임으로 필터"
              id="searchBfName"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === 'Enter')
                  router.push(
                    nameFilter
                      ? `/mnHome/settingFriends/${userNickname}/${encodeURIComponent(nameFilter)}`
                      : `/mnHome/settingFriends/${userNickname}`,
                  );
              }}
            />
            <button
              type="button"
              id="searchBf"
              onClick={() =>
                router.push(
                  nameFilter
                    ? `/mnHome/settingFriends/${userNickname}/${encodeURIComponent(nameFilter)}`
                    : `/mnHome/settingFriends/${userNickname}`,
                )
              }
            >
              찾기
            </button>
          </div>
        </div>

        <div className="set-frd-mid-bg">
          <div className="set-frd-bf-list" style={{ display: tab === 'friend' ? 'block' : 'none' }}>
            {table(bf, '아직 일촌이 없습니다.', (row) => (
              <>
                <button
                  type="button"
                  className="set-frd-bf-tb-input"
                  onClick={() => router.push(`/mnHome/mainView/${row.otherNickname}`)}
                >
                  방문하기
                </button>
                <button
                  type="button"
                  className="set-frd-bf-tb-input"
                  id="unfriend"
                  onClick={() =>
                    void updateFriendship(
                      '/mnHome/cancleFriends',
                      { seq: row.seq, del: 'Y' },
                      '일촌을 끊으시겠습니까?',
                      '일촌을 끊었습니다.',
                    )
                  }
                >
                  일촌끊기
                </button>
              </>
            ))}
          </div>

          <div
            className="set-frd-bf-request"
            style={{ display: tab === 'request' ? 'block' : 'none' }}
          >
            {table(fRes, '앗! 아직 일촌 신청이 안왔어요.', (row) => (
              <>
                <button
                  type="button"
                  className="set-frd-bf-tb-input accept"
                  onClick={() =>
                    void updateFriendship(
                      '/mnHome/acceptFriends',
                      { seq: row.seq, fStatus: 1 },
                      '일촌신청을 수락하시겠습니까?',
                      '일촌신청을 수락했습니다.',
                    )
                  }
                >
                  수락
                </button>
                <button
                  type="button"
                  className="set-frd-bf-tb-input reject"
                  onClick={() =>
                    void updateFriendship(
                      '/mnHome/rejectFriends',
                      { seq: row.seq, fStatus: -1 },
                      '일촌신청을 거절하시겠습니까?',
                      '일촌신청을 거절했습니다.',
                    )
                  }
                >
                  거절
                </button>
              </>
            ))}
          </div>

          <div
            className="set-frd-bf-accept"
            style={{ display: tab === 'accept' ? 'block' : 'none' }}
          >
            {table(fReq, '일촌 신청 목록이 없습니다.', (row) => (
              <button
                type="button"
                className="set-frd-bf-tb-input cancle"
                onClick={() =>
                  void updateFriendship(
                    '/mnHome/cancleFriends',
                    { seq: row.seq, del: 'Y' },
                    '일촌신청을 취소하시겠습니까?',
                    '일촌신청을 취소했습니다.',
                  )
                }
              >
                취소
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
