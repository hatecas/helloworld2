'use client';

import { useEffect, useRef, useState } from 'react';

import { DOTORI_PRODUCTS } from '@/components/store/DotoriProductsClient';
import { showAlert } from '@/lib/ui/dialog';

/**
 * views/store/order.jsp
 *
 * 원본은 아임포트(iamport) SDK 로 실제 PG 결제를 태우고 /verify/{imp_uid} 로 검증했다.
 * 여기서는 목(mock) 결제로 대체했다 — 화면과 흐름은 그대로 두고 PG 호출 없이 바로
 * /store/dotoriBuy 로 넘어간다. 실제 PG 를 다시 붙이려면 requestPay() 안에서
 * SDK 를 호출하고 성공 콜백에서 submitPurchase() 를 부르면 된다.
 */
export default function OrderClient({
  selectedProduct,
  loggedIn,
}: {
  selectedProduct: number;
  loggedIn: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const checked = useRef(false);
  const [method, setMethod] = useState('kakaopay');

  const product = DOTORI_PRODUCTS.find((p) => p.count === selectedProduct);

  useEffect(() => {
    if (!loggedIn && !checked.current) {
      checked.current = true;
      void showAlert('로그인 후 이용해주세요.');
      window.close();
    }
  }, [loggedIn]);

  const requestPay = async () => {
    if (!product) {
      void showAlert('상품을 선택해주세요.');
      return;
    }
    // 목 결제: PG 호출 없이 즉시 성공 처리
    if (method !== 'free') {
      await showAlert(`결제 성공 (모의 결제 · ${method})`);
    }
    formRef.current?.submit();
  };

  return (
    <div className="store-edit-frame">
      <div className="store-edit-pad">
        <div className="edit-container-over">
          <div className="store-edit-file" />
          <div className="store-file-preview" id="preview-container" />
        </div>
        <div className="store-edit-container-under">
          <div className="store-edit-introduce">
            <div className="buyDotoriContainer">
              <div className="buyDotoriImage">
                <img
                  id="buyDotoriImage"
                  src={product ? `/resources/images/store/dotoriBuy${product.count}.png` : ''}
                  alt="도토리"
                />
              </div>
            </div>
            <div className="buyDotoriInfo">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>상품명</th>
                    <th>충전 개수</th>
                    <th>원가</th>
                    <th>할인율</th>
                    <th>결제 금액</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>도토리 충전</td>
                    <td id="buyDotoriCount">{product?.count ?? ''}</td>
                    <td id="buyDotoriOriginalPrice">{product?.originalPrice ?? ''}</td>
                    <td id="buyDotoriDiscount">{product?.discount ?? ''}</td>
                    <td id="buyDotoriPrice">{product?.label ?? ''}</td>
                  </tr>
                </tbody>
              </table>
              <div id="buyDotoriName" />
            </div>

            <div className="payMethod">결제 수단</div>
            <div className="payMethodContainer">
              <div className="payMethods">
                <select
                  id="mySelect"
                  className="simple-select"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="kakaopay">카카오페이</option>
                  <option value="html5_inicis">신용/체크카드</option>
                  <option value="free">무료충전</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="store-edit-btn">
          <input type="button" value="구매" id="btnUpload" onClick={() => void requestPay()} className="btn" />
          <input
            type="button"
            value="취소"
            id="cancel-button"
            className="btn"
            onClick={() => window.close()}
          />
        </div>
      </div>

      <form id="frmPurchase" ref={formRef} action="/store/dotoriBuy" method="post">
        <input type="hidden" name="content" value={product?.count ?? ''} readOnly />
        <input type="hidden" name="method" value={method} readOnly />
        <input type="hidden" name="price" value={product?.label ?? ''} readOnly />
      </form>
    </div>
  );
}
