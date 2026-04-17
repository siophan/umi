"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type Method = "code" | "pwd";

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

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.5 5.5-1.06-1.06L6.88 11H20v1.5H6.88l6.56 6.56 1.06-1.06L8.75 12l5.75-6.5Z" />
    </svg>
  );
}

function WechatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.5 4.5C5.46 4.5 3 6.64 3 9.28c0 1.57.84 2.95 2.13 3.82l-.57 1.88 2.08-1.06c.55.1 1.13.16 1.86.16 3.04 0 5.5-2.14 5.5-4.8S11.54 4.5 8.5 4.5Zm-2.2 4.4a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6Zm2.2 0a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6Zm9.2 2.1c.1-2.8-2.47-5.12-5.77-5.12-.56 0-1.1.06-1.6.18.67-2.47 3.06-4.26 5.96-4.26 3.41 0 6.17 2.42 6.17 5.4 0 1.57-.74 2.84-1.94 3.78l.5 1.57-1.8-.88c-.47.08-.96.13-1.52.13-.42 0-.82-.03-1.23-.08l1.23-.72Z" />
    </svg>
  );
}

function QQIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5c2.9 0 5.25 2.3 5.25 5.15 0 1.25-.47 2.39-1.25 3.28.02.07.04.14.06.22.2.8.46 1.52.82 2.12.24.41.62.82 1.12 1.12v1.26c0 .24-.17.45-.4.45h-1.72c-.24 0-.44-.2-.44-.45v-1.1c-.47-.05-.9-.16-1.27-.32-.45.65-1.18 1.1-2.16 1.1-1.01 0-1.76-.48-2.21-1.16-.38.18-.83.31-1.34.37v1.11c0 .25-.2.45-.44.45H6.23c-.23 0-.4-.2-.4-.45v-1.26c.5-.3.88-.71 1.12-1.12.36-.6.62-1.32.82-2.12.02-.08.04-.15.06-.22A5.1 5.1 0 0 1 6.75 8.65c0-2.85 2.36-5.15 5.25-5.15Zm0 2.08c-1.74 0-3.18 1.35-3.18 3.02 0 1.67 1.44 3.02 3.18 3.02s3.18-1.35 3.18-3.02c0-1.67-1.44-3.02-3.18-3.02Z" />
    </svg>
  );
}

