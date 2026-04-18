export default function SplashPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          borderRadius: 24,
          padding: '48px 28px',
          textAlign: 'center',
          background: 'linear-gradient(180deg,#111,#171717)',
          boxShadow: '0 32px 80px rgba(0,0,0,.6)',
        }}
      >
        <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: 4 }}>
          <span style={{ color: '#FF3333' }}>猜</span>
          <span style={{ color: '#EE2222' }}>趣</span>
          <span style={{ color: '#DD1111' }}>社</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, letterSpacing: 8, color: 'rgba(255,255,255,.25)' }}>UMe</div>
        <div style={{ marginTop: 28, color: 'rgba(255,255,255,.88)', fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>
          竞猜赢好物 · 社交新玩法
        </div>
        <div style={{ marginTop: 8, color: 'rgba(255,255,255,.35)', fontSize: 12, lineHeight: 1.7 }}>
          猜中发货 · 猜错补券 · 稳赚不亏
        </div>
        <button
          style={{
            marginTop: 28,
            width: '100%',
            height: 52,
            borderRadius: 26,
            background: 'linear-gradient(135deg,#BB1111,#EE2222,#CC1818)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: 3,
          }}
          type="button"
        >
          🎯 开始探索
        </button>
      </div>
    </main>
  );
}
