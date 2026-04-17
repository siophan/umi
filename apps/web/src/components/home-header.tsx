export function HomeHeader() {
  return (
    <header className="home-header-v3">
      <div className="mini-tabs">
        <div className="mini-tab-slider" />
        <button className="mini-tab active" type="button">
          <span className="tab-emoji">🎰</span>
          竞猜
        </button>
        <button className="mini-tab" type="button">
          <span className="tab-emoji">📺</span>
          直播竞猜
        </button>
      </div>
      <div className="hv3-spacer" />
      <div className="hv3-actions">
        <button className="hv3-action" type="button">
          ⌕
        </button>
        <button className="hv3-action" type="button">
          ◌
          <span className="notif-dot" />
        </button>
      </div>
    </header>
  );
}
