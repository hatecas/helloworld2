'use client';

import { useState } from 'react';

/** 도토리 상품표 — 구 store/dotori.jsp 에 하드코딩돼 있던 값 그대로 */
export const DOTORI_PRODUCTS = [
  { count: 10, label: '1,100', originalPrice: '1,100', discount: '0%', price: 1100 },
  { count: 30, label: '3,300', originalPrice: '3,300', discount: '0%', price: 3300 },
  { count: 50, label: '5,200', originalPrice: '5,500', discount: '5%', price: 5200 },
  { count: 100, label: '9,900', originalPrice: '11,000', discount: '9%', price: 9900 },
  { count: 300, label: '29,000', originalPrice: '33,000', discount: '12%', price: 29000 },
];

/** views/store/dotori.jsp */
export default function DotoriProductsClient() {
  const [selected, setSelected] = useState<number>(10);

  const orderOpen = () => {
    window.open(
      `/store/orderView?selectedProduct=${encodeURIComponent(selected)}`,
      '_blank',
      'width=900,height=800',
    );
  };

  return (
    <div className="products">
      <h3>도토리 상품 목록입니다.</h3>
      <div className="product_list">
        {DOTORI_PRODUCTS.map((product) => (
          <a
            href="#"
            className="product"
            key={product.count}
            style={
              selected === product.count
                ? {
                    borderColor: 'var(--hw-accent)',
                    boxShadow: '0 0 0 3px rgba(255, 138, 61, 0.18)',
                    background: 'var(--hw-accent-soft)',
                  }
                : undefined
            }
            onClick={(e) => {
              e.preventDefault();
              setSelected(product.count);
            }}
          >
            <input
              type="radio"
              name="productSelect"
              className="product-radio"
              value={product.count}
              checked={selected === product.count}
              onChange={() => setSelected(product.count)}
            />
            <img src={`/resources/images/store/dotoriBuy${product.count}.png`} alt={`도토리 ${product.count}개`} />
            <div className="product-name">₩ {product.label}</div>
          </a>
        ))}
      </div>
      <button id="btnOrder" onClick={orderOpen}>
        구입
      </button>
    </div>
  );
}
