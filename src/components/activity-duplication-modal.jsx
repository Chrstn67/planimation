"use client";

import { useState } from "react";
import "../styles/modal.css";
import "../styles/activity-duplication.css";

export default function ActivityDuplicationModal({
  activity,
  onClose,
  onDuplicate,
  currentWeekDates,
}) {
  const [formData, setFormData] = useState({
    title: `${activity.title} (copie)`,
    day: activity.day,
    startTime: activity.startTime,
    endTime: activity.endTime,
    animators: [...(activity.animators || [])],
    description: activity.description || "",
    color: activity.color,
    multiDay: activity.multiDay || false,
    endDay: activity.endDay || activity.day,
    date: null,
    keepOriginalDate: false,
  });

  const days = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ];

  // Générer les dates disponibles pour les 52 prochaines semaines
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    const currentDay = today.getDay() || 7; // 0 = dimanche, 1 = lundi, etc.
    const daysToMonday = currentDay === 1 ? 0 : 8 - currentDay; // Jours jusqu'au prochain lundi

    // Commencer par le lundi de la semaine actuelle ou prochaine
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + daysToMonday - 7); // Commencer par le lundi de la semaine actuelle

    // Générer 4 semaines
    for (let week = 0; week < 52; week++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + week * 7);

      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        weekDates.push(date);
      }

      // Formater les dates pour l'affichage
      const formattedWeekStart = weekDates[0].toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
      const formattedWeekEnd = weekDates[6].toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });

      dates.push({
        label: `Semaine du ${formattedWeekStart} au ${formattedWeekEnd}`,
        dates: weekDates,
      });
    }

    return dates;
  };

  const availableDates = generateAvailableDates();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleDateChange = (e) => {
    const [weekIndex, dayIndex] = e.target.value.split("-").map(Number);
    if (weekIndex >= 0 && dayIndex >= 0) {
      const selectedDate = availableDates[weekIndex].dates[dayIndex];
      setFormData({
        ...formData,
        date: selectedDate,
        day: days[dayIndex],
      });
    } else {
      setFormData({
        ...formData,
        date: null,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Préparer les données pour la duplication
    const duplicatedActivity = {
      ...activity,
      id: undefined, // L'ID sera généré par le composant parent
      title: formData.title,
      day: formData.day,
      startTime: formData.startTime,
      endTime: formData.endTime,
      animators: [...formData.animators],
      description: formData.description,
      color: formData.color,
      multiDay: formData.multiDay,
      endDay: formData.multiDay ? formData.endDay : formData.day,
    };

    // Si on garde la date originale
    if (formData.keepOriginalDate) {
      duplicatedActivity.fullDate = activity.fullDate;
      duplicatedActivity.dates = activity.dates;
    }
    // Sinon, utiliser la nouvelle date sélectionnée
    else if (formData.date) {
      duplicatedActivity.fullDate = formData.date;

      // Recalculer les dates pour une activité multi-jours
      if (duplicatedActivity.multiDay) {
        const startDayIndex = days.indexOf(duplicatedActivity.day);
        const endDayIndex = days.indexOf(duplicatedActivity.endDay);
        const daysDifference = endDayIndex - startDayIndex;

        const dates = [];
        for (let i = 0; i <= daysDifference; i++) {
          const date = new Date(formData.date);
          date.setDate(date.getDate() + i);
          dates.push(date);
        }
        duplicatedActivity.dates = dates;
      }
    }

    onDuplicate(duplicatedActivity);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal duplication-modal">
        <div
          className="modal-header"
          style={{ backgroundColor: activity.color || "#e0e0e0" }}
        >
          <h2>Dupliquer une activité</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Titre</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-section">
              <h3>Quand dupliquer cette activité ?</h3>

              <div className="form-group checkbox-group">
                <label htmlFor="keepOriginalDate">
                  <input
                    type="checkbox"
                    id="keepOriginalDate"
                    name="keepOriginalDate"
                    checked={formData.keepOriginalDate}
                    onChange={handleChange}
                  />
                  Conserver la date originale
                </label>
              </div>

              {!formData.keepOriginalDate && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="day">Jour de début</label>
                      <select
                        id="day"
                        name="day"
                        value={formData.day}
                        onChange={handleChange}
                        required
                      >
                        <option value="Lundi">Lundi</option>
                        <option value="Mardi">Mardi</option>
                        <option value="Mercredi">Mercredi</option>
                        <option value="Jeudi">Jeudi</option>
                        <option value="Vendredi">Vendredi</option>
                        <option value="Samedi">Samedi</option>
                        <option value="Dimanche">Dimanche</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="startTime">Heure de début</label>
                      <input
                        type="time"
                        id="startTime"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="endDay">Jour de fin</label>
                      <select
                        id="endDay"
                        name="endDay"
                        value={formData.endDay}
                        onChange={handleChange}
                        required
                      >
                        <option value="Lundi">Lundi</option>
                        <option value="Mardi">Mardi</option>
                        <option value="Mercredi">Mercredi</option>
                        <option value="Jeudi">Jeudi</option>
                        <option value="Vendredi">Vendredi</option>
                        <option value="Samedi">Samedi</option>
                        <option value="Dimanche">Dimanche</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="endTime">Heure de fin</label>
                      <input
                        type="time"
                        id="endTime"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="date">Semaine de l'activité</label>
                    <select
                      id="date"
                      name="date"
                      onChange={handleDateChange}
                      required
                      className="date-select"
                    >
                      <option value="">Sélectionnez une semaine</option>
                      {availableDates.map((week, weekIndex) => (
                        <option key={weekIndex} value={`${weekIndex}-0`}>
                          {week.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="form-section">
              <h3>Aperçu de l'activité dupliquée</h3>
              <div
                className="activity-preview"
                style={{ backgroundColor: formData.color || "#e0e0e0" }}
              >
                <h4>{formData.title}</h4>
                <p>
                  <strong>Jour:</strong> {formData.day}
                  {formData.multiDay && ` au ${formData.endDay}`}
                </p>
                <p>
                  <strong>Horaires:</strong> {formData.startTime} -{" "}
                  {formData.endTime}
                </p>
                {formData.date && (
                  <p>
                    <strong>Date:</strong>{" "}
                    {formData.date.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button type="submit" className="duplicate-button">
                Dupliquer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
