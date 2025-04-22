"use client";

import { useState, useEffect } from "react";
import "../styles/calendar.css";
import React from "react";
import ActivityModal from "./ActivityModal";

const days = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  // "Samedi",
  // "Dimanche",
];

export default function Calendar({
  activities,
  animators,
  description,
  onActivityClick,
  onAddActivity,
  onWeekChange, // Nouvelle prop pour partager les dates avec le parent
}) {
  const [currentView, setCurrentView] = useState("week");
  const [selectedDay, setSelectedDay] = useState("Lundi");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActivityInitialData, setNewActivityInitialData] = useState({
    day: null,
    time: null,
    date: null,
  });

  // État pour les dates de la semaine
  const [weekDates, setWeekDates] = useState({
    startDate: new Date(),
    dates: [],
  });

  // Fonction pour générer des créneaux sur 24h
  const getAllTimeSlots = () => {
    const timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    timeSlots.push("00:00");
    return timeSlots;
  };

  const timeSlots = getAllTimeSlots();

  // Fonction pour gérer le clic sur une case du calendrier
  const handleTimeSlotClick = (day, time) => {
    const dayIndex = days.indexOf(day);
    const date = weekDates.dates[dayIndex];

    setNewActivityInitialData({ day, time, date });
    setShowAddModal(true);
  };

  // Fonction pour sauvegarder une nouvelle activité
  const handleSaveNewActivity = (activityData) => {
    const enrichedData = {
      ...activityData,
      fullDate: newActivityInitialData.date,
      dates: calculateActivityDates(
        newActivityInitialData.date,
        activityData.day,
        activityData.endDay || activityData.day
      ),
    };
    onAddActivity(enrichedData);
    setShowAddModal(false);
  };

  // Fonction pour calculer toutes les dates d'une activité multi-jours
  const calculateActivityDates = (startDate, startDay, endDay) => {
    if (!startDate) return [];

    const dates = [];
    const start = new Date(startDate);

    const startDayIndex = days.indexOf(startDay);
    const endDayIndex = days.indexOf(endDay);
    const daysDifference = endDayIndex - startDayIndex;

    if (daysDifference < 0 || startDayIndex === -1 || endDayIndex === -1) {
      return [new Date(start)];
    }

    for (let i = 0; i <= daysDifference; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  // Fonction pour vérifier si deux dates sont dans la même semaine
  const isSameWeek = (date1, date2) => {
    if (!date1 || !date2) return false;

    const d1 = new Date(date1);
    const d2 = new Date(date2);

    const firstDayOfWeek1 = new Date(d1);
    const day1 = d1.getDay() || 7;
    firstDayOfWeek1.setDate(d1.getDate() - day1 + 1);

    const firstDayOfWeek2 = new Date(d2);
    const day2 = d2.getDay() || 7;
    firstDayOfWeek2.setDate(d2.getDate() - day2 + 1);

    return (
      firstDayOfWeek1.toISOString().split("T")[0] ===
      firstDayOfWeek2.toISOString().split("T")[0]
    );
  };

  // Fonction pour filtrer les activités par semaine et créneau horaire
  const getActivitiesForTimeSlot = (day, startTime, endTime) => {
    if (!activities || !Array.isArray(activities)) {
      return [];
    }

    const dayIndex = days.indexOf(day);
    const currentDate = weekDates.dates[dayIndex];

    if (!currentDate) return [];

    return activities.filter((activity) => {
      // Vérifier que l'activité a toutes les propriétés nécessaires
      if (
        !activity ||
        typeof activity !== "object" ||
        !activity.day ||
        !activity.startTime ||
        !activity.endTime
      ) {
        return false;
      }

      // Pour une activité simple
      if (!activity.multiDay) {
        if (!activity.fullDate) return false;

        const activityDate = new Date(activity.fullDate);
        if (!isSameWeek(activityDate, currentDate)) {
          return false;
        }

        return (
          activity.day === day &&
          ((activity.startTime <= startTime && activity.endTime > startTime) ||
            (activity.startTime >= startTime && activity.startTime < endTime))
        );
      }
      // Pour une activité multi-jours
      else {
        const activityDates = activity.dates || [];
        const isInCurrentWeek = activityDates.some((date) =>
          isSameWeek(new Date(date), currentDate)
        );

        if (!isInCurrentWeek) {
          return false;
        }

        const activityStartDayIndex = days.indexOf(activity.day);
        const activityEndDayIndex = days.indexOf(
          activity.endDay || activity.day
        );

        if (
          dayIndex >= activityStartDayIndex &&
          dayIndex <= activityEndDayIndex
        ) {
          if (dayIndex === activityStartDayIndex) {
            return (
              activity.startTime <= startTime ||
              (activity.startTime >= startTime && activity.startTime < endTime)
            );
          } else if (dayIndex === activityEndDayIndex) {
            return activity.endTime > startTime;
          } else {
            return true;
          }
        }
      }

      return false;
    });
  };

  // Obtenir les noms des animateurs pour une activité
  const getAnimatorNames = (animatorIds) => {
    if (!animatorIds || !Array.isArray(animatorIds)) return "";

    return animatorIds
      .map(
        (id) =>
          animators.find((animator) => animator?.id === id)?.name || "Inconnu"
      )
      .join(", ");
  };

  // Calculer la hauteur d'une activité en fonction de sa durée
  const calculateActivityHeight = (day, startTime, endTime) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);

    if (endTime === "00:00") {
      end.setDate(end.getDate() + 1);
    }

    const durationMinutes = (end - start) / (1000 * 60);
    return (durationMinutes / 60) * 100;
  };

  // Calculer la position verticale d'une activité
  const calculateActivityTop = (activityStart, slotStart) => {
    const start = new Date(`2000-01-01T${activityStart}`);
    const slotStartTime = new Date(`2000-01-01T${slotStart}`);

    if (start < slotStartTime) return 0;

    const diffMinutes = (start - slotStartTime) / (1000 * 60);
    return (diffMinutes / 60) * 100;
  };

  // Changer la vue et définir le jour sélectionné si on passe en vue jour
  const handleViewChange = (view, day = null) => {
    setCurrentView(view);
    if (day) {
      setSelectedDay(day);
    }
  };

  // Ajouter cette fonction pour vérifier si une activité est la première occurrence du jour
  const isFirstOccurrenceOfDay = (activity, day, startTime) => {
    const dayIndex = days.indexOf(day);
    const activityStartDayIndex = days.indexOf(activity.day);
    const activityEndDayIndex = days.indexOf(activity.endDay || activity.day);

    // Si l'activité commence ce jour et à ce créneau horaire
    if (activity.day === day && activity.startTime === startTime) {
      return true;
    }

    // Si c'est le premier créneau du jour pour une activité multi-jours
    if (
      activity.multiDay &&
      activityStartDayIndex < dayIndex &&
      dayIndex <= activityEndDayIndex &&
      startTime === "00:00"
    ) {
      return true;
    }

    return false;
  };

  // Ajouter cette fonction pour vérifier si une activité doit être fusionnée avec la précédente
  const shouldMergeWithPrevious = (activity, day, startTime, prevStartTime) => {
    // Si ce n'est pas le premier créneau horaire de la journée
    if (startTime !== "00:00") {
      // Vérifier si la même activité était présente dans le créneau précédent
      const prevSlotActivities = getActivitiesForTimeSlot(
        day,
        prevStartTime,
        startTime
      );
      return prevSlotActivities.some(
        (prevActivity) => prevActivity.id === activity.id
      );
    }
    return false;
  };

  // Ajouter cette fonction pour initialiser les dates de la semaine
  const initWeekDates = (startDate = new Date()) => {
    const dates = [];
    const start = new Date(startDate);
    // Ajuster au lundi de la semaine
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0 = dimanche, 1 = lundi, etc.
    start.setDate(start.getDate() - diff);

    // Générer les dates pour chaque jour de la semaine
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    const weekData = {
      startDate: start,
      dates: dates,
    };

    setWeekDates(weekData);

    // Notifier le composant parent du changement de semaine
    if (onWeekChange) {
      onWeekChange(weekData);
    }
  };

  // Ajouter cette fonction pour changer de semaine
  const changeWeek = (direction) => {
    const newStartDate = new Date(weekDates.startDate);
    newStartDate.setDate(newStartDate.getDate() + direction * 7);
    initWeekDates(newStartDate);
  };

  // Ajouter un useEffect pour initialiser les dates au chargement
  React.useEffect(() => {
    initWeekDates();
  }, []);

  // Filtrer les jours à afficher en fonction de la vue
  const daysToShow = currentView === "week" ? days : [selectedDay];

  return (
    <div className="calendar-container">
      {/* Remplacer la section calendar-header par celle-ci pour ajouter la navigation entre semaines */}
      <div className="calendar-header">
        <div className="week-navigation">
          <button onClick={() => changeWeek(-1)}>Semaine précédente</button>
          <span className="current-week">
            {weekDates.dates.length > 0 &&
              `${weekDates.dates[0].toLocaleDateString(
                "fr-FR"
              )} - ${weekDates.dates[4].toLocaleDateString("fr-FR")}`}
          </span>
          <button onClick={() => changeWeek(1)}>Semaine suivante</button>
        </div>
        <div className="view-selector">
          <button
            className={currentView === "week" ? "active" : ""}
            onClick={() => handleViewChange("week")}
          >
            Semaine
          </button>
          {days.map((day) => (
            <button
              key={day}
              className={
                currentView === "day" && selectedDay === day ? "active" : ""
              }
              onClick={() => handleViewChange("day", day)}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="calendar">
        <div className="time-column">
          <div className="day-header"></div>
          {timeSlots.slice(0, -1).map((time, index) => (
            <div key={index} className="time-slot">
              {time}
            </div>
          ))}
        </div>

        {daysToShow.map((day) => (
          <div key={day} className="day-column">
            {/* Remplacer la section day-header dans la boucle daysToShow.map par celle-ci pour afficher les dates */}
            <div className="day-header">
              <div className="day-name">{day}</div>
              <div className="day-date">
                {weekDates.dates.length > 0 &&
                  weekDates.dates[days.indexOf(day)].toLocaleDateString(
                    "fr-FR",
                    { day: "numeric", month: "short" }
                  )}
              </div>
            </div>

            {timeSlots.slice(0, -1).map((startTime, index) => {
              const endTime = timeSlots[index + 1];
              const slotActivities = getActivitiesForTimeSlot(
                day,
                startTime,
                endTime
              );

              return (
                /* Remplacer la section qui affiche les activités dans la boucle timeSlots.slice(0, -1).map par celle-ci */
                <div
                  key={index}
                  className="time-slot"
                  onClick={() => handleTimeSlotClick(day, startTime)}
                >
                  <div className="activities-container">
                    {slotActivities.map((activity, activityIndex) => {
                      // Déterminer si c'est la première occurrence de cette activité pour ce jour
                      const isFirstOccurrence = isFirstOccurrenceOfDay(
                        activity,
                        day,
                        startTime
                      );

                      // Déterminer si cette activité doit être fusionnée avec la précédente
                      const prevStartTime =
                        index > 0 ? timeSlots[index - 1] : null;
                      const shouldMerge =
                        prevStartTime &&
                        shouldMergeWithPrevious(
                          activity,
                          day,
                          startTime,
                          prevStartTime
                        );

                      // Si l'activité doit être fusionnée et ce n'est pas la première occurrence, ne pas l'afficher
                      if (shouldMerge && !isFirstOccurrence) {
                        return null;
                      }

                      // Déterminer l'heure de début et de fin pour ce jour
                      let displayStartTime = startTime;
                      let displayEndTime = endTime;

                      const dayIndex = days.indexOf(day);
                      const activityStartDayIndex = days.indexOf(activity.day);
                      const activityEndDayIndex = days.indexOf(
                        activity.endDay || activity.day
                      );

                      // Si c'est le jour de début de l'activité
                      if (day === activity.day) {
                        displayStartTime = activity.startTime;
                      }

                      // Si c'est le jour de fin de l'activité
                      if (day === (activity.endDay || activity.day)) {
                        displayEndTime = activity.endTime;
                      }

                      // Calculer la hauteur en fonction de la durée pour ce jour
                      let activityHeight = calculateActivityHeight(
                        day,
                        displayStartTime,
                        displayEndTime
                      );

                      // Si l'activité continue le jour suivant et ce n'est pas le jour de fin
                      if (activity.multiDay && dayIndex < activityEndDayIndex) {
                        // L'activité continue jusqu'à minuit
                        activityHeight = calculateActivityHeight(
                          day,
                          displayStartTime,
                          "00:00"
                        );
                      }

                      return (
                        <div
                          key={activity.id}
                          className="activity"
                          style={{
                            backgroundColor: activity.color || "#e0e0e0",
                            height: `${activityHeight}px`,
                            top: `${calculateActivityTop(
                              displayStartTime,
                              startTime
                            )}px`,
                            width: `${
                              95 / Math.max(1, slotActivities.length)
                            }%`,
                            left: `${
                              (activityIndex * 95) /
                              Math.max(1, slotActivities.length)
                            }%`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation(); // Empêcher le déclenchement du clic sur la case
                            onActivityClick(activity);
                          }}
                        >
                          {isFirstOccurrence && (
                            <>
                              <h3>{activity.title}</h3>
                              <p>
                                {activity.day === day
                                  ? activity.startTime
                                  : "00:00"}{" "}
                                -{" "}
                                {activity.multiDay && day !== activity.endDay
                                  ? "00:00"
                                  : activity.endTime}
                              </p>
                              <p className="animators">
                                {getAnimatorNames(activity.animators)}
                              </p>
                              <p className="description">
                                <span>Description :</span> <br />{" "}
                                {activity.description}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Modal pour ajouter une activité en cliquant sur une case */}
      {showAddModal && (
        <ActivityModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveNewActivity}
          animators={animators}
          initialDay={newActivityInitialData.day}
          initialTime={newActivityInitialData.time}
          initialDate={newActivityInitialData.date} // Passer la date au modal
        />
      )}
    </div>
  );
}
