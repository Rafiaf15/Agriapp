"use client";

import Link from "next/link";

export default function RegisterPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: 500,
          background: "#fff",
          borderRadius: 12,
          padding: 35,
          boxShadow: "0 8px 30px rgba(0,0,0,.08)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 25,
          }}
        >
          <h2>Create Farmer Account</h2>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Register your agricultural identity
          </p>
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Full Name</label>

          <input
            style={{
              width: "100%",
              padding: 10,
              marginTop: 5,
            }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Email</label>

          <input
            style={{
              width: "100%",
              padding: 10,
              marginTop: 5,
            }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Phone Number</label>

          <input
            style={{
              width: "100%",
              padding: 10,
              marginTop: 5,
            }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label>Password</label>

          <input
            type="password"
            style={{
              width: "100%",
              padding: 10,
              marginTop: 5,
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label>Confirm Password</label>

          <input
            type="password"
            style={{
              width: "100%",
              padding: 10,
              marginTop: 5,
            }}
          />
        </div>

        <button
          style={{
            width: "100%",
            padding: 12,
            background: "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Register
        </button>

        <div
          style={{
            marginTop: 20,
            marginBottom: 20,
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          OR
        </div>

        <button
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid #d1d5db",
            background: "#fff",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          🔵 Continue with Google
        </button>

        <div
          style={{
            marginTop: 25,
            textAlign: "center",
          }}
        >
          Already have an account?

          <br />

          <Link href="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}