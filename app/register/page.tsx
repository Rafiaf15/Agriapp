"use client";

import { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    password: "",
    re_password: "",
    nik: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showRePass, setShowRePass] = useState(false);

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validasi Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError("Format email tidak valid (contoh: budi@domain.com).");
      setLoading(false);
      return;
    }

    // Validasi Password
    if (form.password !== form.re_password) {
      setError("Password dan Re-Password tidak cocok.");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }

    // Validasi NIK (Wajib 16 Digit Angka)
    const cleanNik = form.nik.trim();
    if (!cleanNik) {
      setError("NIK wajib diisi.");
      setLoading(false);
      return;
    }
    if (!/^\d+$/.test(cleanNik)) {
      setError("NIK harus berupa angka saja.");
      setLoading(false);
      return;
    }
    if (cleanNik.length !== 16) {
      setError("NIK harus tepat 16 digit.");
      setLoading(false);
      return;
    }

    // Validasi No HP (Wajib 10-14 karakter angka/simbol +)
    const cleanPhone = form.phone.trim();
    if (!cleanPhone) {
      setError("No HP wajib diisi.");
      setLoading(false);
      return;
    }
    if (!/^[0-9+]{10,14}$/.test(cleanPhone)) {
      setError("No HP harus berupa angka 10-14 digit (contoh: 081234567890).");
      setLoading(false);
      return;
    }

    // Validasi Alamat (Wajib, minimal 10 karakter)
    const cleanAddress = form.address.trim();
    if (!cleanAddress) {
      setError("Alamat wajib diisi.");
      setLoading(false);
      return;
    }
    if (cleanAddress.length < 10) {
      setError("Alamat lengkap minimal harus 10 karakter.");
      setLoading(false);
      return;
    }

    try {
      const formBody = new URLSearchParams();
      formBody.append("full_name", form.full_name.trim());
      formBody.append("username", form.username.trim());
      formBody.append("email", form.email.trim());
      formBody.append("password", form.password.trim());
      formBody.append("nik", cleanNik);
      formBody.append("phone", cleanPhone);
      formBody.append("address", cleanAddress);

      const res = await fetch("/api/proxy/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || errData.errors?.join(" ") || `Error: Status ${res.status}`);
        return;
      }

      const data = await res.json();

      if (data.success === false) {
        console.log("=== DEBUG REGISTER GAGAL ===");
        console.log("Respons Server:", data);
        console.log("Detail Validasi/Errors:", data.errors);
        console.log("=============================");

        setError(data.message || data.errors?.join(" ") || "Gagal register");
        return;
      }

      router.push("/login");

    } catch (err: any) {
      console.error("Detail Error Register di Browser:", err);
      setError(err?.message || "Tidak dapat terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="form-wrap">
        <h1>Register Akun</h1>
        <p>Daftarkan petani / user baru</p>

        <form onSubmit={handleSubmit}>
          <input name="full_name" placeholder="Nama Lengkap" onChange={update} required />
          <input name="username" placeholder="Username" onChange={update} required />
          <input name="email" type="email" placeholder="Email" onChange={update} required />
          
          <div className="input-group">
            <input 
              name="password" 
              type={showPass ? "text" : "password"} 
              placeholder="Password" 
              onChange={update} 
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

          <div className="input-group">
            <input 
              name="re_password" 
              type={showRePass ? "text" : "password"} 
              placeholder="Re-Password" 
              onChange={update} 
              required 
            />
            <button
              type="button"
              className="toggle-pass"
              onClick={() => setShowRePass(!showRePass)}
              tabIndex={-1}
              aria-label={showRePass ? "Sembunyikan re-password" : "Tampilkan re-password"}
            >
              {showRePass ? (
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

          <hr style={{ margin: "20px 0", border: "0", borderTop: "1px solid #e2e8f0" }} />

          <input name="nik" placeholder="NIK (16 Digit Angka)" onChange={update} required />
          <input name="phone" placeholder="No HP (10-14 Digit, cth: 08123456789)" onChange={update} required />
          <textarea name="address" placeholder="Alamat Lengkap (Minimal 10 Karakter)" onChange={update} required />

          {error && <div className="error-box">⚠️ {error}</div>}

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "10px" }}>
            {loading ? "Loading..." : "Register"}
          </button>
        </form>

        <div className="divider">
          <div className="line" />
          <span>OR</span>
          <div className="line" />
        </div>

        <button
          type="button"
          className="btn-google"
          onClick={() => {
            window.location.href = process.env.NEXT_PUBLIC_API_URL + "/auth/google";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Register with Google
        </button>

        <p className="login-link">
          Sudah punya akun?{" "}
          <button type="button" onClick={() => router.push("/login")}>
            Login
          </button>
        </p>
      </div>

      <style jsx>{`
        .form-wrap {
          width: 100%;
          max-width: 420px;
        }
        h1 {
          font-size: 28px;
          color: #065f46;
          margin-bottom: 8px;
        }
        p {
          color: #64748b;
          margin-bottom: 24px;
        }
        input,
        textarea {
          width: 100%;
          padding: 12px 14px;
          margin-bottom: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 15px;
          font-family: inherit;
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        .input-group {
          position: relative;
          width: 100%;
        }
        .input-group input {
          padding-right: 60px;
        }
        .toggle-pass {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          transform: translateY(calc(-50% - 6px)); /* adjusting for margin-bottom */
          background: none;
          border: none;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
        }
        .toggle-pass:hover {
          color: #10b981;
        }
        .btn-primary {
          width: 100%;
          padding: 12px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
          background: #059669;
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-box {
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 10px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 12px;
        }
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
        }
        .divider .line {
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }
        .divider span {
          color: #94a3b8;
          font-size: 13px;
        }
        .btn-google {
          width: 100%;
          padding: 12px;
          background: #ffffff;
          color: #334155;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s;
        }
        .btn-google:hover {
          background: #f8fafc;
        }
        .login-link {
          margin-top: 24px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
        .login-link button {
          background: none;
          border: none;
          color: #10b981;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          font-size: inherit;
        }
        .login-link button:hover {
          text-decoration: underline;
        }
      `}</style>
    </AuthLayout>
  );
}