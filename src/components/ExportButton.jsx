"use client";

import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "../styles/export-button.css";

export default function ExportButton({
  activities,
  animators,
  currentWeekDates,
}) {
  const contentRef = useRef(null);

  const getAnimatorNames = (animatorIds) => {
    if (!animatorIds || !Array.isArray(animatorIds) || animatorIds.length === 0)
      return "";

    return animatorIds
      .map(
        (id) =>
          animators.find((animator) => animator?.id === id)?.name || "Inconnu"
      )
      .join(", ");
  };

  // Fonction améliorée pour vérifier si une activité est dans la semaine actuelle
  const isActivityInCurrentWeek = (activity) => {
    if (
      !currentWeekDates ||
      !currentWeekDates.dates ||
      currentWeekDates.dates.length === 0 ||
      !activity
    ) {
      return false;
    }

    // Vérifier que l'activité a toutes les propriétés requises
    if (
      !activity.day ||
      !activity.startTime ||
      !activity.endTime ||
      !activity.title
    ) {
      return false;
    }

    // Fonction pour vérifier si deux dates sont dans la même semaine
    const isSameWeek = (date1, date2) => {
      if (!date1 || !date2) return false;

      const d1 = new Date(date1);
      const d2 = new Date(date2);

      // Obtenir le premier jour de la semaine (lundi) pour chaque date
      const firstDayOfWeek1 = new Date(d1);
      const day1 = d1.getDay() || 7; // getDay() retourne 0 pour dimanche, donc on utilise 7
      firstDayOfWeek1.setDate(d1.getDate() - day1 + 1);

      const firstDayOfWeek2 = new Date(d2);
      const day2 = d2.getDay() || 7;
      firstDayOfWeek2.setDate(d2.getDate() - day2 + 1);

      // Comparer les dates au format YYYY-MM-DD
      return (
        firstDayOfWeek1.toISOString().split("T")[0] ===
        firstDayOfWeek2.toISOString().split("T")[0]
      );
    };

    // Pour une activité avec une date complète
    if (activity.fullDate) {
      return currentWeekDates.dates.some(
        (date) => date && isSameWeek(new Date(activity.fullDate), date)
      );
    }

    // Pour les activités avec des dates multiples
    if (activity.dates && activity.dates.length > 0) {
      return activity.dates.some((activityDate) =>
        currentWeekDates.dates.some(
          (date) => date && isSameWeek(new Date(activityDate), date)
        )
      );
    }

    // Si aucune date n'est disponible, utiliser le jour de la semaine
    const days = [
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
      "Dimanche",
    ];
    const startDayIndex = days.indexOf(activity.day);

    if (startDayIndex >= 0 && startDayIndex < currentWeekDates.dates.length) {
      // Supposer que l'activité est dans la semaine actuelle si le jour correspond
      return true;
    }

    return false;
  };

  // Modifier la fonction exportToPDF pour un design plus attrayant
  const exportToPDF = async () => {
    // Filtrer les activités de la semaine actuelle et s'assurer qu'elles sont valides
    const currentWeekActivities = activities
      .filter((activity) => activity && typeof activity === "object")
      .filter(isActivityInCurrentWeek);

    // Si aucune activité pour cette semaine, afficher un message et ne pas créer de PDF
    if (!currentWeekActivities.length) {
      alert("Aucune activité n'est prévue pour cette semaine.");
      return;
    }

    // Créer un élément temporaire pour le rendu du PDF
    const tempDiv = document.createElement("div");
    tempDiv.className = "pdf-export";
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "1100px"; // Largeur suffisante pour le design
    document.body.appendChild(tempDiv);

    // Obtenir les dates formatées pour l'affichage
    const weekDates = currentWeekDates.dates
      .slice(0, 7) // Limiter aux 7 jours de la semaine
      .map(
        (date) =>
          date &&
          date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
      );

    // Fonction pour obtenir la couleur de texte contrastée par rapport à la couleur de fond
    const getContrastColor = (hexColor) => {
      // Si pas de couleur ou format invalide, retourner du noir
      if (!hexColor || !hexColor.startsWith("#") || hexColor.length !== 7) {
        return "#000000";
      }

      // Convertir couleur hex en RGB
      const r = parseInt(hexColor.substr(1, 2), 16);
      const g = parseInt(hexColor.substr(3, 2), 16);
      const b = parseInt(hexColor.substr(5, 2), 16);

      // Calculer la luminosité
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Si luminosité > 0.5, utiliser du texte noir, sinon blanc
      return luminance > 0.5 ? "#000000" : "#FFFFFF";
    };

    // Grouper les activités par jour pour le design par jour
    const activitiesByDay = {};
    const days = [
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
      "Dimanche",
    ];

    days.forEach((day) => {
      activitiesByDay[day] = currentWeekActivities
        .filter(
          (activity) =>
            activity.day === day ||
            (activity.multiDay &&
              days.indexOf(activity.day) <= days.indexOf(day) &&
              days.indexOf(day) <=
                days.indexOf(activity.endDay || activity.day))
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    // Générer le contenu HTML pour le PDF avec un design plus moderne
    tempDiv.innerHTML = `
    <div class="pdf-content" ref=${contentRef} style="font-family: Arial, sans-serif; padding: 20px; max-width: 1000px;">
      <style>
        .pdf-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .pdf-header h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        .week-info {
          font-size: 16px;
          color: #666;
        }
        .day-card {
          margin-bottom: 20px;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .day-header {
          background-color: #f0f0f0;
          padding: 10px 15px;
          font-size: 18px;
          font-weight: bold;
          display: flex;
          justify-content: space-between;
        }
        .day-date {
          font-weight: normal;
          color: #666;
        }
        .day-activities {
          padding: 0;
        }
        .activity-item {
          padding: 15px;
          margin: 10px;
          border-radius: 5px;
          position: relative;
        }
        .activity-time {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .activity-title {
          font-size: 16px;
          margin-bottom: 5px;
        }
        .activity-animators {
          font-style: italic;
          font-size: 14px;
        }
        .no-activities {
          padding: 15px;
          color: #999;
          font-style: italic;
        }
        .page-break {
          page-break-after: always;
          height: 0;
        }
      </style>
      
      <div class="pdf-header">
        <h1>Planning des Animations</h1>
        <p class="week-info">Semaine du ${weekDates[0]} au ${weekDates[4]}</p>
      </div>
      
      ${days
        .slice(0, 5)
        .map((day, dayIndex) => {
          const dayActivities = activitiesByDay[day] || [];
          return `
          <div class="day-card">
            <div class="day-header">
              <span>${day}</span>
              <span class="day-date">${weekDates[dayIndex] || ""}</span>
            </div>
            <div class="day-activities">
              ${
                dayActivities.length
                  ? dayActivities
                      .map((activity) => {
                        // Déterminer l'heure de début et de fin pour ce jour spécifique
                        let displayStartTime = activity.startTime;
                        let displayEndTime = activity.endTime;

                        if (activity.multiDay) {
                          if (day !== activity.day) {
                            displayStartTime = "00:00";
                          }
                          if (day !== (activity.endDay || activity.day)) {
                            displayEndTime = "24:00";
                          }
                        }

                        const textColor = getContrastColor(
                          activity.color || "#e0e0e0"
                        );

                        return `
                  <div class="activity-item" style="background-color: ${
                    activity.color || "#e0e0e0"
                  }; color: ${textColor};">
                    <div class="activity-time">${displayStartTime} - ${displayEndTime}</div>
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-animators">Animateurs: ${getAnimatorNames(
                      activity.animators
                    )}</div>
                    ${
                      activity.description
                        ? `<div class="activity-description">${activity.description}</div>`
                        : ""
                    }
                  </div>
                `;
                      })
                      .join("")
                  : `<div class="no-activities">Aucune activité prévue</div>`
              }
            </div>
          </div>
          ${
            dayIndex < 4 && dayIndex % 2 === 1
              ? '<div class="page-break"></div>'
              : ""
          }
        `;
        })
        .join("")}
    </div>
  `;

    try {
      // Capturer le contenu en tant qu'image
      const canvas = await html2canvas(tempDiv.querySelector(".pdf-content"), {
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // S'assurer que les styles sont correctement appliqués au clone
          const clonedContent = clonedDoc.querySelector(".pdf-content");
          if (clonedContent) {
            clonedContent.style.width = "1000px";
          }
        },
      });

      // Créer le PDF
      const imgData = canvas.toDataURL("image/png");
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgWidth = pageWidth - 20; // Full width with margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Créer un nouveau document PDF
      const pdf = new jsPDF({
        orientation: imgHeight > pageHeight ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      // Si l'image est plus haute qu'une page, la diviser en plusieurs pages
      let heightLeft = imgHeight;
      let position = 10; // Position Y initiale
      let pageCanvas = canvas;

      // Ajouter la première page
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft > 0) {
        position = -(pageHeight - 20 - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      pdf.save("planning-animations.pdf");
    } catch (error) {
      console.error("Erreur lors de l'export PDF:", error);
      alert("Une erreur est survenue lors de l'export PDF: " + error.message);
    } finally {
      // Nettoyer
      document.body.removeChild(tempDiv);
    }
  };

  return (
    <button className="export-button" onClick={exportToPDF}>
      Exporter en PDF
    </button>
  );
}
