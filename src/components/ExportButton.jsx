"use client";

import { useRef } from "react";
import jsPDF from "jspdf";
import "../styles/export-button.css";

export default function ExportButton({
  activities,
  animators,
  currentWeekDates,
}) {
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

    if (!activity.day || !activity.startTime || !activity.endTime) {
      return false;
    }

    // Fonction pour vérifier si deux dates sont dans la même semaine
    const isSameWeek = (date1, date2) => {
      if (!date1 || !date2) return false;

      const d1 = new Date(date1);
      const d2 = new Date(date2);

      // Obtenir le premier jour de la semaine (lundi) pour chaque date
      const firstDayOfWeek1 = new Date(d1);
      const day1 = d1.getDay() || 7; // getDay() retourne 0 pour dimanche
      firstDayOfWeek1.setDate(d1.getDate() - day1 + 1);

      const firstDayOfWeek2 = new Date(d2);
      const day2 = d2.getDay() || 7;
      firstDayOfWeek2.setDate(d2.getDate() - day2 + 1);

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
      return true;
    }

    return false;
  };

  // Fonction pour obtenir une couleur de texte contrastée
  const getContrastColor = (hexColor) => {
    if (!hexColor || !hexColor.startsWith("#") || hexColor.length !== 7) {
      return "#000000";
    }

    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  };

  // Convertit un temps "HH:MM" en minutes depuis minuit
  const timeToMinutes = (time) => {
    if (time === "24:00") return 24 * 60;
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Fonction pour dessiner une grille horaire pour un animateur
  const drawAnimatorSchedule = (
    pdf,
    animator,
    weekActivities,
    weekDates,
    startY,
    breakPage = true
  ) => {
    const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Vérifier s'il reste assez d'espace sur la page
    if (
      breakPage &&
      startY + 120 > pdf.internal.pageSize.getHeight() - margin
    ) {
      pdf.addPage();
      startY = margin;
    }

    // Titre de la section
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Planning de ${animator.name}`, margin, startY);

    startY += 10;

    // Dimensions de la grille
    const hourHeight = 8; // Hauteur d'une heure en mm
    const dayWidth = contentWidth / 5; // Largeur d'un jour
    const workingHours = [6, 23]; // Plage horaire h-20h
    const gridHeight = (workingHours[1] - workingHours[0]) * hourHeight;

    // En-têtes des jours
    pdf.setFillColor(240, 240, 240);
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margin, startY, contentWidth, 8, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);

    for (let i = 0; i < days.length; i++) {
      pdf.text(
        `${days[i]} ${weekDates[i] || ""}`,
        margin + i * dayWidth + dayWidth / 2,
        startY + 5,
        { align: "center" }
      );

      // Lignes verticales
      pdf.setDrawColor(220, 220, 220);
      pdf.line(
        margin + (i + 1) * dayWidth,
        startY,
        margin + (i + 1) * dayWidth,
        startY + gridHeight + 8
      );
    }

    startY += 8;

    // Lignes horizontales des heures
    pdf.setDrawColor(220, 220, 220);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);

    for (let hour = workingHours[0]; hour <= workingHours[1]; hour++) {
      const y = startY + (hour - workingHours[0]) * hourHeight;

      // Ligne horizontale
      pdf.line(margin, y, margin + contentWidth, y);

      // Heure
      pdf.text(`${hour}:00`, margin - 5, y, { align: "right" });
    }

    // Dessiner le contour de la grille
    pdf.setDrawColor(150, 150, 150);
    pdf.rect(margin, startY, contentWidth, gridHeight, "D");

    // Filtrer les activités pour cet animateur
    const animatorActivities = weekActivities.filter(
      (activity) =>
        activity.animators &&
        Array.isArray(activity.animators) &&
        activity.animators.includes(animator.id)
    );

    // Dessiner les activités
    for (const activity of animatorActivities) {
      const startDayIndex = days.indexOf(activity.day);
      const endDayIndex = days.indexOf(activity.endDay || activity.day);

      if (startDayIndex === -1) continue;

      // Pour chaque jour de l'activité
      for (
        let dayIndex = startDayIndex;
        dayIndex <= (endDayIndex !== -1 ? endDayIndex : startDayIndex);
        dayIndex++
      ) {
        // Déterminer l'heure de début et de fin pour ce jour
        let startTimeStr = activity.startTime;
        let endTimeStr = activity.endTime;

        if (activity.multiDay) {
          if (dayIndex > startDayIndex) {
            startTimeStr = "00:00";
          }
          if (dayIndex < endDayIndex) {
            endTimeStr = "24:00";
          }
        }

        // Convertir en minutes
        let startMinutes = timeToMinutes(startTimeStr);
        let endMinutes = timeToMinutes(endTimeStr);

        // Ajuster aux heures de travail affichées
        const workStartMinutes = workingHours[0] * 60;
        const workEndMinutes = workingHours[1] * 60;

        // Si l'activité est en dehors des heures affichées, l'ajuster ou la sauter
        if (endMinutes <= workStartMinutes || startMinutes >= workEndMinutes) {
          continue;
        }

        startMinutes = Math.max(startMinutes, workStartMinutes);
        endMinutes = Math.min(endMinutes, workEndMinutes);

        // Calculer la position et la taille
        const x = margin + dayIndex * dayWidth;
        const y =
          startY + ((startMinutes - workStartMinutes) / 60) * hourHeight;
        const width = dayWidth;
        const height = ((endMinutes - startMinutes) / 60) * hourHeight;

        // Dessiner l'activité
        const activityColor = activity.color || "#e0e0e0";
        pdf.setFillColor(
          parseInt(activityColor.substr(1, 2), 16),
          parseInt(activityColor.substr(3, 2), 16),
          parseInt(activityColor.substr(5, 2), 16)
        );
        pdf.roundedRect(x, y, width, height, 1, 1, "F");

        // Texte de l'activité
        const textColor = getContrastColor(activityColor);
        pdf.setTextColor(
          textColor === "#FFFFFF" ? 255 : 0,
          textColor === "#FFFFFF" ? 255 : 0,
          textColor === "#FFFFFF" ? 255 : 0
        );

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);

        // Ajuster le texte à la taille du bloc
        const activityTitle = activity.title;
        const timeText = `${startTimeStr}-${endTimeStr}`;

        // Position verticale du texte
        const textY = y + 3;

        if (height >= 8) {
          pdf.text(activityTitle, x + 2, textY);
          if (height >= 12) {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(6);
            pdf.text(timeText, x + 2, textY + 4);
          }
        } else if (height >= 5) {
          // Si l'espace est limité, afficher uniquement le titre
          pdf.setFontSize(6);
          pdf.text(activityTitle, x + 2, textY);
        }
      }
    }

    return startY + gridHeight + 10; // Retourner la nouvelle position Y
  };

  // Nouvelle méthode d'export PDF avec planning général et par animateur
  const exportToPDF = async () => {
    // Filtrer les activités de la semaine actuelle
    const currentWeekActivities = activities
      .filter((activity) => activity && typeof activity === "object")
      .filter(isActivityInCurrentWeek);

    if (!currentWeekActivities.length) {
      alert("Aucune activité n'est prévue pour cette semaine.");
      return;
    }

    // Obtenir les dates formatées pour l'affichage
    const weekDates = currentWeekDates.dates
      .slice(0, 5) // Limiter aux jours de la semaine (lundi-vendredi)
      .map(
        (date) =>
          date &&
          date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
      );

    // Initialiser le PDF au format A4
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Dimensions de la page A4 en mm
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // ------- PREMIÈRE PARTIE: PLANNING GÉNÉRAL -------

    // Paramètres de style
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Planning des Animations", pageWidth / 2, 20, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(
      `Semaine du ${weekDates[0]} au ${weekDates[4]}`,
      pageWidth / 2,
      30,
      { align: "center" }
    );

    // Dessiner une ligne horizontale
    pdf.setDrawColor(100, 100, 100);
    pdf.setLineWidth(0.5);
    pdf.line(margin, 35, pageWidth - margin, 35);

    // Grouper les activités par jour
    const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
    const activitiesByDay = {};

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

    // Position Y courante pour le contenu
    let yPos = 45;
    const dayHeaderHeight = 10;
    const activityHeight = 25;
    const daySpacing = 5;

    // Pour chaque jour de la semaine
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const dayActivities = activitiesByDay[day] || [];

      // Vérifier s'il reste suffisamment d'espace sur la page actuelle
      const requiredHeight =
        dayHeaderHeight + dayActivities.length * activityHeight + daySpacing;
      if (yPos + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
      }

      // Entête du jour
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos, contentWidth, dayHeaderHeight, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${day} - ${weekDates[i] || ""}`, margin + 5, yPos + 7);

      yPos += dayHeaderHeight;

      // Si aucune activité, afficher un message
      if (dayActivities.length === 0) {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Aucune activité prévue", margin + 5, yPos + 10);
        yPos += activityHeight;
      } else {
        // Pour chaque activité du jour
        for (let j = 0; j < dayActivities.length; j++) {
          const activity = dayActivities[j];

          // Vérifier s'il faut ajouter une nouvelle page
          if (yPos + activityHeight > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
          }

          // Fond de l'activité
          const activityColor = activity.color || "#e0e0e0";
          pdf.setFillColor(
            parseInt(activityColor.substr(1, 2), 16),
            parseInt(activityColor.substr(3, 2), 16),
            parseInt(activityColor.substr(5, 2), 16)
          );
          pdf.roundedRect(
            margin,
            yPos,
            contentWidth,
            activityHeight,
            3,
            3,
            "F"
          );

          // Déterminer l'heure de début et de fin pour ce jour
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

          // Texte de l'activité
          const textColor = getContrastColor(activityColor);
          pdf.setTextColor(
            textColor === "#FFFFFF" ? 255 : 0,
            textColor === "#FFFFFF" ? 255 : 0,
            textColor === "#FFFFFF" ? 255 : 0
          );

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.text(
            `${displayStartTime} - ${displayEndTime}: ${activity.title}`,
            margin + 5,
            yPos + 7
          );

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.text(
            `Animateurs: ${getAnimatorNames(activity.animators)}`,
            margin + 5,
            yPos + 15
          );

          if (activity.description) {
            const maxLength = 60;
            let description = activity.description;
            if (description.length > maxLength) {
              description = description.substring(0, maxLength) + "...";
            }
            pdf.setFontSize(8);
            pdf.text(description, margin + 5, yPos + 22);
          }

          yPos += activityHeight + 2;
        }
      }

      yPos += daySpacing;
    }

    // ------- DEUXIÈME PARTIE: PLANNING PAR ANIMATEUR -------

    // Filtrer les animateurs qui ont des activités cette semaine
    const activeAnimators = animators.filter((animator) =>
      currentWeekActivities.some(
        (activity) =>
          activity.animators &&
          Array.isArray(activity.animators) &&
          activity.animators.includes(animator.id)
      )
    );

    if (activeAnimators.length > 0) {
      // Ajouter une page pour les plannings des animateurs
      pdf.addPage();

      // Titre de section pour les plannings individuels
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Plannings par Animateur", pageWidth / 2, 20, {
        align: "center",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.text(
        `Semaine du ${weekDates[0]} au ${weekDates[4]}`,
        pageWidth / 2,
        30,
        { align: "center" }
      );

      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.5);
      pdf.line(margin, 35, pageWidth - margin, 35);

      // Position de départ pour le premier planning d'animateur
      let currentY = 45;

      // Dessiner le planning de chaque animateur
      for (const animator of activeAnimators) {
        currentY = drawAnimatorSchedule(
          pdf,
          animator,
          currentWeekActivities,
          weekDates,
          currentY
        );
      }
    }

    // Ajouter footer avec date d'impression sur toutes les pages
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);

      const now = new Date();
      const dateStr =
        now.toLocaleDateString("fr-FR") +
        " " +
        now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

      pdf.text(
        `Imprimé le ${dateStr} - Page ${i}/${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        {
          align: "right",
        }
      );
    }

    pdf.save("planning-animations.pdf");
  };

  return (
    <button className="export-button" onClick={exportToPDF}>
      Exporter en PDF
    </button>
  );
}
