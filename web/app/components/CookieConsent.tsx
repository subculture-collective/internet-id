"use client";

import { useEffect, useState } from "react";

type ConsentState = {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
};

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    functional: true,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const savedConsent = localStorage.getItem("cookie_consent");
    if (!savedConsent) {
      // Show banner after a short delay
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      // Load saved preferences
      try {
        const parsed = JSON.parse(savedConsent);
        setConsent(parsed);
        applyConsent(parsed);
      } catch (e) {
        console.error("Failed to parse consent:", e);
      }
    }

    // Listen for cookie settings open event from footer
    const handleOpenSettings = () => {
      setShowSettings(true);
      setIsVisible(true);
    };
    window.addEventListener("openCookieSettings", handleOpenSettings);

    // Check for Do Not Track
    const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
    if (dnt === "1" || dnt === "yes") {
      // Respect DNT - disable analytics
      const dntConsent = { essential: true, analytics: false, functional: true };
      saveConsent(dntConsent);
      applyConsent(dntConsent);
    }

    return () => {
      window.removeEventListener("openCookieSettings", handleOpenSettings);
    };
  }, []);

  const saveConsent = (consentState: ConsentState) => {
    localStorage.setItem("cookie_consent", JSON.stringify(consentState));
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
  };

  const applyConsent = (consentState: ConsentState) => {
    // Apply analytics consent
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("consent", "update", {
        analytics_storage: consentState.analytics ? "granted" : "denied",
      });
    }

    // Dispatch event for other components that need to know
    window.dispatchEvent(
      new CustomEvent("cookieConsentChanged", { detail: consentState })
    );
  };

  const handleAcceptAll = () => {
    const fullConsent = { essential: true, analytics: true, functional: true };
    setConsent(fullConsent);
    saveConsent(fullConsent);
    applyConsent(fullConsent);
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleEssentialOnly = () => {
    const minimalConsent = { essential: true, analytics: false, functional: false };
    setConsent(minimalConsent);
    saveConsent(minimalConsent);
    applyConsent(minimalConsent);
    setIsVisible(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    saveConsent(consent);
    applyConsent(consent);
    setIsVisible(false);
    setShowSettings(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
        padding: "1.5rem",
        zIndex: 9999,
        borderTop: "3px solid #0070f3",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {!showSettings ? (
          // Simple banner
          <>
            <h2
              id="cookie-consent-title"
              style={{ fontSize: "1.25rem", marginBottom: "0.75rem", fontWeight: 600 }}
            >
              🍪 We use cookies
            </h2>
            <p
              id="cookie-consent-description"
              style={{ fontSize: "0.875rem", color: "#666", marginBottom: "1rem", lineHeight: 1.6 }}
            >
              We use essential cookies to make our site work. With your consent, we may also use
              analytics cookies to improve our service. You can change your preferences at any time.
              See our{" "}
              <a href="/cookies" style={{ color: "#0070f3", textDecoration: "underline" }}>
                Cookie Policy
              </a>{" "}
              and{" "}
              <a href="/privacy" style={{ color: "#0070f3", textDecoration: "underline" }}>
                Privacy Policy
              </a>{" "}
              for more information.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={handleAcceptAll}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#0070f3",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Accept All
              </button>
              <button
                onClick={handleEssentialOnly}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#fff",
                  color: "#333",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Essential Only
              </button>
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#fff",
                  color: "#0070f3",
                  border: "1px solid #0070f3",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Customize
              </button>
            </div>
          </>
        ) : (
          // Detailed settings
          <>
            <h2
              id="cookie-consent-title"
              style={{ fontSize: "1.25rem", marginBottom: "1rem", fontWeight: 600 }}
            >
              Cookie Preferences
            </h2>
            <div style={{ marginBottom: "1.5rem" }}>
              {/* Essential Cookies */}
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "4px",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem", fontWeight: 600 }}>
                      Essential Cookies
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#666", margin: 0 }}>
                      Required for the website to function. Cannot be disabled.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    style={{ width: "20px", height: "20px" }}
                    aria-label="Essential cookies (always enabled)"
                  />
                </div>
              </div>

              {/* Analytics Cookies */}
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "4px",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem", fontWeight: 600 }}>
                      Analytics Cookies
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#666", margin: 0 }}>
                      Help us understand how visitors use our website (Google Analytics).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={consent.analytics}
                    onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                    aria-label="Analytics cookies"
                  />
                </div>
              </div>

              {/* Functional Cookies */}
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "4px",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem", fontWeight: 600 }}>
                      Functional Cookies
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "#666", margin: 0 }}>
                      Remember your preferences and settings for a better experience.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={consent.functional}
                    onChange={(e) => setConsent({ ...consent, functional: e.target.checked })}
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                    aria-label="Functional cookies"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                onClick={handleSavePreferences}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#0070f3",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#fff",
                  color: "#0070f3",
                  border: "1px solid #0070f3",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Accept All
              </button>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#fff",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
