import React from "react";
import "./ColorSwatch.css";

const ColorSwatch = ({ colors, colorNames, selected, onSelect }) => {
    return (
        <div className="color-swatches">
            {colors.map((color, i) => (
                <button
                    key={i}
                    className={`swatch ${selected === color ? "swatch-selected" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => onSelect(color, colorNames?.[i])}
                    title={colorNames?.[i] || color}
                    type="button"
                />
            ))}
        </div>
    );
};

export default ColorSwatch;
