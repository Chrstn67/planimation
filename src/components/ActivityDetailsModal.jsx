"use client";

import { useState } from "react";
import ActivityModal from "./ActivityModal";
import "../styles/modal.css";

export default function ActivityDetailsModal({
  activity,
  animators,
  onClose,
  onEdit,
  onDelete,
}) {
  const [showEditModal, setShowEditModal] = useState(false);

  const getAnimatorNames = (animatorIds) => {
    return animatorIds
      .map((id) => {
        const animator = animators.find((a) => a.id === id);
        return animator
          ? `${animator.name} (${animator.specialty})`
          : "Inconnu";
      })
      .join(", ");
  };

  const handleDelete = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette activité ?")) {
      onDelete(activity.id);
    }
  };

  return (
    <>
      {!showEditModal ? (
        <div className="modal-overlay">
          <div className="modal details-modal">
            <div
              className="modal-header"
              style={{ backgroundColor: activity.color }}
            >
              <h2>{activity.title}</h2>
              <button className="close-button" onClick={onClose}>
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="detail-item">
                <strong>Jour de début:</strong> {activity.day}
              </div>
              {activity.multiDay && (
                <div className="detail-item">
                  <strong>Jour de fin:</strong>{" "}
                  {activity.endDay || activity.day}
                </div>
              )}
              <div className="detail-item">
                <strong>Horaire:</strong> {activity.startTime} -{" "}
                {activity.endTime}
              </div>
              <div className="detail-item">
                <strong>Animateurs:</strong>{" "}
                {getAnimatorNames(activity.animators)}
              </div>
              <div className="detail-item description">
                <strong>Description:</strong>
                <p>
                  {activity.description || "Aucune description disponible."}
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="delete-button" onClick={handleDelete}>
                Supprimer
              </button>
              <button
                className="edit-button"
                onClick={() => setShowEditModal(true)}
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      ) : (
        <ActivityModal
          activity={activity}
          animators={animators}
          onClose={() => setShowEditModal(false)}
          onSave={(updatedActivity) => {
            onEdit(updatedActivity);
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}
