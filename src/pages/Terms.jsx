// src/pages/Terms.jsx

import { useEffect } from "react";
import PublicLegalHeader from "../components/legal/PublicLegalHeader.jsx";
import TermsDocumentContent from "../components/legal/TermsDocumentContent.jsx";
import "../components/legal/publicLegalPage.css";

export default function Terms() {
  useEffect(() => {
    document.body.classList.add("public-legal-page-active");
    return () => document.body.classList.remove("public-legal-page-active");
  }, []);

  return (
    <div className="public-legal-page">
      <PublicLegalHeader />

      <main className="public-legal-container">
        <div className="public-legal-card">
          <TermsDocumentContent variant="page" />
        </div>
      </main>
    </div>
  );
}
