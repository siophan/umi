"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const avatars = [
  { name: "Nala", bg: "linear-gradient(135deg,#ff6b35,#ff2442)" },
  { name: "Luna", bg: "linear-gradient(135deg,#667eea,#764ba2)" },
  { name: "Leo", bg: "linear-gradient(135deg,#00c6ff,#0072ff)" },
  { name: "Milo", bg: "linear-gradient(135deg,#f7971e,#ffd200)" },
  { name: "Coco", bg: "linear-gradient(135deg,#56ab2f,#a8e063)" },
  { name: "Zoe", bg: "linear-gradient(135deg,#ec6ead,#ffb199)" },
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.5 5.5-1.06-1.06L6.88 11H20v1.5H6.88l6.56 6.56 1.06-1.06L8.75 12l5.75-6.5Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.5 3.5h9A2.5 2.5 0 0 1 19 6v12a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18V6a2.5 2.5 0 0 1 2.5-2.5Zm0 1.5A1 1 0 0 0 6.5 6v12a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-9Zm2.25 13.25h4.5v-1.5h-4.5v1.5Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.75 18.5 5.5v5.02c0 4.05-2.55 7.7-6.5 9.48-3.95-1.78-6.5-5.43-6.5-9.48V5.5L12 2.75Zm0 1.63-4.98 2.11v4.03c0 3.24 2.02 6.17 4.98 7.75 2.96-1.58 4.98-4.51 4.98-7.75V6.49L12 4.38Zm-.75 4.12h1.5v4.5h-1.5V8.5Zm0 5.75h1.5v1.5h-1.5v-1.5Z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.75 10V7.5a4.25 4.25 0 0 1 8.5 0V10h.75A1.5 1.5 0 0 1 18.5 11.5v8A1.5 1.5 0 0 1 17 21H7a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 7 10h.75Zm1.5 0h5.5V7.5a2.75 2.75 0 0 0-5.5 0V10Zm2.75 3a1.5 1.5 0 0 0-.75 2.8V18h1.5v-2.2a1.5 1.5 0 0 0-.75-2.8Z" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [strength, setStrength] = useState(0);
  const [toast, setToast] = useState("");

  const phoneValid = /^1\d{10}$/.test(phone);
  const step1Ready = phoneValid && code.trim().length >= 4;
  const step2Ready = pwd.length >= 6 && pwd === pwd2;
  const step3Ready = name.trim().length >= 2;

  useEffect(() => {
    if (!countdown) return;
    const timer = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    let next = 0;
    if (pwd.length >= 6) next = 1;
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) next = 2;
    if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) next = 3;
    setStrength(next);
  }, [pwd]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string) => setToast(message);

  const handlePhone = (value: string) => setPhone(value.replace(/\D/g, "").slice(0, 11));

  const sendCode = () => {
    if (!phoneValid) {
      showToast("请输入正确的手机号");
      return;
    }
    if (countdown > 0) return;
    setCountdown(60);
    setCode("8888");
    showToast("验证码已发送");
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <section className={styles.brand}>
          <button className={styles.backBtn} type="button" onClick={() => router.back()}>
            <ArrowIcon />
          </button>
          <div className={styles.brandBg} />
          <div className={styles.brandInner}>
            <div className={styles.brandLogo}>优米</div>
            <div className={styles.brandDesc}>创建账号，开启竞猜之旅</div>
          </div>
        </section>

        <section className={styles.steps}>
          <div className={styles.stepDots}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`${styles.stepDot} ${step > n ? styles.stepDone : ""} ${step === n ? styles.stepActive : ""}`}
              >
                {step > n ? "✓" : n}
              </div>
            ))}
          </div>
          <div className={styles.stepLines}>
            <span className={step >= 2 ? styles.lineDone : ""} />
            <span className={step >= 3 ? styles.lineDone : ""} />
          </div>
          <div className={styles.stepLabels}>
            <span className={step === 1 ? styles.labelActive : ""}>手机验证</span>
            <span className={step === 2 ? styles.labelActive : ""}>设置密码</span>
            <span className={step === 3 ? styles.labelActive : ""}>完善信息</span>
          </div>
        </section>

        <section className={styles.formArea}>
          {step === 1 && (
            <div className={styles.formStep}>
              <label className={styles.field}>
                <span className={styles.fieldIcon}>
                  <PhoneIcon />
                </span>
                <span className={styles.prefix}>+86</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(event) => handlePhone(event.target.value)}
                />
              </label>
              <div className={`${styles.field} ${phoneValid ? styles.rowVisible : styles.rowHidden}`}>
                <span className={styles.fieldIcon}>
                  <ShieldIcon />
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="输入验证码"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <button className={styles.sendBtn} type="button" disabled={!phoneValid || countdown > 0} onClick={sendCode}>
                  {countdown > 0 ? `${countdown}s` : "获取验证码"}
                </button>
              </div>
              <button className={styles.submitBtn} type="button" disabled={!step1Ready} onClick={() => setStep(2)}>
                <span>下一步</span>
                <ArrowIcon />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className={styles.formStep}>
              <label className={styles.field}>
                <span className={styles.fieldIcon}>
                  <LockIcon />
                </span>
                <input
                  type="password"
                  maxLength={32}
                  placeholder="设置密码（至少6位）"
                  value={pwd}
                  onChange={(event) => setPwd(event.target.value)}
                />
              </label>
              <div className={styles.strengthBar}>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={n <= strength ? styles[`strength${strength || 1}` as keyof typeof styles] : ""} />
                ))}
              </div>
              <div className={`${styles.strengthHint} ${strength === 1 ? styles.warn : strength === 2 ? styles.warn2 : strength === 3 ? styles.good : ""}`}>
                {strength === 0 && "密码长度至少6位"}
                {strength === 1 && "基础强度"}
                {strength === 2 && "较强密码"}
                {strength === 3 && "安全等级高"}
              </div>
              <label className={styles.field}>
                <span className={styles.fieldIcon}>
                  <LockIcon />
                </span>
                <input
                  type="password"
                  maxLength={32}
                  placeholder="再次确认密码"
                  value={pwd2}
                  onChange={(event) => setPwd2(event.target.value)}
                />
              </label>
              <div className={styles.buttonRow}>
                <button className={styles.secondaryBtn} type="button" onClick={() => setStep(1)}>
                  返回上一步
                </button>
                <button className={styles.submitBtn} type="button" disabled={!step2Ready} onClick={() => setStep(3)}>
                  <span>下一步</span>
                  <ArrowIcon />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.formStep}>
              <label className={styles.field}>
                <span className={styles.fieldIcon}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 12.4A4.2 4.2 0 1 0 12 4a4.2 4.2 0 0 0 0 8.4Zm0 1.8c-4 0-8 1.9-8 5.2v1.1h16v-1.1c0-3.3-4-5.2-8-5.2Z" />
                  </svg>
                </span>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="设置昵称（2-16个字符）"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>

              <div className={styles.avatarBlock}>
                <div className={styles.avatarLabel}>选择你的头像</div>
                <div className={styles.avatarGrid}>
                  {avatars.map((avatar, index) => (
                    <button
                      key={avatar.name}
                      className={`${styles.avatarItem} ${selectedAvatar === index ? styles.avatarActive : ""}`}
                      type="button"
                      onClick={() => setSelectedAvatar(index)}
                      style={{ background: avatar.bg }}
                    >
                      {avatar.name.slice(0, 1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.buttonRow}>
                <button className={styles.secondaryBtn} type="button" onClick={() => setStep(2)}>
                  返回上一步
                </button>
                <button
                  className={styles.submitBtn}
                  type="button"
                  disabled={!step3Ready}
                  onClick={() => {
                    if (!agree) {
                      showToast("请先同意协议");
                      return;
                    }
                    showToast("注册完成");
                  }}
                >
                  <span>完成注册</span>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m10.2 16.6-4.1-4.1 1.4-1.4 2.7 2.7 6.2-7 1.5 1.3-7.7 8.5Z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </section>

        <div className={styles.agree}>
          <label>
            <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} />
            我已阅读并同意
            <button type="button" className={styles.inlineLink} onClick={() => showToast("用户协议")}>
              《用户协议》
            </button>
            和
            <button type="button" className={styles.inlineLink} onClick={() => showToast("隐私政策")}>
              《隐私政策》
            </button>
          </label>
        </div>

        <div className={styles.switchRow}>
          已有账号？
          <button type="button" className={styles.switchLink} onClick={() => router.push("/login")}>
            去登录
          </button>
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </main>
  );
}
