"use client";

import { useState } from "react";
import "../styles/animator-filter.css";

export default function AnimatorFilter({ animators, onFilterChange }) {
  const [selectedAnimatorId, setSelectedAnimatorId] = useState(null);

  const handleAnimatorChange = (e) => {
    const animatorId = e.target.value === "all" ? null : Number(e.target.value);
    setSelectedAnimatorId(animatorId);
    onFilterChange(animatorId);
  };

  return (
    <div className="animator-filter">
      <label htmlFor="animator-select">Filtrer par animateur:</label>
      <select
        id="animator-select"
        value={selectedAnimatorId || "all"}
        onChange={handleAnimatorChange}
        className="animator-select"
      >
        <option value="all">Tous les animateurs</option>
        {animators
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((animator) => (
            <option key={animator.id} value={animator.id}>
              {animator.name}
            </option>
          ))}
      </select>
    </div>
  );
}
