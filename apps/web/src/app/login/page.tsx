import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="login-page__card">
        <section className="login-brand">
          <Link className="login-brand__back" href="/">
            ←
          </Link>
          <div className="login-brand__inner">
            <h1>优米</h1>
            <p>欢迎回来，请登录您的账号</p>
          </div>
        </section>

        <section className="login-form">
          <div className="login-switcher">
            <button className="active" type="button">
              验证码登录
            </button>
            <button type="button">密码登录</button>
          </div>

          <label className="login-field">
            <span>+86</span>
            <input placeholder="请输入手机号" type="tel" />
          </label>

          <label className="login-field">
            <span>验证码</span>
            <input placeholder="输入验证码" type="tel" />
            <button type="button">获取验证码</button>
          </label>

          <button className="login-submit" type="button">
            登录 →
          </button>

          <div className="login-divider">其他方式登录</div>
          <div className="login-socials">
            <button style={{ background: '#07c160' }} type="button">
              微
            </button>
            <button style={{ background: '#12b7f5' }} type="button">
              Q
            </button>
            <button style={{ background: '#1a1a1a' }} type="button">
              
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
