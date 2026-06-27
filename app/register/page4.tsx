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
    nik: "",
    phone: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 🔥 SAMAKAN DENGAN LOGIN (form-urlencoded)
      const formBody = new URLSearchParams();

      formBody.append("full_name", form.full_name.trim());
      formBody.append("username", form.username.trim());
      formBody.append("email", form.email.trim());
      formBody.append("password", form.password.trim());

      formBody.append("nik", form.nik.trim());
      formBody.append("phone", form.phone.trim());
      formBody.append("address", form.address.trim());

      const res = await fetch("/api/proxy/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.errors?.join(" ") || data.message);
        return;
      }
            
      if (!data.success) {
        setError(data.message || "Gagal register");
        return;
      }

      // OPTIONAL: auto redirect login
      router.push("/login");

    } catch (err) {
      setError("Tidak dapat terhubung ke server");
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
          <input name="email" placeholder="Email" onChange={update} required />
          <input name="password" type="password" placeholder="Password" onChange={update} required />

          <hr style={{ margin: "20px 0" }} />

          <input name="nik" placeholder="NIK" onChange={update} />
          <input name="phone" placeholder="No HP" onChange={update} />
          <textarea name="address" placeholder="Alamat" onChange={update} />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button disabled={loading}>
            {loading ? "Loading..." : "Register"}
          </button>
        </form>

        <p style={{ marginTop: 15 }}>
          Sudah punya akun?{" "}
          <button onClick={() => router.push("/login")}>
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
        }

        p {
          color: #64748b;
          margin-bottom: 20px;
        }

        input,
        textarea {
          width: 100%;
          padding: 10px;
          margin-bottom: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        button {
          width: 100%;
          padding: 12px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
        }

        button:disabled {
          opacity: 0.6;
        }
      `}</style>
    </AuthLayout>
  );
}