'use client';

import type { RefObject } from 'react';

import styles from './page.module.css';

type ProductDetailHeaderProps = {
  scrolled: boolean;
  productName: string;
  heroImages: string[];
  videoUrl: string | null;
  currentSlide: number;
  heroSliderRef: RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onShare: () => void;
  onSlideChange: (index: number) => void;
};

export function ProductDetailHeader({
  scrolled,
  productName,
  heroImages,
  videoUrl,
  currentSlide,
  heroSliderRef,
  onBack,
  onShare,
  onSlideChange,
}: ProductDetailHeaderProps) {
  const hasVideo = Boolean(videoUrl);
  const totalSlides = (hasVideo ? 1 : 0) + heroImages.length;
  const posterImage = heroImages[0] || '';

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
        </div>
      </header>

      <section className={styles.hero}>
        <div
          ref={heroSliderRef}
          className={styles.heroSlider}
          onScroll={(event) => {
            const target = event.currentTarget;
            const slide = Math.round(target.scrollLeft / target.clientWidth);
            onSlideChange(Math.max(0, Math.min(totalSlides - 1, slide)));
          }}
        >
          {hasVideo && videoUrl ? (
            <div className={styles.heroSlide} key="video">
              <video
                src={videoUrl}
                poster={posterImage || undefined}
                playsInline
                controls
                preload="metadata"
                style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
              />
            </div>
          ) : null}
          {heroImages.map((src, index) => (
            <div className={styles.heroSlide} key={`${src}-${index}`}>
              <img src={src} alt={`${productName} ${index + 1}`} />
            </div>
          ))}
        </div>
        <div className={styles.heroDots}>
          {Array.from({ length: totalSlides }).map((_, index) => (
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
          {hasVideo && currentSlide === 0 ? '视频' : `${currentSlide + (hasVideo ? 0 : 1)}/${totalSlides}`}
        </div>
      </section>
    </>
  );
}
