'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { apiBaseUrl } from '../../../lib/env';
import styles from './page.module.css';

type LiveGuess = {
  title?: string | null;
  options?: string[] | null;
  odds?: Array<number | string> | null;
  endTime?: string | null;
};

type LiveDetail = {
  id: string;
  title?: string | null;
  img?: string | null;
  host?:
    | string
    | {
        name?: string | null;
        avatar?: string | null;
      }
    | null;
  hostName?: string | null;
  avatar?: string | null;
  hostAvatar?: string | null;
  viewers?: number | null;
  guessCount?: number | null;
  participants?: number | string | null;
  currentGuess?: LiveGuess | null;
};

function formatNum(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return `${value}`;
}

function getHostName(live: LiveDetail | null) {
  return (
    (typeof live?.host === 'string' ? live.host : live?.host?.name) ||
    live?.hostName ||
    '主播'
  );
}

function getHostAvatar(live: LiveDetail | null) {
  return (
    live?.avatar ||
    live?.hostAvatar ||
    (typeof live?.host === 'object' ? live.host?.avatar : '') ||
    '/legacy/images/products/p001-lays.jpg'
  );
}

export default function LiveDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [selected, setSelected] = useState(0);
  const [input, setInput] = useState('');
  const [toast, setToast] = useState('');
  const [live, setLive] = useState<LiveDetail | null>(null);
  const [error, setError] = useState('');

  const liveId = typeof params?.id === 'string' ? params.id : '';

  useEffect(() => {
    let ignore = false;

    async function loadLiveDetail() {
      if (!liveId) {
        if (!ignore) {
          setError('缺少直播ID');
        }
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/lives/${liveId}`, {
          cache: 'no-store',
        });
        const payload = (await response.json()) as {
          data?: LiveDetail | null;
          message?: string;
        };

        if (!response.ok) {
          throw new Error(payload.message || '加载失败，请稍后重试');
        }

        if (!payload.data?.id) {
          if (!ignore) {
            setError('直播不存在');
          }
          return;
        }

        if (!ignore) {
          setLive(payload.data);
          setError('');
        }
      } catch {
        if (!ignore) {
          setError('加载失败，请稍后重试');
        }
      }
    }

    void loadLiveDetail();
    return () => {
      ignore = true;
    };
  }, [liveId]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const options = useMemo(
    () => live?.currentGuess?.options?.filter(Boolean) ?? [],
    [live],
  );
  const odds = useMemo(
    () => live?.currentGuess?.odds?.map((item) => `${item}`) ?? [],
    [live],
  );

  useEffect(() => {
    setSelected(0);
  }, [options.length]);

  return (
    <main className={styles.page}>
      <section className={styles.video}>
        <div className={styles.playIcon}>
          <i className="fa-solid fa-play-circle" />
        </div>
        <div className={styles.videoTop}>
          <div className={styles.hostInfo}>
            <img src={getHostAvatar(live)} alt={getHostName(live)} />
            <span>{getHostName(live)}</span>
          </div>
          <div className={styles.viewers}>
            👁 {formatNum(Number(live?.viewers || 0))}
          </div>
        </div>
      </section>

      <section className={styles.liveContent}>
        {error ? (
          <div className={styles.errorWrap}>
            <div className={styles.errorIcon}>😢</div>
            <div className={styles.errorTitle}>{error}</div>
            <button className={styles.backBtn} type="button" onClick={() => router.push('/lives')}>
              返回直播列表
            </button>
          </div>
        ) : (
          <>
            <div className={styles.guessSection}>
              <div className={styles.guessCard}>
                <div className={styles.guessHead}>
                  <div className={styles.guessTitle}>🎯 实时竞猜</div>
                  <div className={styles.timer}>--</div>
                </div>
                <p className={styles.desc}>
                  {live?.currentGuess?.title || '暂无进行中的竞猜'}
                </p>
                <div className={styles.optionRow}>
                  {options.map((item, index) => (
                    <button
                      key={`${item}-${index}`}
                      className={selected === index ? styles.optionActive : styles.option}
                      type="button"
                      onClick={() => setSelected(index)}
                    >
                      <div className={styles.optionName}>{item}</div>
                      <div className={styles.optionOdds}>×{odds[index] || '?'}</div>
                    </button>
                  ))}
                </div>
                <button
                  className={styles.joinBtn}
                  type="button"
                  disabled
                >
                  参与竞猜暂未开放
                </button>
                <div className={styles.featureNotice}>
                  当前直播页仅展示实时信息，竞猜参与能力尚未接入真实写链路。
                </div>
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{live?.guessCount || 0}</div>
                <div className={styles.statLabel}>进行中的竞猜</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{formatNum(Number(live?.viewers || 0))}</div>
                <div className={styles.statLabel}>总参与</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{live?.participants || '--'}</div>
                <div className={styles.statLabel}>参与人次</div>
              </div>
            </div>

            <div className={styles.divider} />

            <section className={styles.danmakuSection}>
              <h3>弹幕互动</h3>
              <div className={styles.danmakuPlaceholder}>
                <div className={styles.danmakuPlaceholderTitle}>弹幕功能暂未开放</div>
                <div className={styles.danmakuPlaceholderText}>
                  当前版本未接入直播弹幕写链路，页面不会再伪装发送成功。
                </div>
              </div>
            </section>
          </>
        )}
      </section>

      <footer className={styles.inputBar}>
        <input
          className={styles.input}
          placeholder="弹幕功能暂未开放"
          value={input}
          disabled
          onChange={(event) => setInput(event.target.value)}
        />
        <button className={styles.actionBtn} type="button" disabled>
          <i className="fa-solid fa-paper-plane" />
        </button>
        <button className={styles.actionBtnMuted} type="button" disabled>
          <i className="fa-solid fa-gift" />
        </button>
        <button
          className={styles.actionBtnMuted}
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setToast('链接已复制');
            } catch {
              setToast('复制失败，请稍后重试');
            }
          }}
        >
          <i className="fa-solid fa-share-nodes" />
        </button>
      </footer>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
