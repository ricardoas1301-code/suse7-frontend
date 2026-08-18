import { Link } from "react-router-dom";
import "./publicBackLink.css";

/**
 * @param {{ to?: string; className?: string; onClick?: () => void }} props
 */
export default function PublicBackLink({ to = "/login", className = "", onClick }) {
  return (
    <Link to={to} className={`public-back-link${className ? ` ${className}` : ""}`} onClick={onClick}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Voltar
    </Link>
  );
}
