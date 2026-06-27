"use client";

import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="root">
      {/* LEFT PANEL */}
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

      {/* RIGHT PANEL */}
      <div className="right">{children}</div>

      <style jsx>{`
        .root {
          display: flex;
          min-height: 100vh;
        }

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
          background-image: radial-gradient(
              circle at 20% 30%,
              rgba(16, 185, 129, 0.2) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 80% 70%,
              rgba(167, 243, 208, 0.1) 0%,
              transparent 40%
            );
        }

        .left-inner {
          position: relative;
          z-index: 1;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .logo span {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
        }

        .quote p {
          font-size: 16px;
          color: #a7f3d0;
          border-left: 3px solid #10b981;
          padding-left: 14px;
        }

        .right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #fcfdfd;
        }

        @media (max-width: 700px) {
          .left {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}