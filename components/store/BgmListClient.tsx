'use client';

import { useState } from 'react';
import { showAlert } from '@/lib/ui/dialog';

export interface BgmRow {
  seq: number;
  title: string;
  artist: string;
  runningTime: string;
  bgmPrice: string;
  contentPath: string;
}

/** views/store/bgm.jsp — 검색 + 체크박스 선택 + 구매창 열기 */
export default function BgmListClient({ initialList }: { initialList: BgmRow[] }) {
  const [list, setList] = useState<BgmRow[]>(initialList);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  const search = async (content: string) => {
    try {
      const res = await fetch('/store/bgm/searchBgm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const json = (await res.json()) as { result: string; data: BgmRow[] };
      if (json.result === 'success') {
        setList(json.data);
        setSelected([]);
      } else {
        void showAlert('에러');
      }
    } catch {
      void showAlert('에러');
    }
  };

  const allChecked = list.length > 0 && selected.length === list.length;

  const toggle = (seq: number) =>
    setSelected((prev) => (prev.includes(seq) ? prev.filter((s) => s !== seq) : [...prev, seq]));

  const openBgmBuy = () => {
    const picked = list
      .filter((b) => selected.includes(b.seq))
      .map((b) => ({ title: b.title, artist: b.artist, price: b.bgmPrice }));

    if (picked.length === 0) {
      void showAlert('구매할 곡을 선택해주세요.');
      return;
    }

    window.open(
      `/store/bgmBuy?selectedData=${encodeURIComponent(JSON.stringify(picked))}`,
      '_blank',
      'width=800, height=600, scrollbars=no, resizable=no, toolbar=no, menubar=no, left=100, top=50',
    );
  };

  return (
    <div className="bgm-frame">
      <div className="bgm-search-group">
        <input
          type="text"
          className="bgm-search-input"
          id="searchInput"
          placeholder="제목 혹은 가수명을 입력하세요"
          maxLength={18}
          autoFocus
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            void search(e.target.value);
          }}
        />
        <button className="bgm-search-btn" id="searchBtn" onClick={() => void search(keyword)} />
      </div>

      <div className="bgm-list-group bgm-grid">
        <div>
          <input
            type="checkbox"
            id="selectAllCheckbox"
            checked={allChecked}
            onChange={(e) => setSelected(e.target.checked ? list.map((b) => b.seq) : [])}
          />
        </div>
        <div>순번</div>
        <div>제목</div>
        <div>아티스트</div>
        <div>재생시간</div>
        <div>금액</div>
      </div>

      <div id="test">
        {list.length === 0 ? (
          <div>
            <div style={{ textAlign: 'center' }}>검색 결과가 없습니다.</div>
          </div>
        ) : (
          list.map((bgm, i) => (
            <div className="bgm-list bgm-grid" key={bgm.seq} onClick={() => toggle(bgm.seq)}>
              <div>
                <input
                  type="checkbox"
                  id={`checkbox${i}`}
                  checked={selected.includes(bgm.seq)}
                  onChange={() => toggle(bgm.seq)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div>{i + 1}</div>
              <div>{bgm.title}</div>
              <div>{bgm.artist}</div>
              <div>{bgm.runningTime}</div>
              <div>{bgm.bgmPrice}</div>
            </div>
          ))
        )}
      </div>

      <div className="bgm-buy">
        <input type="button" value="구매" onClick={openBgmBuy} />
      </div>
    </div>
  );
}
