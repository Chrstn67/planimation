"use client";

import { useState, useRef } from "react";
import { compressToBase64, decompressFromBase64 } from "lz-string";
import { saveAs } from "file-saver";
import "../styles/data-sync.css";

export default function DataSyncManager({
  activities,
  animators,
  description,
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
          description,
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
        // Exporter toutes les données incluant les propriétés supplémentaires
        // des activités comme materials, objectives, preparation, evaluation
        const enrichedActivities = activities.map((activity) => ({
          ...activity,
          materials: activity.materials || "",
          objectives: activity.objectives || "",
          preparation: activity.preparation || "",
          evaluation: activity.evaluation || "",
          lastUpdated: activity.lastUpdated || new Date().toISOString(),
        }));

        dataToExport = {
          activities: enrichedActivities,
          animators,
          description,
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

  // Fonction pour fusionner intelligemment les activités
  const mergeActivities = (existingActivities, importedActivities) => {
    // Créer une map des activités existantes pour un accès rapide
    const existingMap = new Map();
    existingActivities.forEach((activity) => {
      existingMap.set(activity.id, activity);
    });

    // Tableau pour stocker les activités fusionnées
    const mergedActivities = [...existingActivities];

    // Tableau pour suivre les IDs des activités importées déjà traitées
    const processedIds = new Set();

    // Parcourir les activités importées
    importedActivities.forEach((importedActivity) => {
      // Vérifier si l'activité existe déjà
      if (existingMap.has(importedActivity.id)) {
        const existingActivity = existingMap.get(importedActivity.id);

        // Comparer les dates de dernière mise à jour
        const existingDate = new Date(existingActivity.lastUpdated || 0);
        const importedDate = new Date(importedActivity.lastUpdated || 0);

        // Si l'activité importée est plus récente, la mettre à jour
        if (importedDate > existingDate) {
          // Trouver l'index de l'activité existante
          const index = mergedActivities.findIndex(
            (a) => a.id === importedActivity.id
          );
          if (index !== -1) {
            // Remplacer l'activité existante par l'importée
            mergedActivities[index] = {
              ...importedActivity,
              // Conserver certaines propriétés locales si nécessaire
              // Par exemple, des notes locales ou des statuts spécifiques
            };
          }
        }

        // Marquer l'ID comme traité
        processedIds.add(importedActivity.id);
      } else {
        // C'est une nouvelle activité, l'ajouter
        mergedActivities.push({
          ...importedActivity,
          lastUpdated: importedActivity.lastUpdated || new Date().toISOString(),
        });

        // Marquer l'ID comme traité
        processedIds.add(importedActivity.id);
      }
    });

    return mergedActivities;
  };

  // Fonction pour fusionner les animateurs
  const mergeAnimators = (existingAnimators, importedAnimators) => {
    // Créer une map des animateurs existants
    const existingMap = new Map();
    existingAnimators.forEach((animator) => {
      existingMap.set(animator.id, animator);
    });

    // Tableau pour stocker les animateurs fusionnés
    const mergedAnimators = [...existingAnimators];

    // Parcourir les animateurs importés
    importedAnimators.forEach((importedAnimator) => {
      // Vérifier si l'animateur existe déjà
      if (!existingMap.has(importedAnimator.id)) {
        // C'est un nouvel animateur, l'ajouter
        mergedAnimators.push(importedAnimator);
      }
      // Note: On pourrait aussi implémenter une logique de mise à jour
      // des animateurs existants si nécessaire
    });

    return mergedAnimators;
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

        // Fusionner les données au lieu de les remplacer
        const mergedActivities = mergeActivities(
          activities,
          importedData.activities
        );
        const mergedAnimators = mergeAnimators(
          animators,
          importedData.animators
        );

        // Utiliser la description importée si elle existe, sinon garder l'existante
        const mergedDescription = importedData.description || description;

        // Importer les données fusionnées
        onDataImport(mergedActivities, mergedAnimators, mergedDescription);

        // Afficher un message approprié
        setSuccess("Données fusionnées avec succès!");
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
                <li>
                  Ce fichier contient toutes vos activités, animateurs et
                  descriptions
                </li>
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
                  Les données seront automatiquement fusionnées avec vos données
                  existantes
                </li>
              </ul>
            </li>
          </ol>
          <div className="sync-note">
            <strong>Note :</strong> L'importation fusionne intelligemment les
            données. Les activités existantes ne sont mises à jour que si la
            version importée est plus récente. Les nouvelles activités sont
            ajoutées automatiquement.
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
}
