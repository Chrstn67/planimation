"use client";

import { useState } from "react";
import "../styles/modal.css";

export default function AnimatorModal({
  onClose,
  onSave,
  onDelete,
  animator = null,
}) {
  const [formData, setFormData] = useState(
    animator || {
      name: "",
      specialty: "",
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData); // Appelle la fonction onSave pour enregistrer les modifications
  };

  const handleDelete = () => {
    if (animator && onDelete) {
      onDelete(animator.id); // Supposons que chaque animateur ait un ID unique
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{animator ? "Modifier un animateur" : "Ajouter un animateur"}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nom</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="specialty">Spécialité</label>
            <input
              type="text"
              id="specialty"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose}>
              Annuler
            </button>
            <button type="submit">Enregistrer</button>
            {animator && (
              <>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="delete-button"
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  onClick={() => onSave(formData)}
                  className="modify-button"
                >
                  Modifier
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
