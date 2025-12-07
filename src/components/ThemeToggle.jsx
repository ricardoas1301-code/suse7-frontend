import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Carrega o tema salvo automaticamente
  useEffect(() => {
    const saved = localStorage.getItem("s7-theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  // Função que alterna o tema
  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle("dark");

    const newTheme = html.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("s7-theme", newTheme);

    setIsDark(newTheme === "dark");
  };

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}
