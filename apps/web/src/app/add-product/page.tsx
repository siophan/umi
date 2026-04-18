'use client';

import { useState } from 'react';

import styles from './page.module.css';

const brands = [
  { name: '乐事', meta: '已授权品牌 · 12 个商品', img: '/legacy/images/products/p001-lays.jpg' },
  { name: '德芙', meta: '已授权品牌 · 4 个商品', img: '/legacy/images/products/p007-dove.jpg' },
  { name: '三只松鼠', meta: '已授权品牌 · 9 个商品', img: '/legacy/images/products/p003-squirrels.jpg' },
];

const products = [
  { name: '乐事原味薯片 70g', meta: '膨化食品 · 库存 112', price: '¥12.9', ori: '¥15.9', img: '/legacy/images/products/p001-lays.jpg' },
  { name: '德芙黑巧克力礼盒', meta: '巧克力糖果 · 库存 32', price: '¥39.9', ori: '¥49.9', img: '/legacy/images/products/p007-dove.jpg' },
  { name: '三只松鼠坚果礼盒', meta: '坚果零食 · 库存 20', price: '¥99', ori: '¥128', img: '/legacy/images/products/p003-squirrels.jpg' },
];

export default function AddProductPage() {
  const [step, setStep] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([0]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} type="button" onClick={() => (step === 1 ? history.back() : setStep(step - 1))}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <span className={styles.title}>上架商品</span>
      </header>

      <div className={styles.steps}>
        {[1, 2, 3].map((item) => (
          <div className={styles.stepWrap} key={item}>
            <div className={item < step ? styles.dotDone : item === step ? styles.dotActive : styles.dot}>{item}</div>
            <span className={item === step ? styles.stepActive : item < step ? styles.stepDone : styles.stepLabel}>
              {item === 1 ? '选择品牌' : item === 2 ? '选择商品' : '竞猜设置'}
            </span>
            {item < 3 ? <div className={item < step ? styles.lineDone : styles.line} /> : null}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <section>
          <div className={styles.section}>选择已授权品牌</div>
          <div className={styles.brandList}>
            {brands.map((item, index) => (
              <button
                className={selectedBrand === index ? styles.brandSelected : styles.brandItem}
                key={item.name}
                type="button"
                onClick={() => setSelectedBrand(index)}
              >
                <img src={item.img} alt={item.name} />
                <div className={styles.brandInfo}>
                  <div className={styles.brandName}>{item.name}</div>
                  <div className={styles.brandMeta}>{item.meta}</div>
                </div>
                <span className={styles.brandCheck}>{selectedBrand === index ? '✓' : ''}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <div className={styles.section}>选择商品 <span>{selectedProducts.length} 件</span></div>
          <div className={styles.productList}>
            {products.map((item, index) => {
              const selected = selectedProducts.includes(index);
              return (
                <button
                  className={selected ? styles.productSelected : styles.productItem}
                  key={item.name}
                  type="button"
                  onClick={() =>
                    setSelectedProducts((current) =>
                      current.includes(index) ? current.filter((entry) => entry !== index) : [...current, index],
                    )
                  }
                >
                  <img src={item.img} alt={item.name} />
                  <div className={styles.productInfo}>
                    <div className={styles.productName}>{item.name}</div>
                    <div className={styles.productMeta}>{item.meta}</div>
                    <div className={styles.productPrice}>{item.price} <span>{item.ori}</span></div>
                  </div>
                  <span className={selected ? styles.checkOn : styles.check} />
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section>
          <div className={styles.section}>竞猜设置</div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>已选商品</div>
            {selectedProducts.map((index) => (
              <div className={styles.previewItem} key={products[index].name}>
                <img src={products[index].img} alt={products[index].name} />
                <div>
                  <div className={styles.previewName}>{products[index].name}</div>
                  <div className={styles.previewPrice}>{products[index].price}</div>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.card}>
            <div className={styles.cardTitle}>基础配置</div>
            <div className={styles.inputRow}><span>竞猜价格</span><input defaultValue="9.9" /></div>
            <div className={styles.inputRow}><span>开奖时间</span><input defaultValue="今晚 20:30" /></div>
            <div className={styles.inputRow}><span>参与上限</span><input defaultValue="500" /></div>
          </div>
        </section>
      ) : null}

      <footer className={styles.bottom}>
        <button className={styles.secondary} type="button">
          {step === 1 ? '取消' : '上一步'}
        </button>
        <button className={styles.primary} type="button" onClick={() => setStep((current) => Math.min(3, current + 1))}>
          {step === 3 ? '提交上架' : '下一步'}
        </button>
      </footer>
    </main>
  );
}
