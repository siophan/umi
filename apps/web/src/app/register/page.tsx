"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchMe, register, sendCode, setAuthToken } from "../../lib/api";
import styles from "./page.module.css";

const avatars = ["Nala", "Felix", "Luna", "Leo", "Milo", "Coco", "Zoe", "Max"];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [strength, setStrength] = useState(0);
  const [toast, setToast] = useState("");

  const redirect = searchParams.get("redirect") || "/";
  const phoneValid = /^1\d{10}$/.test(phone);
  const step1Ready = phoneValid && code.trim().length >= 4;
  const step2Ready = password.length >= 6 && password === confirmPassword;
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
    if (password.length >= 6) next = 1;
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) next = 2;
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) next = 3;
    setStrength(next);
  }, [password]);

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
        // Ignore unauthenticated state on register page.
      }
    }

    void ensureGuestMode();

    return () => {
      ignore = true;
    };
  }, [redirect, router]);

  const showToast = (message: string) => setToast(message);

  const handlePhone = (value: string) => setPhone(value.replace(/\D/g, "").slice(0, 11));

  const handleSendCode = async () => {
    if (!phoneValid) {
      showToast("请输入正确的手机号");
      return;
    }
    if (countdown > 0) return;

    try {
      setCountdown(60);
      const result = await sendCode({ phone, bizType: "register" });
      showToast("验证码已发送 📱");
      if (result.devCode) {
        window.setTimeout(() => {
          setCode(result.devCode ?? "");
        }, 300);
      }
    } catch (error) {
      setCountdown(0);
      showToast(error instanceof Error ? error.message : "验证码发送失败");
    }
  };

  const handleRegister = async () => {
    if (!agree) {
      showToast("请先阅读并同意用户协议与隐私政策");
      return;
    }

    if (!step3Ready) {
      showToast("请完善昵称");
      return;
    }

    try {
      const result = await register({
        phone,
        code,
        password,
        name: name.trim(),
      });
      setAuthToken(result.token);
      showToast("注册成功 🎉");
      window.setTimeout(() => {
        router.replace(redirect);
      }, 700);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "注册失败");
    }
  };

  const strengthHint =
    strength === 0 ? "密码长度至少6位" : strength === 1 ? "基础强度" : strength === 2 ? "较强密码" : "安全等级高";

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <section className={styles.brand}>
          <button className={styles.backBtn} type="button" onClick={() => router.back()}>
            <i className="fa-solid fa-arrow-left" />
          </button>
          <div className={styles.brandBg} />
          <div className={styles.brandInner}>
            <div className={styles.brandLogo}>优米</div>
            <div className={styles.brandDesc}>创建账号，开启竞猜之旅</div>
          </div>
        </section>

        <section className={styles.steps}>
          <div className={styles.stepBar}>
            <div className={styles.step}>
              <div className={`${styles.stepDot} ${step === 1 ? styles.stepActive : ""} ${step > 1 ? styles.stepDone : ""}`}>
                {step > 1 ? <i className="fa-solid fa-check" /> : 1}
              </div>
            </div>
            <div className={styles.step}>
              <div className={`${styles.stepLine} ${step >= 2 ? styles.lineDone : ""}`} />
              <div className={`${styles.stepDot} ${step === 2 ? styles.stepActive : ""} ${step > 2 ? styles.stepDone : ""}`}>
                {step > 2 ? <i className="fa-solid fa-check" /> : 2}
              </div>
            </div>
            <div className={styles.step}>
              <div className={`${styles.stepLine} ${step >= 3 ? styles.lineDone : ""}`} />
              <div className={`${styles.stepDot} ${step === 3 ? styles.stepActive : ""}`}>3</div>
            </div>
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
                  <i className="fa-solid fa-mobile-screen" />
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
                  <i className="fa-solid fa-shield-halved" />
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="输入验证码"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <button
                  className={styles.sendBtn}
                  type="button"
                  disabled={!phoneValid || countdown > 0}
                  onClick={() => {
                    void handleSendCode();
                  }}
                >
                  {countdown > 0 ? `${countdown}s` : "获取验证码"}
                </button>
              </div>
              <button className={styles.submitBtn} type="button" disabled={!step1Ready} onClick={() => setStep(2)}>
                <span>下一步</span>
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className={styles.formStep}>
              <label className={styles.field}>
                <span className={styles.fieldIcon}>
                  <i className="fa-solid fa-lock" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  maxLength={32}
                  placeholder="设置密码（至少6位）"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  className={styles.pwdToggle}
                  type="button"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye" : "fa-eye-slash"}`} />
                </button>
              </label>
              <div className={styles.pwdStrength}>
                <div className={`${styles.pwdBar} ${strength >= 1 ? styles.s1 : ""}`} />
                <div className={`${styles.pwdBar} ${strength >= 2 ? styles.s2 : ""}`} />
                <div className={`${styles.pwdBar} ${strength >= 3 ? styles.s3 : ""}`} />
              </div>
              <div
                className={`${styles.pwdHint} ${
                  strength === 1 ? styles.hint1 : strength === 2 ? styles.hint2 : strength === 3 ? styles.hint3 : ""
                }`}
              >
                {strengthHint}
              </div>
              <label className={styles.field}>
                <span className={styles.fieldIcon}>
                  <i className="fa-solid fa-lock" />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  maxLength={32}
                  placeholder="再次确认密码"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  className={styles.pwdToggle}
                  type="button"
                  aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  <i className={`fa-solid ${showConfirmPassword ? "fa-eye" : "fa-eye-slash"}`} />
                </button>
              </label>
              <button className={styles.submitBtn} type="button" disabled={!step2Ready} onClick={() => setStep(3)}>
                <span>下一步</span>
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className={styles.formStep}>
              <label className={styles.field}>
                <span className={styles.fieldIcon}>
                  <i className="fa-solid fa-user" />
                </span>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="设置昵称（2-16个字符）"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <div className={styles.avatarSection}>
                <div className={styles.avatarTitle}>选择你的头像</div>
                <div className={styles.avatarPicker}>
                  {avatars.map((seed, index) => {
                    const src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
                    return (
                      <button
                        key={seed}
                        className={`${styles.avatarItem} ${selectedAvatar === index ? styles.avatarActive : ""}`}
                        type="button"
                        onClick={() => setSelectedAvatar(index)}
                      >
                        <img src={src} alt={seed} />
                      </button>
                    );
                  })}
                </div>
              </div>
              <button className={styles.submitBtn} type="button" disabled={!step3Ready} onClick={() => void handleRegister()}>
                <span>完成注册</span>
                <i className="fa-solid fa-check" />
              </button>
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
          <button type="button" className={styles.switchLink} onClick={() => router.push(`/login?redirect=${encodeURIComponent(redirect)}`)}>
            去登录
          </button>
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </main>
  );
}
