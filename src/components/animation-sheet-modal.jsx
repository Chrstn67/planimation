"use client";

import { useState } from "react";
import { jsPDF } from "jspdf";
import "../styles/modal.css";
import "../styles/animation-sheet.css";

export default function AnimationSheetModal({ activity, animators, onClose }) {
  const [formData, setFormData] = useState({
    ...activity,
    materials: activity.materials || "",
    objectives: activity.objectives || "",
    preparation: activity.preparation || "",
    evaluation: activity.evaluation || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const getAnimatorNames = (animatorIds) => {
    if (!animatorIds || !Array.isArray(animatorIds)) return "";

    return animatorIds
      .map(
        (id) =>
          animators.find((animator) => animator?.id === id)?.name || "Inconnu"
      )
      .join(", ");
  };

  const calculateDuration = () => {
    try {
      const start = new Date(`2000-01-01T${activity.startTime}`);
      let end = new Date(`2000-01-01T${activity.endTime}`);

      if (activity.endTime === "00:00") {
        end = new Date(`2000-01-02T00:00`);
      }

      const durationMinutes = (end - start) / (1000 * 60);
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      return `${hours}h${minutes > 0 ? minutes + "min" : ""}`;
    } catch (error) {
      return "Durée inconnue";
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Dimensions de la page A4 en mm
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Extraire les couleurs de l'activité pour les utiliser dans le PDF
    let activityColor = { r: 0, g: 123, b: 255 }; // Bleu par défaut
    if (activity.color) {
      const r = Number.parseInt(activity.color.substr(1, 2), 16);
      const g = Number.parseInt(activity.color.substr(3, 2), 16);
      const b = Number.parseInt(activity.color.substr(5, 2), 16);
      activityColor = { r, g, b };
    }

    // Titre et en-tête
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(activityColor.r, activityColor.g, activityColor.b);
    doc.text("FICHE D'ANIMATION", pageWidth / 2, 25, { align: "center" });

    // Soulignement décoratif coloré sous le titre
    doc.setDrawColor(activityColor.r, activityColor.g, activityColor.b);
    doc.setLineWidth(1.5);
    doc.line(pageWidth / 4, 30, (pageWidth / 4) * 3, 30);

    // Créer un fond coloré pour le titre de l'activité
    doc.setFillColor(activityColor.r, activityColor.g, activityColor.b);
    doc.roundedRect(margin, 40, contentWidth, 15, 3, 3, "F");

    // Déterminer si le texte doit être blanc ou noir selon la couleur de fond
    const luminance =
      (0.299 * activityColor.r +
        0.587 * activityColor.g +
        0.114 * activityColor.b) /
      255;
    doc.setTextColor(luminance > 0.5 ? 0 : 255);

    // Titre de l'activité
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(activity.title, pageWidth / 2, 50, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Tableau d'informations
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const tableData = [
      [
        "Date",
        activity.day + (activity.multiDay ? ` au ${activity.endDay}` : ""),
      ],
      ["Horaires", `${activity.startTime} - ${activity.endTime}`],
      ["Durée", calculateDuration()],
      ["Animateurs", getAnimatorNames(activity.animators)],
    ];

    let yPos = 65;
    const rowHeight = 10;
    const col1Width = 40;
    const col2Width = contentWidth - col1Width;

    // Dessiner le tableau avec un style amélioré
    doc.setDrawColor(activityColor.r, activityColor.g, activityColor.b);
    doc.setFillColor(240, 240, 250);
    doc.roundedRect(
      margin,
      yPos,
      contentWidth,
      rowHeight * tableData.length,
      3,
      3,
      "F"
    );

    tableData.forEach((row, index) => {
      // Bordure
      if (index > 0) {
        doc.setDrawColor(200, 200, 220);
        doc.line(
          margin + 3,
          yPos + rowHeight * index,
          margin + contentWidth - 3,
          yPos + rowHeight * index
        );
      }

      // Texte
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text(row[0], margin + 5, yPos + rowHeight * index + 6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(row[1], margin + col1Width + 5, yPos + rowHeight * index + 6.5);
    });

    // Sections de la fiche
    const sections = [
      { title: "Matériel nécessaire", content: formData.materials, icon: "📋" },
      { title: "Objectifs", content: formData.objectives, icon: "🎯" },
      { title: "Description", content: formData.description, icon: "📝" },
      { title: "Préparation", content: formData.preparation, icon: "⚙️" },
      { title: "Évaluation", content: formData.evaluation, icon: "📊" },
    ];

    yPos += rowHeight * tableData.length + 15;

    sections.forEach((section) => {
      // Titre de section avec style amélioré
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(activityColor.r, activityColor.g, activityColor.b);

      // Barre colorée pour le titre de section
      doc.setFillColor(activityColor.r, activityColor.g, activityColor.b);
      doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, "F");

      // Texte du titre en blanc ou noir selon la luminosité
      doc.setTextColor(luminance > 0.5 ? 0 : 255);
      doc.text(`${section.title}`, margin + 10, yPos + 6.5);
      doc.setTextColor(0, 0, 0);

      yPos += 15;

      // Contenu de la section
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      if (!section.content || section.content.trim() === "") {
        doc.setTextColor(150, 150, 150);
        doc.text("Aucune information disponible", margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 15;
      } else {
        // Diviser le texte en lignes pour éviter les coupures de paragraphe
        const textLines = doc.splitTextToSize(
          section.content,
          contentWidth - 5
        );

        // Vérifier s'il faut passer à une nouvelle page
        if (yPos + textLines.length * 5.5 > pageHeight - margin) {
          doc.addPage();
          yPos = margin + 10;
        }

        // Ajouter un fond léger pour le contenu
        const contentHeight = textLines.length * 5.5 + 10;
        doc.setFillColor(248, 248, 252);
        doc.roundedRect(
          margin,
          yPos - 5,
          contentWidth,
          contentHeight,
          2,
          2,
          "F"
        );

        // Ajouter le texte
        doc.text(textLines, margin + 5, yPos);
        yPos += textLines.length * 5.5 + 15;
      }

      // Vérifier si la prochaine section nécessiterait une nouvelle page
      if (yPos + 30 > pageHeight - margin) {
        doc.addPage();
        yPos = margin + 10;
      }
    });

    // Footer avec style
    doc.setFillColor(activityColor.r, activityColor.g, activityColor.b, 0.1);
    doc.rect(margin, pageHeight - 20, contentWidth, 15, "F");

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const now = new Date();
    doc.text(
      `Fiche d'animation générée le ${now.toLocaleDateString()} à ${now.toLocaleTimeString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    // Enregistrer le PDF
    doc.save(
      `fiche-animation-${activity.title.replace(/\s+/g, "-").toLowerCase()}.pdf`
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal animation-sheet-modal">
        <div
          className="modal-header"
          style={{ backgroundColor: activity.color || "#e0e0e0" }}
        >
          <h2>Fiche d'animation</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="animation-sheet-preview">
            <div className="animation-sheet-header">
              <h3>{activity.title}</h3>
              <div className="animation-sheet-info">
                <div className="info-row">
                  <span className="info-label">Date:</span>
                  <span className="info-value">
                    {activity.day}
                    {activity.multiDay && ` au ${activity.endDay}`}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Horaires:</span>
                  <span className="info-value">
                    {activity.startTime} - {activity.endTime}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Durée:</span>
                  <span className="info-value">{calculateDuration()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Animateurs:</span>
                  <span className="info-value">
                    {getAnimatorNames(activity.animators)}
                  </span>
                </div>
              </div>
            </div>

            <form className="animation-sheet-form">
              <div className="form-group">
                <label htmlFor="materials">Matériel nécessaire</label>
                <textarea
                  id="materials"
                  name="materials"
                  value={formData.materials}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Listez le matériel nécessaire pour cette activité..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="objectives">Objectifs</label>
                <textarea
                  id="objectives"
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Quels sont les objectifs de cette activité?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Décrivez le déroulement de l'activité..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="preparation">Préparation</label>
                <textarea
                  id="preparation"
                  name="preparation"
                  value={formData.preparation}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Étapes de préparation avant l'activité..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="evaluation">Évaluation</label>
                <textarea
                  id="evaluation"
                  name="evaluation"
                  value={formData.evaluation}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Comment évaluer le succès de cette activité?"
                />
              </div>
            </form>
          </div>

          <div className="modal-actions">
            <button className="cancel-button" onClick={onClose}>
              Fermer
            </button>
            <button className="export-button" onClick={exportToPDF}>
              Exporter en PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
