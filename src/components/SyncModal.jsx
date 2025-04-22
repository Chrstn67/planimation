"use client";
import DataSyncManager from "./DataSyncManager";
import "../styles/modal.css";

export default function SyncModal({
  activities,
  animators,
  onClose,
  onDataImport,
  currentWeekDates,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal sync-modal">
        <div className="modal-header">
          <h2>Synchroniser vos données</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-content">
          <DataSyncManager
            activities={activities}
            animators={animators}
            onDataImport={onDataImport}
            currentWeekDates={currentWeekDates}
          />
        </div>
      </div>
    </div>
  );
}
