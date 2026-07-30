'use client';

import { useRef } from 'react';
import { showAlert } from '@/lib/ui/dialog';

interface SelectedBgm {
  title: string;
  artist: string;
  price: string;
}

/** views/store/bgmBuy.jsp — 선택한 곡 확인 후 구매 */
export default function BgmBuyClient({ items }: { items: SelectedBgm[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const totalPrice = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const cancel = () => {
    if (window.opener && !window.opener.closed) {
      window.opener.location.reload();
    }
    window.close();
  };

  return (
    <div className="bgmBuy-frame">
      <div className="bgmBuy-title-group">
        <div className="bgmBuy-title font-kyobohand">BGM 구매</div>
        <div className="bgmBuy-carImg">
          <img alt="쇼핑카트 이미지" src="/resources/images/default/cart.png" />
        </div>
      </div>

      <div className="bgmBuy-list-cnt font-kyobohand">
        <span className="bgmBuy-list-cnt-left">구매 곡 수 :</span>
        <span className="bgmBuy-list-cnt-right">{items.length}</span>
      </div>

      <div className="bgmBuy-list-group">
        <table className="bgmBuy-list-table">
          <thead>
            <tr>
              <th className="bgmBuy-data-title">제목</th>
              <th className="bgmBuy-data-artist">아티스트</th>
              <th className="bgmBuy-data-price">가격</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr id={`row${index}`} key={`${item.title}-${item.artist}`}>
                <td>{item.title}</td>
                <td>{item.artist}</td>
                <td>{item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bgmBuy-total font-kyobohand">
        <span className="bgmBuy-total-left">결제 예정 도토리 수 :</span>
        <span className="bgmBuy-total-right">{totalPrice}</span>
      </div>

      <div className="bgmBuy-btn-group">
        <div className="bgmBuy-btn-n">
          <input type="button" value="취소" onClick={cancel} />
        </div>
        <div className="bgmBuy-btn-y">
          <form id="bgmBuyForm" ref={formRef} action="/store/bgmBuyOk" method="post">
            <input
              type="button"
              value="구매"
              onClick={() => {
                if (items.length === 0) {
                  void showAlert('선택된 곡이 없습니다.');
                  return;
                }
                formRef.current?.submit();
              }}
            />
            <input
              type="hidden"
              name="selectedData"
              id="selectedDataField"
              value={JSON.stringify(items)}
              readOnly
            />
            <input type="hidden" name="totalPrice" value={totalPrice} readOnly />
          </form>
        </div>
      </div>
    </div>
  );
}
