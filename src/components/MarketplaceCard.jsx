import "../styles/MarketplaceCard.css";

export default function MarketplaceCard({
  name,
  count,
  buttonText,
  color,
  icon,
  onClick, // <-- IMPORTANTE!
}) {
  return (
    <div
      className="market-card"
      style={{
        borderLeft: `6px solid ${color}`,
      }}
    >
      <div className="market-card-header">
        <span className="market-card-icon">{icon}</span>
        <h3 className="market-card-title">{name}</h3>
      </div>

      <p className="market-card-count">{count} anúncios</p>

      <button
        className="market-card-button"
        onClick={onClick}    // <-- O BOTÃO SÓ FUNCIONA SE TIVER ISSO!
      >
        {buttonText}
      </button>
    </div>
  );
}
