'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { MiniHomeCommon } from '@/lib/minihome-view';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

interface SearchResult {
  userNickname: string;
  userName: string;
  userEmail: string;
}

/**
 * 프로필 칸 맨 아래 블록 (홈피 주인 이름 + 일촌신청 버튼 + 파도타기 + 미니홈피 검색).
 * main / board / diary / … / settingSkin 이 전부 같은 마크업을 갖고 있어 따로 뺐다.
 */
export default function ProfileIdentity({ common }: { common: MiniHomeCommon }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  const searchMinihome = async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    try {
      const res = await fetch('/index/searchMinihome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const json = (await res.json()) as { results: SearchResult[] };
      setResults(json.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const visit = (nickname: string) => {
    setResults(null);
    setKeyword('');
    router.push(`/mnHome/mainView/${encodeURIComponent(nickname)}`);
  };

  const requestFriendship = async () => {
    if (!common.viewerNickname) {
      void showAlert('로그인이 필요합니다.');
      return;
    }
    if (!await showConfirm(`${common.userNickname}님께 일촌신청을 보내겠습니까?`)) return;

    try {
      const res = await fetch('/mnHome/friendRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestUser: common.viewerNickname,
          responseUser: common.userNickname,
        }),
      });
      const data = (await res.json()) as { code?: string };
      if (data.code === '1') void showAlert('일촌신청을 보냈습니다.');
      else if (data.code === '-1') void showAlert('이미 신청 내역이 있습니다.');
      else void showAlert('잠시 후 다시 시도해주세요.');
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="left-3">
      <div className="profile-username font-kyobohand">
        {common.userName}
        {common.userGender === 'M' ? '👦' : '👧'}
      </div>

      {common.canRequestFriend && (
        <button
          type="button"
          className="profile-friend-btn"
          onClick={() => void requestFriendship()}
        >
          🌳 일촌신청
        </button>
      )}

      <div className="profile-dropDown">
        <select
          id="friendSelect"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) router.push(`/mnHome/mainView/${e.target.value}`);
          }}
        >
          <option value="" disabled hidden>
            파도타기
          </option>
          {common.friends.map((friend) => (
            <option value={friend.Name} key={friend.Name}>
              {friend.Name}({friend.userEmail})
            </option>
          ))}
        </select>
      </div>

      <div className="profile-search">
        <div className="profile-search-bar">
          <input
            type="text"
            className="profile-search-input"
            placeholder="미니홈피 찾기"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === 'Enter') void searchMinihome();
            }}
          />
          <button
            type="button"
            className="profile-search-btn"
            disabled={searching}
            onClick={() => void searchMinihome()}
          >
            {searching ? '…' : '찾기'}
          </button>
        </div>

        {results !== null && (
          <div className="profile-search-results">
            {results.length === 0 ? (
              <div className="profile-search-empty">검색 결과가 없습니다.</div>
            ) : (
              results.map((r) => (
                <button
                  type="button"
                  key={r.userNickname}
                  className="profile-search-row"
                  onClick={() => visit(r.userNickname)}
                >
                  <span className="profile-search-name">{r.userName}</span>
                  <span className="profile-search-nick">({r.userNickname})</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
