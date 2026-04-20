import Link from 'next/link';
import styles from './page.module.css';

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/login" className={styles.back}>
          <i className="fa-solid fa-chevron-left" />
        </Link>
        <h1 className={styles.title}>用户协议</h1>
        <div className={styles.placeholder} />
      </header>

      <article className={styles.content}>
        <p className={styles.updated}>更新日期：2025年1月1日</p>

        <h2>一、服务说明</h2>
        <p>优米（以下简称"本平台"）是一个集竞猜、购物、社交于一体的综合性平台。用户在注册并使用本平台前，请仔细阅读本协议。</p>

        <h2>二、账号注册</h2>
        <p>用户注册时须提供真实、准确的个人信息。账号由用户妥善保管，因账号泄露造成的损失由用户自行承担。</p>

        <h2>三、用户行为规范</h2>
        <p>用户不得利用本平台从事违法违规活动，不得发布虚假信息、侵犯他人权益或扰乱平台秩序。</p>

        <h2>四、知识产权</h2>
        <p>本平台上的所有内容（包括但不限于文字、图片、音视频）的知识产权归本平台或相关权利人所有。</p>

        <h2>五、免责声明</h2>
        <p>本平台不对因不可抗力、网络故障等原因造成的服务中断或数据丢失承担责任。</p>

        <h2>六、协议修改</h2>
        <p>本平台有权随时修改本协议，修改后的协议将在平台公告，继续使用即视为同意。</p>

        <h2>七、联系我们</h2>
        <p>如有任何问题，请通过平台内的意见反馈渠道与我们联系。</p>
      </article>
    </div>
  );
}