function AppleIcon() {
  return <span className={styles.appleMark}></span>;
}

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("code");
  const [agree, setAgree] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [codePhone, setCodePhone] = useState("");
  const [codeValue, setCodeValue] = useState("");
  const [pwdPhone, setPwdPhone] = useState("");
  const [pwdValue, setPwdValue] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [toast, setToast] = useState("");

  const codePhoneValid = /^1\d{10}$/.test(codePhone);
  const pwdPhoneValid = /^1\d{10}$/.test(pwdPhone);
  const codeReady = codePhoneValid && codeValue.trim().length >= 4;
  const pwdReady = pwdPhoneValid && pwdValue.trim().length >= 6;
  const codeRowVisible = codePhoneValid;

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
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handlePhoneChange = (
    value: string,
    setter: (next: string) => void,
    forceDigitsOnly = true,
  ) => {
    const next = forceDigitsOnly ? value.replace(/\D/g, "") : value;
    setter(next.slice(0, 11));
  };

  const openToast = (message: string) => {
    setToast(message);
  };

  const sendCode = () => {
    if (!codePhoneValid) {
      openToast("请输入正确的手机号");
      return;
    }
    if (countdown > 0) return;
    setCountdown(60);
    openToast("验证码已发送 📱");
    window.setTimeout(() => {
      setCodeValue("8888");
    }, 300);
  };

  const submitCode = () => {
    if (!agree) {
      openToast("请先阅读并同意用户协议与隐私政策");
      return;
    }
    if (!codePhoneValid) {
      openToast("请输入正确的手机号");
      return;
    }
    if (!codeReady) {
      openToast("请输入验证码");
      return;
    }
    openToast("登录成功");
  };

  const submitPwd = () => {
    if (!agree) {
      openToast("请先阅读并同意用户协议与隐私政策");
      return;
    }
    if (!pwdPhoneValid) {
      openToast("请输入正确的手机号");
      return;
    }
    if (!pwdReady) {
      openToast("请输入密码");
      return;
    }
    openToast("登录成功");
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <section className={styles.brand}>
          <div className={styles.backWrap}>
            <button className={styles.backBtn} type="button" onClick={() => router.back()}>
              <ArrowIcon />
            </button>
          </div>
          <div className={styles.brandBg} />
          <div className={styles.brandInner}>
            <div className={styles.brandLogo}>
              优米
              <span>·</span>
            </div>
            <p className={styles.brandDesc}>欢迎回来，请登录您的账号</p>
          </div>
        </section>

        <section className={styles.methodBar} aria-label="登录方式切换">
          <button
            className={`${styles.methodBtn} ${method === "code" ? styles.methodBtnActive : ""}`}
            type="button"
            onClick={() => setMethod("code")}
          >
            <span className={styles.methodIcon}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3.5a8.5 8.5 0 0 0-8.5 8.5c0 1.7.5 3.28 1.35 4.61L4 20.5l3.97-1.55c1.12.53 2.37.85 3.72.85a8.5 8.5 0 0 0 0-16.3Zm-3.5 8.2a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Zm3.5 0a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z" />
              </svg>
            </span>
            验证码登录
          </button>
          <button
            className={`${styles.methodBtn} ${method === "pwd" ? styles.methodBtnActive : ""}`}
            type="button"
            onClick={() => setMethod("pwd")}
          >
            <span className={styles.methodIcon}>
              <LockIcon />
            </span>
            密码登录
          </button>
        </section>

        <section className={styles.formArea}>
          <form
            className={`${styles.formPanel} ${method === "code" ? styles.formPanelActive : ""}`}
            onSubmit={(event) => {
              event.preventDefault();
              submitCode();
            }}
          >
            <label className={styles.field}>
              <span className={styles.fieldIcon}>
                <PhoneIcon />
              </span>
              <span className={styles.prefix}>+86</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={11}
                placeholder="请输入手机号"
                value={codePhone}
                onChange={(event) => handlePhoneChange(event.target.value, setCodePhone)}
              />
            </label>

            <div className={`${styles.field} ${styles.codeRow} ${codeRowVisible ? styles.codeRowVisible : ""}`}>
              <span className={styles.fieldIcon}>
                <ShieldIcon />
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="输入验证码"
                value={codeValue}
                onChange={(event) => setCodeValue(event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <button
                className={styles.sendBtn}
                type="button"
                disabled={!codePhoneValid || countdown > 0}
                onClick={sendCode}
              >
                {countdown > 0 ? `${countdown}s` : "获取验证码"}
              </button>
            </div>

          <button className={styles.submitBtn} type="submit" disabled={!codeReady}>
            <span>登录</span>
            <ArrowIcon />
          </button>
          </form>

          <form
            className={`${styles.formPanel} ${method === "pwd" ? styles.formPanelActive : ""}`}
            onSubmit={(event) => {
              event.preventDefault();
              submitPwd();
            }}
          >
            <label className={styles.field}>
              <span className={styles.fieldIcon}>
                <PhoneIcon />
              </span>
              <span className={styles.prefix}>+86</span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={11}
                placeholder="请输入手机号"
                value={pwdPhone}
                onChange={(event) => handlePhoneChange(event.target.value, setPwdPhone)}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldIcon}>
                <LockIcon />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                maxLength={32}
                placeholder="请输入密码"
                value={pwdValue}
                onChange={(event) => setPwdValue(event.target.value)}
              />
              <button
                className={styles.pwdToggle}
                type="button"
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
                onClick={() => setShowPassword((state) => !state)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {showPassword ? (
                    <path d="M12 6.5c4.5 0 8.3 2.7 10 5.5-.7 1.2-1.6 2.3-2.7 3.2l1.4 1.4-1.1 1.1-1.5-1.5a12 12 0 0 1-6.1 1.8c-4.5 0-8.3-2.7-10-5.5.8-1.3 1.8-2.5 3-3.5L3.5 7.4l1.1-1.1 1.6 1.6A12 12 0 0 1 12 6.5Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 1.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z" />
                  ) : (
                    <path d="M12 6.5c4.5 0 8.3 2.7 10 5.5-.7 1.2-1.6 2.3-2.7 3.2l1.4 1.4-1.1 1.1-1.5-1.5a12 12 0 0 1-6.1 1.8c-4.5 0-8.3-2.7-10-5.5.8-1.3 1.8-2.5 3-3.5L3.5 7.4l1.1-1.1 1.6 1.6A12 12 0 0 1 12 6.5Zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 1.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z" />
                  )}
                </svg>
              </button>
            </label>

            <div className={styles.forgotRow}>
              <button className={styles.forgotLink} type="button" onClick={() => openToast("密码重置功能开发中")}>
                忘记密码？
              </button>
            </div>

          <button className={styles.submitBtn} type="submit" disabled={!pwdReady}>
            <span>登录</span>
            <ArrowIcon />
          </button>
        </form>
        </section>

        <div className={styles.divider}>
          <span>其他方式登录</span>
        </div>

        <section className={styles.socialRow} aria-label="社交登录">
          <button className={styles.socialBtn} type="button" style={{ background: "#07C160" }} onClick={() => openToast("微信登录开发中")}>
            <WechatIcon />
          </button>
          <button className={styles.socialBtn} type="button" style={{ background: "#12B7F5" }} onClick={() => openToast("QQ登录开发中")}>
            <QQIcon />
          </button>
          <button className={styles.socialBtn} type="button" style={{ background: "#1A1A1A" }} onClick={() => openToast("Apple 登录开发中")}>
            <AppleIcon />
          </button>
        </section>

        <div className={styles.agree}>
          <label className={styles.agreeLabel}>
            <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} />
            <span>
              我已阅读并同意
              <button type="button" className={styles.agreeLink} onClick={() => openToast("用户协议")}>
                《用户协议》
              </button>
              和
              <button type="button" className={styles.agreeLink} onClick={() => openToast("隐私政策")}>
                《隐私政策》
              </button>
            </span>
          </label>
        </div>

        <div className={styles.switchRow}>
          还没有账号？
          <Link className={styles.switchLink} href="/register">
            立即注册
          </Link>
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </main>
  );
}
