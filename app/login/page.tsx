"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const formUsername = (formData.get("username") as string | null) ?? "";
    const formPassword = (formData.get("password") as string | null) ?? "";

    const trimmedUsername = formUsername.trim();
    const trimmedPassword = formPassword.trim();

    setLoading(true);

    try {
      const formBody = new URLSearchParams();
      formBody.append("username", trimmedUsername);
      formBody.append("password", trimmedPassword);

      const res = await fetch("/api/proxy/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "omit",
        body: formBody.toString(),
      });
      
      const data = await res.json();

      // The backend may return the token in different structures. Handle both.
      const tokenInfo = data.data ?? data; // prefer nested `data` if exists
      if (!tokenInfo || !tokenInfo.access_token) {
        setError(tokenInfo?.message || data.message || "Username atau password salah.");
        return;
      }
      // Store token and related info
      const accessToken = tokenInfo.access_token;
      const tokenType = tokenInfo.token_type || "Bearer";
      const expiredAt = tokenInfo.expired_at || "";
      const user = tokenInfo.user || {};
      const farmer = tokenInfo.farmer || null;
      const displayRole = user.user_level === "userfarmer" ? "Farmer" : user.user_level;

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("token_type", tokenType);
      localStorage.setItem("expired_at", expiredAt);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("farmer", JSON.stringify(farmer));
      localStorage.setItem("role_display", displayRole);
      localStorage.setItem("is_farmer", user.user_level === "userfarmer" ? "1" : "0");

      // Navigate to dashboard
      router.push("/dashboard");

    } catch {
      setError("Tidak dapat terhubung ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="root">
      {/* Panel Kiri - Hanya muncul di Desktop */}
      <div className="left">
        <div className="left-inner">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#ecfdf5" />
              <path
                d="M14 6v16M8 12l6 6 6-6"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{process.env.NEXT_PUBLIC_APP_NAME}</span>
          </div>
          <div className="quote">
            <p>{process.env.NEXT_PUBLIC_APP_JARGON}</p>
          </div>
        </div>
      </div>

      {/* Panel Kanan - Form Login */}
      <div className="right">
        <div className="form-wrap">
          <div className="form-header">
            {/* Logo Mobile - Muncul saat layar kecil */}
            <div className="mobile-logo logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="8" fill="#10b981" />
                <path d="M14 6v16M8 12l6 6 6-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>agrantara</span>
            </div>
            <h1>Selamat Datang</h1>
            <p>Masuk dengan akun agrantara Anda</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Masukkan username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass(!showPass)}
                  tabIndex={-1}
                  aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="error" aria-live="assertive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Masuk"}
            </button>
          </form>

          <div
            style={{
              marginTop: 24,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 1,
                background: "#e2e8f0",
              }}
            />

            <span
              style={{
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              OR
            </span>

            <div
              style={{
                flex: 1,
                height: 1,
                background: "#e2e8f0",
              }}
            />
          </div>

          <button
            type="button"
            className="submit"
            style={{
              background: "#ffffff",
              color: "#334155",
              border: "1px solid #d1d5db",
              boxShadow: "none",
            }}
            onClick={() => {
              window.location.href = process.env.NEXT_PUBLIC_API_URL + "/auth/google";
            }}
          >
            🔵 Login with Google
          </button>

          <div
            style={{
              marginTop: 25,
              textAlign: "center",
              fontSize: 14,
              color: "#64748b",
            }}
          >
            Belum punya akun?
          </div>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "center",
              gap: 10,
              fontSize: 14,
            }}
          >
            <button
              type="button"
              onClick={() => router.push("/register")}
              style={{
                border: "none",
                background: "transparent",
                color: "#10b981",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Register Manual
            </button>

            <span>|</span>

            <button
              type="button"
              onClick={() => {

              window.location.href = process.env.NEXT_PUBLIC_API_URL + "/auth/google";
            }}
              style={{
                border: "none",
                background: "transparent",
                color: "#2563eb",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Register Google
            </button>
          </div>

          <p className="footer-note">© 2026 Agrantara Tech. All rights reserved.</p>
        </div>
      </div>

      <style jsx>{`
        .root {
          display: flex;
          min-height: 100vh;
        }

        /* --- Left panel --- */
        .left {
          width: 450px;
          flex-shrink: 0;
          background: var(--bg-green);
          display: flex;
          align-items: flex-end;
          padding: 60px 50px;
          position: relative;
          overflow: hidden;
        }

        .left::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(167, 243, 208, 0.1) 0%, transparent 40%);
        }

        .left-inner {
          position: relative;
          z-index: 1;
          width: 100%;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .left .logo {
          position: absolute;
          top: -380px;
          left: 0;
        }

        .logo span {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -1px;
        }

        .quote p {
          font-size: 17px;
          line-height: 1.6;
          color: var(--accent-green);
          font-weight: 400;
          letter-spacing: -0.1px;
          border-left: 3px solid var(--primary-green);
          padding-left: 16px;
        }

        /* --- Right panel --- */
        .right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #fcfdfd;
        }

        .form-wrap {
          width: 100%;
          max-width: 380px;
          animation: fadeIn 0.5s ease-out both;
        }

        .form-header {
          margin-bottom: 36px;
        }

        .mobile-logo {
          display: none;
          justify-content: center;
          margin-bottom: 24px;
        }

        .mobile-logo span {
          color: var(--bg-green);
          font-size: 22px;
        }

        .form-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: var(--bg-green);
          letter-spacing: -0.8px;
          margin-bottom: 8px;
        }

        .form-header p {
          font-size: 15px;
          color: var(--text-sub);
          font-weight: 400;
        }

        /* Fields */
        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        label {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        input {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          font-size: 15px;
          font-family: inherit;
          color: var(--text-main);
          background: #fff;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          outline: none;
          transition: all 0.2s;
        }

        input::placeholder {
          color: #cbd5e1;
        }

        input:focus {
          border-color: var(--primary-green);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .input-wrap {
          position: relative;
        }

        .input-wrap input {
          padding-right: 44px;
        }

        .toggle-pass {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .toggle-pass:hover {
          color: var(--primary-green);
          background-color: #f0fdf4;
        }

        /* Error */
        .error {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 20px;
          animation: shake 0.4s linear;
        }

        /* Submit Button */
        .submit {
          width: 100%;
          height: 46px;
          background: var(--primary-green);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: -0.1px;
          margin-top: 10px;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.15);
        }

        .submit:hover:not(:disabled) {
          background: var(--hover-green);
        }

        .submit:active:not(:disabled) {
          transform: translateY(1px);
        }

        .submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .footer-note {
          margin-top: 40px;
          font-size: 13px;
          color: #94a3b8;
          text-align: center;
        }

        /* Responsif Layout */
        @media (max-width: 850px) {
          .left {
            width: 300px;
            padding: 40px;
          }
          .left .logo { top: -300px; }
          .logo span { font-size: 20px; }
          .quote p { font-size: 15px; }
        }

        @media (max-width: 700px) {
          .left {
            display: none;
          }
          .mobile-logo {
            display: flex;
          }
          .form-header h1 {
            font-size: 24px;
            text-align: center;
          }
          .form-header p {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}