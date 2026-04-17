import { MobileShell } from '../../../components/mobile-shell';
import { PageHeader } from '../../../components/page-header';
import { demoGuess } from '../../../lib/demo';

export default function GuessDetailPage() {
  const totalVotes = demoGuess.options.reduce((sum, option) => sum + option.voteCount, 0);

  return (
    <MobileShell tone="dark">
      <PageHeader backHref="/" dark title="竞猜详情" />
      <main className="guess-detail-page">
        <section
          className="guess-hero"
          style={{ backgroundImage: `url(${demoGuess.product.img})` }}
        >
          <div className="guess-hero__overlay">
            <div className="guess-hero__countdown">倒计时 00:38:21</div>
            <h1>{demoGuess.title}</h1>
            <div className="guess-hero__meta">
              <span>{demoGuess.product.brand}</span>
              <span>{demoGuess.category}</span>
              <span>{totalVotes} 人参与</span>
            </div>
          </div>
        </section>

        <section className="guess-stats">
          <div>
            <strong>{totalVotes}</strong>
            <span>总票数</span>
          </div>
          <div>
            <strong>¥{demoGuess.product.guessPrice}</strong>
            <span>竞猜价</span>
          </div>
          <div>
            <strong>2</strong>
            <span>选项</span>
          </div>
        </section>

        <section className="guess-panel">
          <h2>实时对阵</h2>
          <div className="guess-options">
            {demoGuess.options.map((option, index) => (
              <div className={`guess-option theme-${index}`} key={option.id}>
                <div className="guess-option__name">{option.optionText}</div>
                <div className="guess-option__odds">{option.odds.toFixed(2)}</div>
                <div className="guess-option__votes">{option.voteCount} 票</div>
              </div>
            ))}
          </div>
        </section>

        <section className="guess-actions">
          <button type="button">查看规则</button>
          <button className="accent" type="button">
            立即下注
          </button>
        </section>
      </main>
    </MobileShell>
  );
}
