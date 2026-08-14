// src/pages/Privacidade.jsx

import { useEffect } from "react";
import PublicLegalHeader from "../components/legal/PublicLegalHeader.jsx";
import PrivacyDocumentContent from "../components/legal/PrivacyDocumentContent.jsx";
import "../components/legal/publicLegalPage.css";

export default function Privacidade() {
  useEffect(() => {
    document.body.classList.add("public-legal-page-active");
    return () => document.body.classList.remove("public-legal-page-active");
  }, []);

  return (
    <div className="public-legal-page">
      <PublicLegalHeader />

      <main className="public-legal-container">
        <div className="public-legal-card">
          <PrivacyDocumentContent />
        </div>
      </main>
    </div>
  );
}
