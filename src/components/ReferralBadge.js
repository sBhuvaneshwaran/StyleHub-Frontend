import React from "react";
import "./ReferralBadge.css";

const logos = {
    flipkart: {
        label: "Flipkart",
        color: "#2874f0",
        icon: "🛒",
    },
    amazon: {
        label: "Amazon",
        color: "#ff9900",
        icon: "📦",
    },
};

const ReferralBadge = ({ type, url }) => {
    if (!url) return null;
    const info = logos[type];
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="referral-badge"
            style={{ "--brand-color": info.color }}
            title={`View on ${info.label}`}
        >
            <span className="ref-icon">{info.icon}</span>
            <span className="ref-label">{info.label}</span>
        </a>
    );
};

export default ReferralBadge;
