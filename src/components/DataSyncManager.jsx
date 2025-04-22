"use client";

import { useState, useRef } from "react";
import { compressToBase64, decompressFromBase64 } from "lz-string";
import { saveAs } from "file-saver";
import "../styles/data-sync.css";

export default function DataSyncManager({
  activities,
  animators,
  onDataImport,
  currentWeekDates,
}) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [syncMode, setSyncMode] = useState("all"); // "all" ou "week"
  const fileInputRef = useRef(null);

  // Jours de la semaine
  const days = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  // Préparer les données pour l'exportation par fichier
  const prepareDataForExport = () => {
    try {
      let dataToExport;

      if (syncMode === "week") {
        // Filtrer les activités pour la semaine courante
        const weekActivities = activities.filter((activity) => {
          // Vérifier si l'activité a un jour valide
          return days.includes(activity.day);
        });

        dataToExport = {
          activities: weekActivities,
          animators,
          timestamp: new Date().toISOString(),
          version: "1.0",
          isPartial: true,
          weekInfo: {
            startDate: currentWeekDates?.startDate
              ? currentWeekDates.startDate.toISOString()
              : new Date().toISOString(),
            endDate: currentWeekDates?.startDate
              ? new Date(
                  currentWeekDates.startDate.getTime() + 6 * 24 * 60 * 60 * 1000
                ).toISOString()
              : new Date(
                  new Date().getTime() + 6 * 24 * 60 * 60 * 1000
                ).toISOString(),
          },
        };
      } else {
        // Exporter toutes les données
        dataToExport = {
          activities,
          animators,
          timestamp: new Date().toISOString(),
          version: "1.0",
          isPartial: false,
        };
      }

      const jsonData = JSON.stringify(dataToExport);
      return compressToBase64(jsonData);
    } catch (err) {
      console.error("Erreur lors de la préparation des données:", err);
      setError("Erreur lors de la préparation des données pour l'exportation");
      return null;
    }
  };

  const exportToFile = () => {
    try {
      const compressed = prepareDataForExport();
      if (!compressed) return;

      const dataToExport = {
        data: compressed,
        format: "calendar-sync",
        timestamp: new Date().toISOString(),
        isPartial: syncMode === "week",
      };

      const blob = new Blob([JSON.stringify(dataToExport)], {
        type: "application/octet-stream",
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      const timeStr = new Date().toLocaleTimeString().replace(/:/g, "-");

      const filename =
        syncMode === "week"
          ? `planning-semaine-${dateStr}_${timeStr}.json`
          : `planning-complet-${dateStr}_${timeStr}.json`;

      saveAs(blob, filename);
      setSuccess("Données exportées avec succès!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur lors de l'exportation:", err);
      setError("Erreur lors de l'exportation des données");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target.result;
        const parsedData = JSON.parse(fileContent);

        if (!parsedData.data || parsedData.format !== "calendar-sync") {
          throw new Error("Format de fichier invalide");
        }

        const decompressed = decompressFromBase64(parsedData.data);
        const importedData = JSON.parse(decompressed);

        if (!importedData.activities || !importedData.animators) {
          throw new Error(
            "Les données importées sont incomplètes ou corrompues"
          );
        }

        // Importer les données
        onDataImport(importedData.activities, importedData.animators);

        // Afficher un message approprié
        const message = importedData.isPartial
          ? "Données de la semaine importées avec succès!"
          : "Toutes les données importées avec succès!";

        setSuccess(message);
        setTimeout(() => setSuccess(""), 3000);
      } catch (err) {
        console.error("Erreur lors de l'importation:", err);
        setError("Erreur lors de l'importation des données: " + err.message);
        setTimeout(() => setError(""), 5000);
      }
    };

    reader.readAsText(file);
    event.target.value = null;
  };

  return (
    <div className="data-sync-container">
      <div className="sync-methods">
        <h2>Synchroniser vos données</h2>
        <p>Exportez vos données pour les transférer vers un autre appareil</p>

        <div className="sync-actions">
          <button onClick={exportToFile} className="action-button">
            Exporter les données
          </button>
          <div className="import-container">
            <button
              onClick={() => fileInputRef.current.click()}
              className="action-button"
            >
              Importer des données
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              accept=".json"
              style={{ display: "none" }}
            />
          </div>
        </div>

        <div className="sync-instructions">
          <h3>Comment synchroniser vos données</h3>
          <ol>
            <li>
              <strong>Exporter vos données :</strong>
              <ul>
                <li>
                  Cliquez sur <strong>Exporter les données</strong> pour
                  télécharger un fichier <code>.json</code>
                </li>
                <li>Ce fichier contient toutes vos activités et animateurs</li>
              </ul>
            </li>
            <li>
              <strong>Transférer le fichier :</strong>
              <ul>
                <li>
                  Envoyez le fichier <code>.json</code> vers l'autre appareil
                  via email, cloud, Drive, clé USB, etc.
                </li>
              </ul>
            </li>
            <li>
              <strong>Importer les données :</strong>
              <ul>
                <li>
                  Sur l'appareil de destination, ouvrez l'application et allez
                  dans <i>Synchroniser</i>
                </li>
                <li>
                  Cliquez sur <strong>Importer des données</strong> et
                  recherchez et sélectionnez le fichier <code>.json</code>
                </li>
                <li>
                  Les données seront automatiquement importées et remplacent les
                  données existantes
                </li>
              </ul>
            </li>
          </ol>
          <div className="sync-note">
            <strong>Note :</strong> L'importation remplace toutes les données
            existantes. Si vous souhaitez conserver certaines données,
            assurez-vous de les exporter d'abord.
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
}
