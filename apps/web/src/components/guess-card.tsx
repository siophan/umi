import Link from 'next/link';

import type { GuessSummary } from '@joy/shared';

export function GuessCard({ guess }: { guess: GuessSummary }) {
  const totalVotes = guess.options.reduce((sum, option) => sum + option.voteCount, 0);

  return (
    <Link className="guess-card" href={`/guess/${guess.id}`}>
      <div
        className="guess-card__hero"
        style={{ backgroundImage: `url(${guess.product.img})` }}
      >
        <div className="guess-card__overlay">
          <span className="guess-card__badge">倒计时 00:38:21</span>
          <h3>{guess.title}</h3>
          <div className="guess-card__meta">
            <span>{guess.product.brand}</span>
            <span>{guess.category}</span>
            <span>{totalVotes} 人参与</span>
          </div>
        </div>
      </div>

      <div className="guess-card__options">
        {guess.options.map((option, index) => (
          <div className={`guess-card__option theme-${index}`} key={option.id}>
            <div className="guess-card__option-name">{option.optionText}</div>
            <div className="guess-card__option-value">{option.odds.toFixed(2)}</div>
            <div className="guess-card__option-meta">{option.voteCount} 票</div>
          </div>
        ))}
      </div>
    </Link>
  );
}
