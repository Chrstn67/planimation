"use client";

import { useState, useEffect } from "react";
import "../styles/modal.css";

export default function ActivityModal({
  onClose,
  onSave,
  activity = null,
  animators,
  initialDay = null,
  initialTime = null,
}) {
  const [formData, setFormData] = useState(
    activity || {
      title: "",
      day: initialDay || "Lundi",
      startTime: initialTime || "09:00",
      endTime: initialTime ? incrementTime(initialTime, 1) : "10:00",
      endDay: initialDay || "Lundi",
      animators: [],
      description: "",
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      multiDay: false,
    }
  );

  // Fonction pour incrémenter l'heure
  function incrementTime(time, hours) {
    const [h, m] = time.split(":").map(Number);
    let newHour = h + hours;
    if (newHour >= 24) newHour = 23;
    return `${newHour.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}`;
  }

  // Initialiser le jour de fin si c'est une activité existante
  useEffect(() => {
    if (activity && !activity.endDay) {
      setFormData({
        ...activity,
        endDay: activity.day,
        multiDay: false,
      });
    }
  }, [activity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAnimatorChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) =>
      Number.parseInt(option.value)
    );
    setFormData({ ...formData, animators: selectedOptions });
  };

  const handleMultiDayChange = (e) => {
    const isMultiDay = e.target.checked;
    setFormData({
      ...formData,
      multiDay: isMultiDay,
      endDay: isMultiDay ? formData.endDay : formData.day,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Vérifier que la combinaison jour/heure de fin est après jour/heure de début
    const days = [
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
      "Dimanche",
    ];
    const startDayIndex = days.indexOf(formData.day);
    const endDayIndex = days.indexOf(formData.endDay);

    if (
      endDayIndex < startDayIndex ||
      (endDayIndex === startDayIndex && formData.endTime <= formData.startTime)
    ) {
      alert("La date/heure de fin doit être après la date/heure de début");
      return;
    }

    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{activity ? "Modifier une activité" : "Ajouter une activité"}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

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

          <div className="form-group checkbox-group">
            <label htmlFor="multiDay">
              <input
                type="checkbox"
                id="multiDay"
                name="multiDay"
                checked={formData.multiDay}
                onChange={handleMultiDayChange}
              />
              Activité sur plusieurs jours
            </label>
          </div>

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
                disabled={!formData.multiDay}
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
            <label htmlFor="animators">Animateurs</label>
            <select
              id="animators"
              name="animators"
              multiple
              value={formData.animators}
              onChange={handleAnimatorChange}
              required
            >
              {animators
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((animator) => (
                  <option key={animator.id} value={animator.id}>
                    {animator.name} ({animator.specialty})
                  </option>
                ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="color">Couleur</label>
            <input
              type="color"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose}>
              Annuler
            </button>
            <button type="submit">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
