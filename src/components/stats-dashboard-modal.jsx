"use client";

import { useState, useEffect } from "react";
import "../styles/modal.css";
import "../styles/stats-dashboard.css";

export default function StatsDashboardModal({
  activities,
  animators,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("animators");
  const [stats, setStats] = useState({
    animators: [],
    activities: {},
    collaborations: [],
  });

  useEffect(() => {
    calculateStats();
  }, [activities, animators]);

  const calculateStats = () => {
    // Statistiques par animateur
    const animatorStats = animators.map((animator) => {
      const animatorActivities = activities.filter(
        (activity) =>
          activity.animators && activity.animators.includes(animator.id)
      );

      // Calculer le nombre total d'heures
      let totalMinutes = 0;
      animatorActivities.forEach((activity) => {
        const startTime = activity.startTime.split(":").map(Number);
        let endTime = activity.endTime.split(":").map(Number);

        // Gérer le cas où l'heure de fin est 00:00 (minuit)
        if (endTime[0] === 0 && endTime[1] === 0) {
          endTime = [24, 0];
        }

        const startMinutes = startTime[0] * 60 + startTime[1];
        const endMinutes = endTime[0] * 60 + endTime[1];
        const duration = endMinutes - startMinutes;

        // Si l'activité est sur plusieurs jours, calculer la durée différemment
        if (activity.multiDay) {
          // Simplification: on compte juste la durée du premier jour
          totalMinutes += duration > 0 ? duration : 0;
        } else {
          totalMinutes += duration > 0 ? duration : 0;
        }
      });

      // Calculer les collaborations
      const collaborations = {};
      animatorActivities.forEach((activity) => {
        if (activity.animators && activity.animators.length > 1) {
          activity.animators.forEach((collaboratorId) => {
            if (collaboratorId !== animator.id) {
              const collaborator = animators.find(
                (a) => a.id === collaboratorId
              );
              if (collaborator) {
                collaborations[collaboratorId] = collaborations[
                  collaboratorId
                ] || {
                  name: collaborator.name,
                  count: 0,
                  minutes: 0,
                };
                collaborations[collaboratorId].count++;

                // Ajouter la durée de l'activité
                const startTime = activity.startTime.split(":").map(Number);
                let endTime = activity.endTime.split(":").map(Number);
                if (endTime[0] === 0 && endTime[1] === 0) endTime = [24, 0];
                const startMinutes = startTime[0] * 60 + startTime[1];
                const endMinutes = endTime[0] * 60 + endTime[1];
                const duration = endMinutes - startMinutes;
                collaborations[collaboratorId].minutes +=
                  duration > 0 ? duration : 0;
              }
            }
          });
        }
      });

      return {
        id: animator.id,
        name: animator.name,
        specialty: animator.specialty,
        totalActivities: animatorActivities.length,
        totalHours: Math.floor(totalMinutes / 60),
        totalMinutes: totalMinutes % 60,
        collaborations: Object.values(collaborations).sort(
          (a, b) => b.count - a.count
        ),
      };
    });

    // Statistiques globales des activités
    const activityStats = {
      total: activities.length,
      byDay: {
        Lundi: 0,
        Mardi: 0,
        Mercredi: 0,
        Jeudi: 0,
        Vendredi: 0,
        Samedi: 0,
        Dimanche: 0,
      },
      byTimeSlot: {
        morning: 0, // 6h-12h
        afternoon: 0, // 12h-18h
        evening: 0, // 18h-00h
      },
      averageDuration: 0,
      multiDayCount: 0,
    };

    let totalDurationMinutes = 0;

    activities.forEach((activity) => {
      // Compter par jour
      activityStats.byDay[activity.day] =
        (activityStats.byDay[activity.day] || 0) + 1;

      // Compter par créneau horaire
      const hour = Number.parseInt(activity.startTime.split(":")[0]);
      if (hour >= 6 && hour < 12) {
        activityStats.byTimeSlot.morning++;
      } else if (hour >= 12 && hour < 18) {
        activityStats.byTimeSlot.afternoon++;
      } else {
        activityStats.byTimeSlot.evening++;
      }

      // Calculer la durée
      const startTime = activity.startTime.split(":").map(Number);
      let endTime = activity.endTime.split(":").map(Number);
      if (endTime[0] === 0 && endTime[1] === 0) endTime = [24, 0];
      const startMinutes = startTime[0] * 60 + startTime[1];
      const endMinutes = endTime[0] * 60 + endTime[1];
      const duration = endMinutes - startMinutes;
      totalDurationMinutes += duration > 0 ? duration : 0;

      // Compter les activités multi-jours
      if (activity.multiDay) {
        activityStats.multiDayCount++;
      }
    });

    // Calculer la durée moyenne
    activityStats.averageDuration = activities.length
      ? Math.round(totalDurationMinutes / activities.length)
      : 0;

    // Matrice de collaboration entre animateurs
    const collaborationMatrix = [];
    for (let i = 0; i < animators.length; i++) {
      const row = [];
      for (let j = 0; j < animators.length; j++) {
        if (i === j) {
          row.push(0);
          continue;
        }

        // Compter les activités où les deux animateurs travaillent ensemble
        const collaborationCount = activities.filter(
          (activity) =>
            activity.animators &&
            activity.animators.includes(animators[i].id) &&
            activity.animators.includes(animators[j].id)
        ).length;

        row.push(collaborationCount);
      }
      collaborationMatrix.push(row);
    }

    setStats({
      animators: animatorStats,
      activities: activityStats,
      collaborations: collaborationMatrix,
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins + "min" : ""}`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal stats-dashboard-modal">
        <div className="modal-header">
          <h2>Tableau de bord statistique</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div className="stats-tabs">
            <button
              className={`tab-button ${
                activeTab === "animators" ? "active" : ""
              }`}
              onClick={() => setActiveTab("animators")}
            >
              Animateurs
            </button>
            <button
              className={`tab-button ${
                activeTab === "activities" ? "active" : ""
              }`}
              onClick={() => setActiveTab("activities")}
            >
              Activités
            </button>
            <button
              className={`tab-button ${
                activeTab === "collaborations" ? "active" : ""
              }`}
              onClick={() => setActiveTab("collaborations")}
            >
              Collaborations
            </button>
          </div>

          <div className="stats-content">
            {activeTab === "animators" && (
              <div className="animators-stats">
                <h3>Statistiques par animateur</h3>
                <div className="stats-table-container">
                  <table className="stats-table">
                    <thead>
                      <tr>
                        <th>Animateur</th>
                        <th>Spécialité</th>
                        <th>Activités</th>
                        <th>Temps total</th>
                        <th>Collaboration principale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.animators
                        .sort((a, b) => b.totalActivities - a.totalActivities)
                        .map((animator) => (
                          <tr key={animator.id}>
                            <td>{animator.name}</td>
                            <td>{animator.specialty}</td>
                            <td>{animator.totalActivities}</td>
                            <td>
                              {animator.totalHours}h
                              {animator.totalMinutes > 0
                                ? animator.totalMinutes + "min"
                                : ""}
                            </td>
                            <td>
                              {animator.collaborations.length > 0
                                ? `${animator.collaborations[0].name} (${animator.collaborations[0].count} fois)`
                                : "Aucune"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="stats-details">
                  <h4>Détails des collaborations</h4>
                  <div className="collaboration-details">
                    {stats.animators.map((animator) => (
                      <div
                        key={animator.id}
                        className="animator-collaborations"
                      >
                        <h5>{animator.name}</h5>
                        {animator.collaborations.length > 0 ? (
                          <ul>
                            {animator.collaborations.map((collab, index) => (
                              <li key={index}>
                                <span className="collab-name">
                                  {collab.name}
                                </span>
                                :{" "}
                                <span className="collab-count">
                                  {collab.count} activités
                                </span>{" "}
                                ({formatDuration(collab.minutes)})
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="no-data">Aucune collaboration</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activities" && (
              <div className="activities-stats">
                <h3>Statistiques des activités</h3>

                <div className="stats-summary">
                  <div className="stat-card">
                    <div className="stat-value">{stats.activities.total}</div>
                    <div className="stat-label">Activités au total</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {stats.activities.multiDayCount}
                    </div>
                    <div className="stat-label">Activités multi-jours</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {formatDuration(stats.activities.averageDuration)}
                    </div>
                    <div className="stat-label">Durée moyenne</div>
                  </div>
                </div>

                <div className="stats-charts">
                  <div className="chart-container">
                    <h4>Répartition par jour</h4>
                    <div className="bar-chart">
                      {Object.entries(stats.activities.byDay).map(
                        ([day, count]) => (
                          <div key={day} className="chart-item">
                            <div className="chart-label">{day}</div>
                            <div className="chart-bar-container">
                              <div
                                className="chart-bar"
                                style={{
                                  width: `${
                                    stats.activities.total > 0
                                      ? (count / stats.activities.total) * 100
                                      : 0
                                  }%`,
                                }}
                              >
                                {count}
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="chart-container">
                    <h4>Répartition par créneau horaire</h4>
                    <div className="bar-chart">
                      <div className="chart-item">
                        <div className="chart-label">Matin (6h-12h)</div>
                        <div className="chart-bar-container">
                          <div
                            className="chart-bar morning"
                            style={{
                              width: `${
                                stats.activities.total > 0
                                  ? (stats.activities.byTimeSlot.morning /
                                      stats.activities.total) *
                                    100
                                  : 0
                              }%`,
                            }}
                          >
                            {stats.activities.byTimeSlot.morning}
                          </div>
                        </div>
                      </div>
                      <div className="chart-item">
                        <div className="chart-label">Après-midi (12h-18h)</div>
                        <div className="chart-bar-container">
                          <div
                            className="chart-bar afternoon"
                            style={{
                              width: `${
                                stats.activities.total > 0
                                  ? (stats.activities.byTimeSlot.afternoon /
                                      stats.activities.total) *
                                    100
                                  : 0
                              }%`,
                            }}
                          >
                            {stats.activities.byTimeSlot.afternoon}
                          </div>
                        </div>
                      </div>
                      <div className="chart-item">
                        <div className="chart-label">Soir (18h-00h)</div>
                        <div className="chart-bar-container">
                          <div
                            className="chart-bar evening"
                            style={{
                              width: `${
                                stats.activities.total > 0
                                  ? (stats.activities.byTimeSlot.evening /
                                      stats.activities.total) *
                                    100
                                  : 0
                              }%`,
                            }}
                          >
                            {stats.activities.byTimeSlot.evening}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "collaborations" && (
              <div className="collaborations-stats">
                <h3>Matrice de collaboration</h3>
                {animators.length > 0 ? (
                  <div className="collaboration-matrix-container">
                    <table className="collaboration-matrix">
                      <thead>
                        <tr>
                          <th></th>
                          {animators.map((animator) => (
                            <th key={animator.id} className="matrix-header">
                              {animator.name.split(" ")[0]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.collaborations.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            <th className="matrix-header">
                              {animators[rowIndex].name.split(" ")[0]}
                            </th>
                            {row.map((count, colIndex) => (
                              <td
                                key={colIndex}
                                className={`matrix-cell ${
                                  count > 0 ? "has-collaboration" : ""
                                }`}
                                title={`${animators[rowIndex].name} et ${animators[colIndex].name}: ${count} activités ensemble`}
                              >
                                {count}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="no-data">
                    Aucune donnée de collaboration disponible
                  </p>
                )}

                <div className="collaboration-legend">
                  <h4>Légende</h4>
                  <p>
                    Chaque cellule indique le nombre d'activités où les deux
                    animateurs ont travaillé ensemble. Les cellules colorées
                    indiquent une collaboration.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
