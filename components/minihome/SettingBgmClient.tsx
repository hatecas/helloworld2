'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface BgmItem {
  seq: number;
  title: string;
  artist: string;
  runningTime: string;
}

/** views/miniHome/settingBgm.jsp + resources/js/setting.js (addPlayList / removePlayList) */
export default function SettingBgmClient({
  userNickname,
  playList,
  ownedList,
}: {
  userNickname: string;
  playList: BgmItem[];
  ownedList: BgmItem[];
}) {
  const router = useRouter();
  const [playChecked, setPlayChecked] = useState<string[]>([]);
  const [ownedChecked, setOwnedChecked] = useState<string[]>([]);

  const toggle = (list: string[], setList: (v: string[]) => void, title: string) =>
    setList(list.includes(title) ? list.filter((t) => t !== title) : [...list, title]);

  const call = async (url: string, titles: string[]) => {
    if (titles.length === 0) return;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userNickname, title: titles }),
    });
    setPlayChecked([]);
    setOwnedChecked([]);
    router.refresh();
  };

  return (
    <>
      <div className="setting-bgm-frame">
        <div className="setting-menuTitle">현재 재생목록</div>

        <div className="setting-bgm-list-group setting-bgm-grid">
          <div>
            <input
              id="checkbox-all-playlist"
              type="checkbox"
              checked={playList.length > 0 && playChecked.length === playList.length}
              onChange={(e) => setPlayChecked(e.target.checked ? playList.map((b) => b.title) : [])}
            />
          </div>
          <div>순번</div>
          <div>제목</div>
          <div>아티스트</div>
          <div>재생시간</div>
        </div>

        {playList.map((bgm, index) => (
          <div className="setting-bgm-list setting-bgm-grid" id="playListBgm" key={bgm.seq}>
            <div>
              <input
                className="playlistCheckbox"
                type="checkbox"
                checked={playChecked.includes(bgm.title)}
                onChange={() => toggle(playChecked, setPlayChecked, bgm.title)}
              />
            </div>
            <div>{index + 1}</div>
            <div className="title-list">{bgm.title}</div>
            <div>{bgm.artist}</div>
            <div>{bgm.runningTime}</div>
          </div>
        ))}

        <div className="setting-bgm-list-delete">
          <input
            type="button"
            value="삭제"
            onClick={() => void call('/mnHome/removePlayList', playChecked)}
          />
        </div>
      </div>

      <div id="setting-divDivideLine" />

      <div className="setting-bgm-frame setting-bgm-myList">
        <div className="setting-menuTitle">보유 BGM</div>

        <div className="setting-bgm-list-group setting-bgm-grid">
          <div>
            <input
              id="checkbox-all-bgm"
              type="checkbox"
              checked={ownedList.length > 0 && ownedChecked.length === ownedList.length}
              onChange={(e) =>
                setOwnedChecked(e.target.checked ? ownedList.map((b) => b.title) : [])
              }
            />
          </div>
          <div>순번</div>
          <div>제목</div>
          <div>아티스트</div>
          <div>재생시간</div>
        </div>

        {ownedList.map((bgm, index) => (
          <div className="setting-bgm-list setting-bgm-grid" key={bgm.seq}>
            <div>
              <input
                className="checkboxBgm"
                type="checkbox"
                checked={ownedChecked.includes(bgm.title)}
                onChange={() => toggle(ownedChecked, setOwnedChecked, bgm.title)}
              />
            </div>
            <div>{index + 1}</div>
            <div className="title">{bgm.title}</div>
            <div>{bgm.artist}</div>
            <div>{bgm.runningTime}</div>
          </div>
        ))}

        <div className="setting-bgm-list-add">
          <input
            type="button"
            value="재생목록추가"
            onClick={() => void call('/mnHome/addPlayList', ownedChecked)}
          />
        </div>
      </div>
    </>
  );
}
