import { MobileShell } from '../../components/mobile-shell';
import { ProfileShortcuts } from '../../components/profile-shortcuts';
import { demoUser } from '../../lib/demo';

export default function MePage() {
  return (
    <MobileShell tab="me">
      <main className="profile-page">
        <section className="profile-cover">
          <div className="profile-topbar">
            <div className="profile-topbar__brand">优米</div>
            <div className="profile-topbar__actions">
              <button type="button">⌕</button>
              <button type="button">⚙</button>
            </div>
          </div>
        </section>

        <section className="profile-main">
          <div className="profile-avatar">优</div>
          <div className="profile-name-row">
            <h1>{demoUser.name}</h1>
            <span className="profile-level">Lv.7</span>
          </div>
          <div className="profile-uid">优米号 1008611</div>

          <div className="profile-stats">
            <div>
              <strong>{demoUser.following}</strong>
              <span>关注</span>
            </div>
            <div>
              <strong>{demoUser.followers}</strong>
              <span>粉丝</span>
            </div>
            <div>
              <strong>{demoUser.guesses}</strong>
              <span>竞猜</span>
            </div>
            <button type="button">编辑资料</button>
          </div>

          <p className="profile-bio">{demoUser.bio}</p>
          <ProfileShortcuts />
        </section>
      </main>
    </MobileShell>
  );
}
