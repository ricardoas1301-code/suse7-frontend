import React from "react";

const WidgetCard = ({ title, value, subtitle, cardClass }) => {
  return (
    <div className={`widget-card ${cardClass}`}>
      <div className="widget-text">
        <h3>{title}</h3>
        <p className="value">{value}</p>
        <span className="subtitle">{subtitle}</span>
      </div>

      <div className="widget-icon">
        <div className="icon-circle"></div>
      </div>
    </div>
  );
};

export default WidgetCard;
