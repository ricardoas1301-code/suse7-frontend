import React from "react";
import "./Suse7Alert.css";
import SuseLogo from "../assets/suse7-logo-redonda.png"; // coloque o caminho correto da logo

export default function Suse7Alert({ title, message, onClose }) {
  return (
    <div className="suse7-alert-overlay">
      <div className="suse7-alert-card">

        {/* LOGO */}
        <img src={SuseLogo} alt="Suse7" className="suse7-alert-logo" />

        {/* TÍTULO */}
        <h2 className="suse7-alert-title">{title}</h2>

        {/* MENSAGEM */}
        <p className="suse7-alert-message">
          {message.split("\n").map((line, idx) => (
            <span key={idx}>
              {line}
              <br />
            </span>
          ))}
        </p>

        {/* BOTÃO */}
        <button className="suse7-alert-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
