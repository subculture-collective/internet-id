"use client";

export default function CookieSettingsButton() {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("openCookieSettings"));
    }
  };

  return (
    <button
      id="cookie-settings-btn"
      onClick={handleClick}
      style={{
        fontSize: "0.875rem",
        color: "#0070f3",
        textDecoration: "none",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      Cookie Settings
    </button>
  );
}
