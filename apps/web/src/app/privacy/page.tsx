import Link from 'next/link';
import styles from '../terms/page.module.css';

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/login" className={styles.back}>
          <i className="fa-solid fa-chevron-left" />
        </Link>
        <h1 className={styles.title}>隐私政策</h1>
        <div className={styles.placeholder} />
      </header>

      <article className={styles.content}>
        <p className={styles.updated}>更新日期：2025年1月1日</p>

        <h2>一、信息收集</h2>
        <p>我们收集您提供的手机号、昵称、头像等注册信息，以及您使用平台过程中产生的行为数据，用于提供和改善服务。</p>

        <h2>二、信息使用</h2>
        <p>收集的信息仅用于：提供平台服务、发送验证码、处理订单、改善用户体验。我们不会将您的个人信息出售给第三方。</p>

        <h2>三、信息存储</h2>
        <p>您的个人信息存储于中华人民共和国境内的服务器，我们采取合理的安全措施保护您的信息。</p>

        <h2>四、信息共享</h2>
        <p>在以下情况下我们可能共享您的信息：您的明确授权、法律法规要求、保护平台及用户合法权益。</p>

        <h2>五、您的权利</h2>
        <p>您有权访问、更正、删除您的个人信息。您可在"个人中心 → 设置"中管理您的账号信息，或通过意见反馈联系我们。</p>

        <h2>六、Cookie</h2>
        <p>我们使用 Cookie 等技术来保持您的登录状态和偏好设置。您可以通过浏览器设置拒绝 Cookie，但这可能影响部分功能。</p>

        <h2>七、未成年人保护</h2>
        <p>本平台不面向未满18周岁的未成年人提供服务。</p>

        <h2>八、联系我们</h2>
        <p>如对隐私政策有疑问，请通过平台内的意见反馈渠道与我们联系。</p>
      </article>
    </div>
  );
}
