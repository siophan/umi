'use client';

import type { RefObject } from 'react';

import styles from './page.module.css';

type ProductDetailHeaderProps = {
  scrolled: boolean;
  productName: string;
  heroImages: string[];
  currentSlide: number;
  heroSliderRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onShare: () => void;
  onMore: () => void;
  onSlideChange: (index: number) => void;
};

export function ProductDetailHeader({
  scrolled,
  productName,
  heroImages,
  currentSlide,
  heroSliderRef,
  onBack,
  onShare,
  onMore,
  onSlideChange,
}: ProductDetailHeaderProps) {
  return (
    <>
      <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <button className={styles.navBtn} type="button" onClick={onBack}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.navTitle}>{productName}</div>
        <div className={styles.navActions}>
          <button className={styles.navBtn} type="button" onClick={onShare}>
            <i className="fa-solid fa-arrow-up-from-bracket" />
          </button>
          <button className={styles.navBtn} type="button" onClick={onMore}>
            <i className="fa-solid fa-ellipsis" />
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div
          ref={heroSliderRef}
          className={styles.heroSlider}
          onScroll={(event) => {
            const target = event.currentTarget;
            const slide = Math.round(target.scrollLeft / target.clientWidth);
            onSlideChange(Math.max(0, Math.min(heroImages.length - 1, slide)));
          }}
        >
          {heroImages.map((src, index) => (
            <div className={styles.heroSlide} key={`${src}-${index}`}>
              <img src={src} alt={`${productName} ${index + 1}`} />
            </div>
          ))}
        </div>
        <div className={styles.heroDots}>
          {heroImages.map((_, index) => (
            <button
              className={index === currentSlide ? styles.heroDotActive : styles.heroDot}
              key={index}
              type="button"
              onClick={() => {
                onSlideChange(index);
                heroSliderRef.current?.scrollTo({
                  left: heroSliderRef.current.clientWidth * index,
                  behavior: 'smooth',
                });
              }}
            />
          ))}
        </div>
        <div className={styles.heroCounter}>
          {currentSlide + 1}/{heroImages.length}
        </div>
      </section>
    </>
  );
}
