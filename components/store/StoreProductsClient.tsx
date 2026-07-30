'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

export interface StoreProduct {
  /** 화면에 보여줄 분류명 (미니미 / 스킨 / 메뉴) */
  cate: string;
  /** userStorage.category 값 */
  tableCate: 'minimi' | 'skin' | 'menu';
  name: string;
  /** 미니미는 이미지 경로, 스킨/메뉴는 색상값 */
  contentPath: string;
  price: string;
}

interface CartRow {
  name: string;
  price: number;
  contentPath: string;
  tableCate: StoreProduct['tableCate'];
}

const CATE_LABEL: Record<StoreProduct['tableCate'], string> = {
  minimi: '미니미',
  skin: '스킨',
  menu: '메뉴',
};

/**
 * views/store/minimi.jsp · skin.jsp · menu.jsp 의 상품목록 + 장바구니.
 * 세 화면의 구조가 같아서 variant 로만 구분한다. (구 resources/js/storeCart.js)
 */
export default function StoreProductsClient({
  title,
  variant,
  products,
  totalPage,
  currentPage,
  pageBaseUrl,
}: {
  title: string;
  variant: 'minimi' | 'color';
  products: StoreProduct[];
  totalPage?: number;
  currentPage?: number;
  pageBaseUrl?: string;
}) {
  const [cart, setCart] = useState<CartRow[]>([]);
  const cartListRef = useRef<HTMLDivElement>(null);

  const loadCart = useCallback(async () => {
    try {
      const res = await fetch('/store/loadCart');
      setCart((await res.json()) as CartRow[]);
    } catch {
      // 장바구니를 못 읽어도 상품 목록은 그대로 쓸 수 있게 둔다
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  useEffect(() => {
    const el = cartListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [cart]);

  const addToCart = async (product: StoreProduct) => {
    const duplicated = cart.some(
      (c) => c.tableCate === product.tableCate && c.name === product.name,
    );
    if (duplicated) {
      void showAlert('해당 상품은 이미 장바구니에 담겨있습니다.');
      return;
    }
    await fetch('/store/addToCart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableCate: product.tableCate,
        name: product.name,
        contentPath: product.contentPath,
        price: Number(product.price) || 0,
      }),
    });
    await loadCart();
  };

  const clearCart = async () => {
    await fetch('/store/clearCart', { method: 'POST' });
    setCart([]);
  };

  const buyCart = async () => {
    if (!await showConfirm('정말로 구매하시겠습니까?')) {
      void showAlert('구매가 취소되었습니다.');
      return;
    }
    try {
      const res = await fetch('/store/buyCart', { method: 'POST' });
      const msg = (await res.json()) as { success: boolean; message: string };
      await showAlert(msg.message);

      if (msg.success) {
        const dotoriRes = await fetch('/store/getUserDotoriCnt');
        const { userDotoriCnt } = (await dotoriRes.json()) as { userDotoriCnt: number };
        const el = document.getElementById('userDotoriCnt');
        if (el) el.innerText = String(userDotoriCnt);
      }
      await clearCart();
    } catch (error) {
      console.error(error);
    }
  };

  // 미니미 이미지를 클릭하면 잠깐 커졌다 사라지는 효과 (구 enlargeAndFadeOut)
  const enlargeAndFadeOut = (image: HTMLImageElement) => {
    image.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
    image.style.transform = 'scale(1.5)';
    image.style.opacity = '0';
    const reset = () => {
      image.style.transition = 'none';
      image.style.transform = 'scale(1)';
      image.style.opacity = '1';
      image.removeEventListener('transitionend', reset);
    };
    image.addEventListener('transitionend', reset);
  };

  return (
    <div className="products">
      <div className="product-title" onMouseDown={(e) => e.preventDefault()} style={{ cursor: 'default' }}>
        {title}
      </div>
      <div className="content-container">
        <div className="productList" onMouseDown={(e) => e.preventDefault()} style={{ cursor: 'default' }}>
          {products.map((product) =>
            variant === 'minimi' ? (
              <div
                className="product"
                key={`${product.tableCate}-${product.name}`}
                data-product-cate={product.cate}
                data-product-table-cate={product.tableCate}
                data-product-name={product.name}
                data-product-price={product.price}
                onClick={() => void addToCart(product)}
              >
                <div className="image-container">
                  <img
                    src={product.contentPath}
                    className="store-minimi-img"
                    alt={product.name}
                    onClick={(e) => enlargeAndFadeOut(e.currentTarget)}
                  />
                </div>
                <div className="product-name font-neo">{product.name}</div>
                <div className="product-price">{product.price}</div>
              </div>
            ) : (
              <div
                className="divOneProduct"
                key={`${product.tableCate}-${product.name}`}
                data-product-cate={product.cate}
                data-product-table-cate={product.tableCate}
                data-product-name={product.name}
                data-product-price={product.price}
                onClick={() => void addToCart(product)}
              >
                <div className="divProduct" style={{ backgroundColor: product.contentPath }}>
                  <h5 />
                </div>
                <div className="product-name">{product.name}</div>
                <div className="product-price">도토리{product.price}개</div>
              </div>
            ),
          )}
        </div>

        <div className="cart-widget" onMouseDown={(e) => e.preventDefault()} style={{ cursor: 'default' }}>
          <h2>장바구니</h2>
          <div className="cart-list-over" ref={cartListRef}>
            <table id="cart-list">
              <thead>
                <tr>
                  <th>카테고리</th>
                  <th>상품명</th>
                  <th>가격</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={`${item.tableCate}-${item.name}`}>
                    <td>{CATE_LABEL[item.tableCate] ?? item.tableCate}</td>
                    <td>{item.name}</td>
                    <td>
                      <img
                        id="dotoriIcon"
                        src="/resources/images/store/storeDotoriIcon.png"
                        alt={item.name}
                      />
                      {item.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cart-list-under">
            <input
              type="button"
              className="btnCart"
              id="btnCartClear"
              value="비우기"
              onClick={() => void clearCart()}
            />
            <input
              type="button"
              className="btnCart"
              id="btnCartBuy"
              value="구매"
              onClick={() => void buyCart()}
            />
          </div>
        </div>
      </div>

      {totalPage != null && totalPage > 1 && (
        <div className="minimi-paging" onMouseDown={(e) => e.preventDefault()} style={{ cursor: 'default' }}>
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
                window.location.href = `${pageBaseUrl}?page=${page}`;
              }}
            >
              {page}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
