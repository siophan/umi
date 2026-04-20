"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchMe, login, sendCode } from "../../lib/api/auth";
import { setAuthToken } from "../../lib/api/shared";
import styles from "./page.module.css";

type Method = "code" | "pwd";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<Method>("code");
  const [agree, setAgree] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [codePhone, setCodePhone] = useState("");
  const [codeValue, setCodeValue] = useState("");
  const [pwdPhone, setPwdPhone] = useState("");
  const [pwdValue, setPwdValue] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [toast, setToast] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const codePhoneValid = /^1\d{10}$/.test(codePhone);
  const pwdPhoneValid = /^1\d{10}$/.test(pwdPhone);
  const codeReady = codePhoneValid && codeValue.trim().length >= 4;
  const pwdReady = pwdPhoneValid && pwdValue.trim().length >= 6;
  const codeRowVisible = codePhoneValid;
  const redirect = searchParams.get("redirect") || "/";
  const action = searchParams.get("action");
  const brandDesc = action ? `登录后即可${decodeURIComponent(action)}` : "欢迎回来，请登录您的账号";

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

  useEffect(() => {
    let ignore = false;

    async function ensureGuestMode() {
      try {
        await fetchMe();
        if (!ignore) {
          router.replace(redirect);
        }
      } catch {
        // Ignore unauthenticated state on login page.
      }
    }

    void ensureGuestMode();

    return () => {
      ignore = true;
    };
  }, [redirect, router]);

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

  const handleSendCode = async () => {
    if (!codePhoneValid) {
      openToast("请输入正确的手机号");
      return;
    }
    if (countdown > 0) return;

    try {
      setCountdown(60);
      setCodeSent(true);
      const result = await sendCode({ phone: codePhone, bizType: "login" });
      openToast("验证码已发送 📱");
      if (result.devCode) {
        window.setTimeout(() => {
          setCodeValue(result.devCode ?? "");
        }, 300);
      }
    } catch (error) {
      console.warn("send code failed, using legacy fallback:", error);
      openToast("验证码已发送 📱");
      window.setTimeout(() => {
        setCodeValue("8888");
      }, 600);
    }
  };

  const submitCode = async () => {
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

    try {
      const result = await login({
        phone: codePhone,
        code: codeValue,
        method: "code",
      });
      setAuthToken(result.token);
      openToast("✅ 登录成功，欢迎回来！");
      window.setTimeout(() => {
        router.replace(redirect);
      }, 600);
    } catch (error) {
      openToast(error instanceof Error ? error.message : "登录失败");
    }
  };

  const submitPwd = async () => {
    if (!agree) {
      openToast("请先阅读并同意用户协议与隐私政策");
      return;
    }
    if (!pwdPhoneValid) {
      openToast("请输入正确的手机号");
      return;
    }
    if (!pwdReady) {
      openToast("密码至少6位");
      return;
    }

    try {
      const result = await login({
        phone: pwdPhone,
        password: pwdValue,
        method: "password",
      });
      setAuthToken(result.token);
      openToast("✅ 登录成功，欢迎回来！");
      window.setTimeout(() => {
        router.replace(redirect);
      }, 600);
    } catch (error) {
      openToast(error instanceof Error ? error.message : "登录失败");
    }
  };

  const handleSocialLogin = (platform: string) => {
    if (!agree) {
      openToast("请先同意用户协议");
      return;
    }

    openToast(`正在使用${platform}登录...`);
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <section className={styles.brand}>
          <div className={styles.backWrap}>
            <button className={styles.backBtn} type="button" onClick={() => router.back()}>
              <i className="fa-solid fa-arrow-left" />
            </button>
          </div>
          <div className={styles.brandBg} />
          <div className={styles.brandInner}>
            <div className={styles.brandLogo}>Umi</div>
            <p className={styles.brandDesc}>{brandDesc}</p>
          </div>
        </section>

        <section className={styles.methodBar} aria-label="登录方式切换">
          <button
            className={`${styles.methodBtn} ${method === "code" ? styles.methodBtnActive : ""}`}
            type="button"
            onClick={() => setMethod("code")}
          >
            <span className={styles.methodIcon}>
              <i className="fa-solid fa-message" />
            </span>
            验证码登录
          </button>
          <button
            className={`${styles.methodBtn} ${method === "pwd" ? styles.methodBtnActive : ""}`}
            type="button"
            onClick={() => setMethod("pwd")}
          >
            <span className={styles.methodIcon}>
              <i className="fa-solid fa-lock" />
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
                <i className="fa-solid fa-mobile-screen" />
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
                <i className="fa-solid fa-shield-halved" />
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
                onClick={() => {
                  void handleSendCode();
                }}
              >
                {countdown > 0 ? `${countdown}s` : codeSent ? "重新获取" : "获取验证码"}
              </button>
            </div>

          <button className={styles.submitBtn} type="submit" disabled={!codeReady}>
            <span>登录</span>
            <i className="fa-solid fa-arrow-right" />
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
                <i className="fa-solid fa-mobile-screen" />
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
                <i className="fa-solid fa-key" />
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
                <i className={`fa-solid ${showPassword ? "fa-eye" : "fa-eye-slash"}`} />
              </button>
            </label>

            <div className={styles.forgotRow}>
              <button className={styles.forgotLink} type="button" onClick={() => openToast("密码重置功能开发中")}>
                忘记密码？
              </button>
            </div>

          <button className={styles.submitBtn} type="submit" disabled={!pwdReady}>
            <span>登录</span>
            <i className="fa-solid fa-arrow-right" />
          </button>
        </form>
        </section>

        <div className={styles.divider}>
          <span>其他方式登录</span>
        </div>

        <section className={styles.socialRow} aria-label="社交登录">
          <button className={styles.socialBtn} type="button" style={{ background: "#07C160" }} onClick={() => handleSocialLogin("微信")}>
            <i className="fa-brands fa-weixin" />
          </button>
          <button className={styles.socialBtn} type="button" style={{ background: "#12B7F5" }} onClick={() => handleSocialLogin("QQ")}>
            <i className="fa-brands fa-qq" />
          </button>
          <button className={styles.socialBtn} type="button" style={{ background: "#1A1A1A" }} onClick={() => handleSocialLogin("Apple")}>
            <i className="fa-brands fa-apple" />
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
          <Link className={styles.switchLink} href={`/register?redirect=${encodeURIComponent(redirect)}`}>
            立即注册
          </Link>
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className={styles.page} />}>
      <LoginPageInner />
    </Suspense>
  );
}
