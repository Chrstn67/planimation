// components/AnimatorsListModal.jsx
import React from "react";
import "../styles/modal.css"; // si tu as une feuille de style modale

export default function AnimatorsListModal({
  animators,
  onClose,
  onEdit,
  onDelete,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Liste des Animateurs</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <ul className="animators-list">
          {animators
            .slice() // pour ne pas muter le tableau original
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((animator) => (
              <li key={animator.id} className="animator-item">
                <div>
                  <strong>{animator.name}</strong> — {animator.specialty}
                </div>
                <div className="animator-actions">
                  <button onClick={() => onEdit(animator)}>Modifier</button>
                  <button onClick={() => onDelete(animator.id)}>
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
