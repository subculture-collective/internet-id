import Link from "next/link";
import CookieSettingsButton from "./CookieSettingsButton";
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="site-footer"
      role="contentinfo"
      style={{
        borderTop: "1px solid #eee",
        marginTop: "4rem",
        padding: "2rem 1rem",
        backgroundColor: "#fafafa",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* About Section */}
        <div>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", fontWeight: 600 }}>
            {t('about')}
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#666", lineHeight: 1.6 }}>
            Blockchain-based content verification and authentication platform.
            Protect your original work with cryptographic proof.
          </p>
        </div>

        {/* Resources */}
        <div>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", fontWeight: 600 }}>
            {t('documentation')}
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: "0.5rem" }}>
              <Link
                href="/docs/user-guide/INDEX.md"
                style={{ fontSize: "0.875rem", color: "#0070f3", textDecoration: "none" }}
              >
                User Guide
              </Link>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <a
                href="https://github.com/subculture-collective/internet-id"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.875rem", color: "#0070f3", textDecoration: "none" }}
              >
                GitHub
              </a>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <a
                href="https://github.com/subculture-collective/internet-id#readme"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.875rem", color: "#0070f3", textDecoration: "none" }}
              >
                {t('documentation')}
              </a>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", fontWeight: 600 }}>
            Legal
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: "0.5rem" }}>
              <Link
                href="/privacy"
                style={{ fontSize: "0.875rem", color: "#0070f3", textDecoration: "none" }}
              >
                {t('privacy')}
              </Link>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <Link
                href="/terms"
                style={{ fontSize: "0.875rem", color: "#0070f3", textDecoration: "none" }}
              >
                {t('terms')}
              </Link>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <Link
                href="/cookies"
                style={{ fontSize: "0.875rem", color: "#0070f3", textDecoration: "none" }}
              >
                {t('cookies')}
              </Link>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <CookieSettingsButton />
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", fontWeight: 600 }}>
            {t('contact')}
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: "0.5rem" }}>
              <a
                href="mailto:support@subculture.io"
                style={{ fontSize: "0.875rem", color: "#0070f3", textDecoration: "none" }}
              >
                {t('support')}
              </a>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <a
                href="mailto:privacy@subculture.io"
                style={{ fontSize: "0.875rem", color: "#0070f3", textDecoration: "none" }}
              >
                Privacy Inquiries
              </a>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <a
                href="https://twitter.com/subcultureio"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.875rem", color: "#0070f3", textDecoration: "none" }}
              >
                Twitter
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "2rem auto 0",
          paddingTop: "1.5rem",
          borderTop: "1px solid #e0e0e0",
          textAlign: "center",
          fontSize: "0.875rem",
          color: "#666",
        }}
      >
        <p style={{ margin: 0 }}>
          © {currentYear} Subculture Collective. {t('allRightsReserved')}
        </p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem" }}>
          Built with ❤️ for human-created content verification
        </p>
      </div>
    </footer>
  );
}
