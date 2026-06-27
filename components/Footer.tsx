export default function Footer() {
  return (
    <footer style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "14px 24px", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
      © 2026 {process.env.NEXT_PUBLIC_APP_NAME}. {process.env.NEXT_PUBLIC_FOOTER} | Version {process.env.NEXT_PUBLIC_VERSION}
    </footer>
  );
}