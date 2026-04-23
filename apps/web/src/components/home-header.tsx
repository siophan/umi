export function HomeHeader() {
  return (
    <header className="home-header-v3">
      <div className="mini-tabs">
        <div className="mini-tab-slider" />
        <button className="mini-tab active" type="button">
          <span className="tab-emoji"><i className="fa-solid fa-dice" /></span>
          竞猜
        </button>
        <button className="mini-tab" type="button">
          <span className="tab-emoji"><i className="fa-solid fa-tv" /></span>
          直播竞猜
        </button>
      </div>
      <div className="hv3-spacer" />
      <div className="hv3-actions">
        <button className="hv3-action" type="button">
          <i className="fa-solid fa-magnifying-glass" />
        </button>
        <button className="hv3-action" type="button">
          <i className="fa-regular fa-bell" />
        </button>
      </div>
    </header>
  );
}
