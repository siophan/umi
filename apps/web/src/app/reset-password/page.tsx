"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword, sendCode } from "../../lib/api/auth";
import styles from "./page.module.css";

type Step = "phone" | "code" | "password";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const phoneValid = /^1\d{10}$/.test(phone);
  const codeReady = code.trim().length >= 4;
  const pwdReady = newPassword.length >= 6;

  useEffect(() => {
    if (!countdown) return;
    const timer = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { window.clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleSendCode() {
    if (!phoneValid || countdown > 0) return;
    try {
      setLoading(true);
      const result = await sendCode({ phone, bizType: "reset_password" });
      if (result.devCode) setCode(result.devCode);
      setCountdown(60);
      setStep("code");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "发送失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!codeReady) return;
    setStep("password");
    setToast("验证码将在确认重置时一起校验");
  }

  async function handleReset() {
    if (!pwdReady) return;
    try {
      setLoading(true);
      await resetPassword({ phone, code, newPassword });
      setToast("密码重置成功，请重新登录");
      window.setTimeout(() => router.replace("/login"), 1500);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "重置失败");
    } finally {
      setLoading(false);
    }
  }

  const stepLabels: Record<Step, string> = {
    phone: "输入手机号",
    code: "输入验证码",
    password: "设置新密码",
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandBg} />
          <div className={styles.backWrap}>
            <Link href="/login" className={styles.backBtn} aria-label="返回登录">
              <i className="fa-solid fa-arrow-left" />
            </Link>
          </div>
          <div className={styles.brandInner}>
            <div className={styles.brandLogo}>优<span>米</span></div>
            <div className={styles.brandDesc}>{stepLabels[step]}</div>
          </div>
        </div>

        <div className={styles.stepIndicator}>
          {(["phone", "code", "password"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`${styles.stepDot} ${step === s ? styles.stepDotActive : ""} ${
                (step === "code" && i === 0) || (step === "password" && i <= 1)
                  ? styles.stepDotDone
                  : ""
              }`}
            />
          ))}
        </div>

        <div className={styles.formArea}>
          {step === "phone" && (
            <div>
              <label className={styles.field}>
                <span className={styles.fieldIcon}><i className="fa-solid fa-mobile-screen" /></span>
                <span className={styles.prefix}>+86</span>
                <input
                  type="tel"
                  placeholder="请输入手机号"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <button
                className={styles.submitBtn}
                type="button"
                disabled={!phoneValid || loading}
                onClick={() => void handleSendCode()}
              >
                <span>{loading ? "发送中..." : "发送验证码"}</span>
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          )}

          {step === "code" && (
            <div>
              <div className={styles.helperText}>验证码不会在这一步单独校验，提交重置时会和新密码一起验证。</div>
              <div className={styles.field}>
                <span className={styles.fieldIcon}><i className="fa-solid fa-shield-halved" /></span>
                <input
                  type="text"
                  placeholder="请输入6位验证码"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  className={styles.sendBtn}
                  type="button"
                  disabled={countdown > 0 || loading}
                  onClick={() => void handleSendCode()}
                >
                  {countdown > 0 ? `${countdown}s` : "重新发送"}
                </button>
              </div>
              <button
                className={styles.submitBtn}
                type="button"
                disabled={!codeReady}
                onClick={handleVerifyCode}
              >
                <span>继续设置密码</span>
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          )}

          {step === "password" && (
            <div>
              <label className={styles.field}>
                <span className={styles.fieldIcon}><i className="fa-solid fa-lock" /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入新密码（至少6位）"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  className={styles.pwdToggle}
                  type="button"
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  onClick={() => setShowPassword((s) => !s)}
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye" : "fa-eye-slash"}`} />
                </button>
              </label>
              <button
                className={styles.submitBtn}
                type="button"
                disabled={!pwdReady || loading}
                onClick={() => void handleReset()}
              >
                <span>{loading ? "重置中..." : "确认重置"}</span>
                <i className="fa-solid fa-check" />
              </button>
            </div>
          )}
        </div>

        <div className={styles.switchRow}>
          想起密码了？
          <Link href="/login" className={styles.switchLink}>返回登录</Link>
        </div>
      </div>

      <div className={`${styles.toast} ${toast ? styles.toastShow : ""}`}>{toast}</div>
    </div>
  );
}
