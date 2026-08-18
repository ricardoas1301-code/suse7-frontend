export default function OperationalDocCard({ doc, active = false, onSelect }) {
  return (
    <button
      type="button"
      className={`operational-docs__card ${active ? "operational-docs__card--active" : ""}`}
      onClick={() => onSelect?.(doc?.id)}
    >
      <span className="operational-docs__card-category">{doc?.category}</span>
      <strong className="operational-docs__card-title">{doc?.title}</strong>
      <span className="operational-docs__card-description">{doc?.description}</span>
    </button>
  );
}
