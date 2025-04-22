"use client";

import { useState, useRef, useEffect } from "react";
import QRCode from "react-qr-code";
import { Html5QrcodeScanner } from "html5-qrcode";
import { compressToBase64, decompressFromBase64 } from "lz-string";
import { saveAs } from "file-saver";
import "../styles/data-sync.css";

export default function DataSyncManager({
  activities,
  animators,
  onDataImport,
  currentWeekDates,
}) {
  const [showQRCode, setShowQRCode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [syncMethod, setSyncMethod] = useState(null);
  const [compressedData, setCompressedData] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [syncMode, setSyncMode] = useState("all"); // "all" ou "week"
  const [qrCodeChunks, setQrCodeChunks] = useState([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [scannedChunks, setScannedChunks] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const fileInputRef = useRef(null);
  const scannerRef = useRef(null);

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

  // Fonction pour minimiser les données d'un animateur (enlever les champs non essentiels)
  const minimizeAnimatorData = (animator) => {
    if (!animator) return null;
    return {
      id: animator.id,
      name: animator.name,
      specialty: animator.specialty,
    };
  };

  // Fonction pour minimiser les données d'une activité (enlever les champs non essentiels)
  const minimizeActivityData = (activity) => {
    if (!activity) return null;
    return {
      id: activity.id,
      title: activity.title,
      day: activity.day,
      startTime: activity.startTime,
      endTime: activity.endTime,
      endDay: activity.endDay,
      multiDay: activity.multiDay,
      animators: activity.animators,
      color: activity.color,
      // Suppression des champs non essentiels comme description, fullDate, dates, etc.
    };
  };

  useEffect(() => {
    if (showScanner) {
      const html5QrCode = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: 250 },
        false
      );

      html5QrCode.render(
        (decodedText) => {
          handleScan(decodedText);
          html5QrCode.clear();
        },
        (errorMessage) => {
          console.warn("Erreur de scan QR : ", errorMessage);
        }
      );

      return () => {
        html5QrCode.clear().catch(() => {});
      };
    }
  }, [showScanner]);

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

  // Préparer les données pour l'exportation par QR code (divisées par animateur)
  const prepareQRCodeChunks = () => {
    try {
      const chunks = [];

      // Vérifier si currentWeekDates existe et a une startDate
      const weekStartDate = currentWeekDates?.startDate
        ? currentWeekDates.startDate.toISOString()
        : new Date().toISOString();
      const weekEndDate = currentWeekDates?.startDate
        ? new Date(
            currentWeekDates.startDate.getTime() + 6 * 24 * 60 * 60 * 1000
          ).toISOString()
        : new Date(
            new Date().getTime() + 6 * 24 * 60 * 60 * 1000
          ).toISOString();

      // Minimiser les données des activités
      const minimizedActivities = activities.map(minimizeActivityData);

      // Créer un chunk pour les informations générales et les activités
      const generalInfo = {
        type: "info",
        chunkIndex: 0,
        totalChunks: animators.length + 1, // +1 pour le chunk d'info
        timestamp: new Date().toISOString(),
        version: "1.0",
        weekInfo: {
          startDate: weekStartDate,
          endDate: weekEndDate,
        },
        activities: minimizedActivities,
      };

      const infoChunk = JSON.stringify(generalInfo);
      const compressedInfoChunk = compressToBase64(infoChunk);

      // Vérifier la taille du chunk d'info
      if (compressedInfoChunk.length > 2000) {
        // Si le chunk d'info est trop grand, diviser les activités en plusieurs chunks
        const activitiesPerChunk = 10;
        const activityChunks = [];

        for (
          let i = 0;
          i < minimizedActivities.length;
          i += activitiesPerChunk
        ) {
          activityChunks.push(
            minimizedActivities.slice(i, i + activitiesPerChunk)
          );
        }

        // Créer un chunk d'info sans activités
        const infoWithoutActivities = {
          type: "info",
          chunkIndex: 0,
          totalChunks: animators.length + activityChunks.length + 1,
          timestamp: new Date().toISOString(),
          version: "1.0",
          weekInfo: {
            startDate: weekStartDate,
            endDate: weekEndDate,
          },
          activitiesCount: minimizedActivities.length,
        };

        const infoChunkWithoutActivities = JSON.stringify(
          infoWithoutActivities
        );
        const compressedInfoChunkWithoutActivities = compressToBase64(
          infoChunkWithoutActivities
        );
        chunks.push(compressedInfoChunkWithoutActivities);

        // Ajouter les chunks d'activités
        activityChunks.forEach((activityChunk, index) => {
          const activityChunkData = {
            type: "activities",
            chunkIndex: index + 1,
            totalChunks: animators.length + activityChunks.length + 1,
            activities: activityChunk,
          };

          const activityChunkJson = JSON.stringify(activityChunkData);
          const compressedActivityChunk = compressToBase64(activityChunkJson);
          chunks.push(compressedActivityChunk);
        });

        // Ajuster l'index de départ pour les animateurs
        const animatorStartIndex = activityChunks.length + 1;

        // Créer un chunk pour chaque animateur
        animators.forEach((animator, index) => {
          const minimizedAnimator = minimizeAnimatorData(animator);

          const animatorData = {
            type: "animator",
            animatorId: animator.id,
            animatorName: animator.name,
            chunkIndex: animatorStartIndex + index,
            totalChunks: animators.length + activityChunks.length + 1,
            animator: minimizedAnimator,
          };

          const animatorChunk = JSON.stringify(animatorData);
          const compressedAnimatorChunk = compressToBase64(animatorChunk);
          chunks.push(compressedAnimatorChunk);
        });
      } else {
        // Si le chunk d'info n'est pas trop grand, utiliser l'approche originale
        chunks.push(compressedInfoChunk);

        // Créer un chunk pour chaque animateur
        animators.forEach((animator, index) => {
          const minimizedAnimator = minimizeAnimatorData(animator);

          const animatorData = {
            type: "animator",
            animatorId: animator.id,
            animatorName: animator.name,
            chunkIndex: index + 1,
            totalChunks: animators.length + 1,
            animator: minimizedAnimator,
          };

          const animatorChunk = JSON.stringify(animatorData);
          const compressedAnimatorChunk = compressToBase64(animatorChunk);
          chunks.push(compressedAnimatorChunk);
        });
      }

      return chunks;
    } catch (err) {
      console.error("Erreur lors de la préparation des chunks QR:", err);
      setError("Erreur lors de la préparation des QR codes");
      return [];
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
        type: "application/json",
      });

      const filename =
        syncMode === "week"
          ? `calendar-week-${new Date().toISOString().slice(0, 10)}.json`
          : `calendar-all-data-${new Date().toISOString().slice(0, 10)}.json`;

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

  const generateQRCodes = () => {
    try {
      const chunks = prepareQRCodeChunks();
      if (chunks.length === 0) {
        setError("Aucune donnée à exporter");
        setTimeout(() => setError(""), 3000);
        return;
      }

      // Vérifier la taille de chaque chunk
      const oversizedChunks = chunks.filter((chunk) => chunk.length > 2300);
      if (oversizedChunks.length > 0) {
        console.warn(
          `${oversizedChunks.length} chunks sont trop volumineux:`,
          oversizedChunks.map(
            (chunk, i) => `Chunk ${i}: ${chunk.length} caractères`
          )
        );
        setError(
          `Certaines données sont encore trop volumineuses pour un QR code. Essayez de réduire le nombre d'activités ou d'animateurs.`
        );
        setTimeout(() => setError(""), 5000);
        return;
      }

      setQrCodeChunks(chunks);
      setTotalChunks(chunks.length);
      setCurrentChunkIndex(0);
      setShowQRCode(true);
    } catch (err) {
      console.error("Erreur lors de la génération des QR codes:", err);
      setError("Erreur lors de la génération des QR codes");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleScan = (data) => {
    try {
      // Décompresser les données du QR code
      const decompressed = decompressFromBase64(data);
      const chunkData = JSON.parse(decompressed);

      // Vérifier le type de chunk
      if (chunkData.type === "info") {
        // Réinitialiser les chunks scannés si c'est le premier chunk (info)
        setScannedChunks([chunkData]);
        setTotalChunks(chunkData.totalChunks);
        setSuccess(
          `QR code 1/${chunkData.totalChunks} scanné avec succès! Scannez les autres QR codes.`
        );
      } else if (chunkData.type === "activities") {
        // Ajouter le chunk d'activités aux chunks scannés
        setScannedChunks((prev) => {
          const newChunks = [...prev, chunkData];

          // Vérifier si tous les chunks ont été scannés
          if (newChunks.length === totalChunks) {
            // Reconstruire les données complètes
            reconstructData(newChunks);
            return [];
          }

          setSuccess(
            `QR code ${chunkData.chunkIndex + 1}/${
              chunkData.totalChunks
            } scanné avec succès! ${newChunks.length}/${
              chunkData.totalChunks
            } QR codes scannés.`
          );
          return newChunks;
        });
      } else if (chunkData.type === "animator") {
        // Ajouter le chunk d'animateur aux chunks scannés
        setScannedChunks((prev) => {
          const newChunks = [...prev, chunkData];

          // Vérifier si tous les chunks ont été scannés
          if (newChunks.length === totalChunks) {
            // Reconstruire les données complètes
            reconstructData(newChunks);
            return [];
          }

          setSuccess(
            `QR code ${chunkData.chunkIndex + 1}/${
              chunkData.totalChunks
            } scanné avec succès! ${newChunks.length}/${
              chunkData.totalChunks
            } QR codes scannés.`
          );
          return newChunks;
        });
      } else {
        throw new Error("Format de QR code non reconnu");
      }
    } catch (err) {
      console.error("Erreur lors du scan du QR code:", err);
      setError(
        "Erreur lors de l'importation depuis le QR code: " + err.message
      );
      setTimeout(() => setError(""), 5000);
    }
  };

  // Fonction pour reconstruire les données à partir des chunks scannés
  const reconstructData = (chunks) => {
    try {
      // Trouver le chunk d'info
      const infoChunk = chunks.find((chunk) => chunk.type === "info");
      if (!infoChunk) {
        throw new Error("Informations générales manquantes");
      }

      // Extraire les activités
      let activities = [];

      if (infoChunk.activities) {
        // Si les activités sont dans le chunk d'info
        activities = infoChunk.activities;
      } else {
        // Si les activités sont dans des chunks séparés
        const activityChunks = chunks.filter(
          (chunk) => chunk.type === "activities"
        );
        activityChunks.forEach((chunk) => {
          if (chunk.activities && Array.isArray(chunk.activities)) {
            activities = [...activities, ...chunk.activities];
          }
        });
      }

      // Reconstruire les animateurs à partir des chunks d'animateurs
      const animators = [];
      chunks.forEach((chunk) => {
        if (chunk.type === "animator" && chunk.animator) {
          animators.push(chunk.animator);
        }
      });

      // Importer les données reconstruites
      onDataImport(activities, animators);

      setSuccess("Toutes les données ont été importées avec succès!");
      setShowScanner(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Erreur lors de la reconstruction des données:", err);
      setError("Erreur lors de la reconstruction des données: " + err.message);
      setTimeout(() => setError(""), 5000);
    }
  };

  // Navigation entre les QR codes
  const goToNextChunk = () => {
    if (currentChunkIndex < qrCodeChunks.length - 1) {
      setCurrentChunkIndex(currentChunkIndex + 1);
    }
  };

  const goToPrevChunk = () => {
    if (currentChunkIndex > 0) {
      setCurrentChunkIndex(currentChunkIndex - 1);
    }
  };

  // Obtenir le titre du QR code actuel
  const getCurrentQRCodeTitle = () => {
    if (qrCodeChunks.length === 0) return "";

    try {
      const chunkData = JSON.parse(
        decompressFromBase64(qrCodeChunks[currentChunkIndex])
      );

      if (chunkData.type === "info") {
        return "Informations générales et activités";
      } else if (chunkData.type === "activities") {
        return `Activités (partie ${chunkData.chunkIndex})`;
      } else if (chunkData.type === "animator") {
        return `Animateur: ${
          chunkData.animatorName || `#${chunkData.animatorId}`
        }`;
      }

      return `QR Code ${currentChunkIndex + 1}`;
    } catch (err) {
      console.error("Erreur lors de la lecture du titre du QR code:", err);
      return `QR Code ${currentChunkIndex + 1}`;
    }
  };

  return (
    <div className="data-sync-container">
      {!syncMethod ? (
        <div className="sync-methods">
          <h2>Synchroniser vos données</h2>
          <p>
            Choisissez une méthode pour transférer vos données entre appareils:
          </p>
          <div className="sync-buttons">
            <button
              onClick={() => setSyncMethod("file")}
              className="sync-button"
            >
              <span className="icon">📄</span>
              <span>Fichier</span>
            </button>
            <button
              onClick={() => setSyncMethod("qrcode")}
              className="sync-button"
            >
              <span className="icon">📱</span>
              <span>QR Code</span>
            </button>
          </div>
        </div>
      ) : syncMethod === "file" ? (
        <div className="file-sync">
          <h2>Synchronisation par fichier</h2>

          <div className="sync-mode-selector">
            <label>
              <input
                type="radio"
                name="syncMode"
                value="all"
                checked={syncMode === "all"}
                onChange={() => setSyncMode("all")}
              />
              Toutes les données
            </label>
            <label>
              <input
                type="radio"
                name="syncMode"
                value="week"
                checked={syncMode === "week"}
                onChange={() => setSyncMode("week")}
              />
              Semaine courante uniquement
            </label>
          </div>

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
          <button onClick={() => setSyncMethod(null)} className="back-button">
            Retour
          </button>
        </div>
      ) : (
        <div className="qr-sync">
          <h2>Synchronisation par QR Code</h2>
          <p className="qr-info">
            Les données sont divisées en plusieurs QR codes pour faciliter le
            transfert.
          </p>

          <div className="qr-actions">
            <button
              onClick={generateQRCodes}
              className={`action-button ${showQRCode ? "active" : ""}`}
            >
              Générer les QR Codes
            </button>
            <button
              onClick={() => {
                setShowScanner(true);
                setShowQRCode(false);
                setScannedChunks([]);
              }}
              className={`action-button ${showScanner ? "active" : ""}`}
            >
              Scanner les QR Codes
            </button>
          </div>

          {showQRCode && qrCodeChunks.length > 0 && (
            <div className="qr-display">
              <h3>{getCurrentQRCodeTitle()}</h3>
              <p className="qr-chunk-info">
                QR Code {currentChunkIndex + 1} sur {qrCodeChunks.length}
              </p>

              <div className="qr-code-container">
                <QRCode
                  value={qrCodeChunks[currentChunkIndex]}
                  size={250}
                  level="L"
                />
              </div>

              <div className="qr-navigation">
                <button
                  onClick={goToPrevChunk}
                  disabled={currentChunkIndex === 0}
                  className="nav-button"
                >
                  &lt; Précédent
                </button>
                <span className="qr-pagination">
                  {currentChunkIndex + 1} / {qrCodeChunks.length}
                </span>
                <button
                  onClick={goToNextChunk}
                  disabled={currentChunkIndex === qrCodeChunks.length - 1}
                  className="nav-button"
                >
                  Suivant &gt;
                </button>
              </div>

              <p className="qr-week-info">
                Données simplifiées pour optimiser la taille des QR codes
              </p>
            </div>
          )}

          {showScanner && (
            <div className="scanner-container">
              <p>Scannez chaque QR code l'un après l'autre:</p>
              <div
                id="qr-reader"
                style={{ width: "300px", margin: "0 auto" }}
              />

              {scannedChunks.length > 0 && (
                <div className="scan-progress">
                  <p>
                    Progression: {scannedChunks.length} / {totalChunks} QR codes
                    scannés
                  </p>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(scannedChunks.length / totalChunks) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setShowScanner(false);
                  setScannedChunks([]);
                }}
                className="cancel-scan-button"
              >
                Annuler le scan
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setSyncMethod(null);
              setShowQRCode(false);
              setShowScanner(false);
              setScannedChunks([]);
            }}
            className="back-button"
          >
            Retour
          </button>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
}
