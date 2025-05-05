"use client";

import { useState, useEffect } from "react";
import "../styles/modal.css";
import "../styles/stats-dashboard.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

export default function StatsDashboardModal({
  activities,
  animators,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    overview: {
      totalActivities: 0,
      totalHours: 0,
      averageDuration: 0,
      mostActiveDay: "",
      mostActiveAnimator: "",
      upcomingActivities: 0,
      pastActivities: 0,
      multiDayActivities: 0,
      averageAnimatorsPerActivity: 0,
    },
    animators: [],
    activities: {
      byDay: [],
      byTimeSlot: [],
      byMonth: [],
      byDuration: [],
      byAnimatorCount: [],
    },
    collaborations: [],
    trends: {
      activitiesByWeek: [],
      hoursByWeek: [],
      animatorWorkload: [],
    },
  });
  const [timeFilter, setTimeFilter] = useState("all"); // all, past3months, future

  const chartRefs = {
    overview: {},
    animators: {},
    activities: {},
    collaborations: {},
    trends: {},
  };

  useEffect(() => {
    calculateStats();
  }, [activities, animators, timeFilter]);

  const calculateStats = () => {
    // Filtrer les activités selon le filtre temporel
    const filteredActivities = filterActivitiesByTime(activities);

    // Statistiques générales
    const totalActivities = filteredActivities.length;
    let totalMinutes = 0;
    const dayCount = {
      Lundi: 0,
      Mardi: 0,
      Mercredi: 0,
      Jeudi: 0,
      Vendredi: 0,
      Samedi: 0,
      Dimanche: 0,
    };
    const animatorActivityCount = {};
    let upcomingActivities = 0;
    let pastActivities = 0;
    let multiDayActivities = 0;
    let totalAnimatorsCount = 0;
    const today = new Date();

    // Statistiques par mois
    const monthCount = {};
    const monthNames = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];

    // Statistiques par durée
    const durationBuckets = {
      "< 1h": 0,
      "1h - 2h": 0,
      "2h - 3h": 0,
      "3h - 4h": 0,
      "> 4h": 0,
    };

    // Statistiques par nombre d'animateurs
    const animatorCountBuckets = {
      "1 animateur": 0,
      "2 animateurs": 0,
      "3 animateurs": 0,
      "4+ animateurs": 0,
    };

    // Statistiques par semaine pour les tendances
    const weeklyStats = {};
    const weeklyHours = {};
    const animatorWeeklyHours = {};

    filteredActivities.forEach((activity) => {
      // Calculer la durée totale
      const startTime = activity.startTime.split(":").map(Number);
      let endTime = activity.endTime.split(":").map(Number);
      if (endTime[0] === 0 && endTime[1] === 0) endTime = [24, 0];
      const startMinutes = startTime[0] * 60 + startTime[1];
      const endMinutes = endTime[0] * 60 + endTime[1];
      const duration = endMinutes - startMinutes;
      const durationHours = duration / 60;
      totalMinutes += duration > 0 ? duration : 0;

      // Compter par jour
      dayCount[activity.day] = (dayCount[activity.day] || 0) + 1;

      // Compter par animateur
      if (activity.animators && Array.isArray(activity.animators)) {
        totalAnimatorsCount += activity.animators.length;
        activity.animators.forEach((animatorId) => {
          animatorActivityCount[animatorId] =
            (animatorActivityCount[animatorId] || 0) + 1;
        });

        // Compter par nombre d'animateurs
        if (activity.animators.length === 1)
          animatorCountBuckets["1 animateur"]++;
        else if (activity.animators.length === 2)
          animatorCountBuckets["2 animateurs"]++;
        else if (activity.animators.length === 3)
          animatorCountBuckets["3 animateurs"]++;
        else animatorCountBuckets["4+ animateurs"]++;
      } else {
        animatorCountBuckets["1 animateur"]++;
      }

      // Compter par durée
      if (durationHours < 1) durationBuckets["< 1h"]++;
      else if (durationHours < 2) durationBuckets["1h - 2h"]++;
      else if (durationHours < 3) durationBuckets["2h - 3h"]++;
      else if (durationHours < 4) durationBuckets["3h - 4h"]++;
      else durationBuckets["> 4h"]++;

      // Compter les activités à venir et passées
      if (activity.fullDate) {
        const activityDate = new Date(activity.fullDate);
        if (activityDate > today) {
          upcomingActivities++;
        } else {
          pastActivities++;
        }

        // Compter par mois
        const month = activityDate.getMonth();
        monthCount[month] = (monthCount[month] || 0) + 1;

        // Compter par semaine pour les tendances
        const weekKey = getWeekKey(activityDate);
        weeklyStats[weekKey] = (weeklyStats[weekKey] || 0) + 1;
        weeklyHours[weekKey] = (weeklyHours[weekKey] || 0) + durationHours;

        // Compter les heures par semaine par animateur
        if (activity.animators && Array.isArray(activity.animators)) {
          activity.animators.forEach((animatorId) => {
            if (!animatorWeeklyHours[animatorId]) {
              animatorWeeklyHours[animatorId] = {};
            }
            animatorWeeklyHours[animatorId][weekKey] =
              (animatorWeeklyHours[animatorId][weekKey] || 0) +
              durationHours / activity.animators.length;
          });
        }
      }

      // Compter les activités multi-jours
      if (activity.multiDay) {
        multiDayActivities++;
      }
    });

    // Trouver le jour le plus actif
    const mostActiveDay = Object.keys(dayCount).reduce(
      (a, b) => (dayCount[a] > dayCount[b] ? a : b),
      ""
    );

    // Trouver l'animateur le plus actif
    const mostActiveAnimatorId = Object.keys(animatorActivityCount).reduce(
      (a, b) => (animatorActivityCount[a] > animatorActivityCount[b] ? a : b),
      ""
    );
    const mostActiveAnimator =
      animators.find((a) => a.id === Number(mostActiveAnimatorId))?.name ||
      "Inconnu";

    // Statistiques par animateur
    const animatorStats = animators
      .map((animator) => {
        const animatorActivities = filteredActivities.filter(
          (activity) =>
            activity.animators && activity.animators.includes(animator.id)
        );

        // Calculer le nombre total d'heures
        let totalMinutes = 0;
        animatorActivities.forEach((activity) => {
          const startTime = activity.startTime.split(":").map(Number);
          let endTime = activity.endTime.split(":").map(Number);
          if (endTime[0] === 0 && endTime[1] === 0) endTime = [24, 0];
          const startMinutes = startTime[0] * 60 + startTime[1];
          const endMinutes = endTime[0] * 60 + endTime[1];
          const duration = endMinutes - startMinutes;
          totalMinutes += duration > 0 ? duration : 0;
        });

        // Calculer les jours les plus actifs pour cet animateur
        const animatorDayCount = {
          Lundi: 0,
          Mardi: 0,
          Mercredi: 0,
          Jeudi: 0,
          Vendredi: 0,
          Samedi: 0,
          Dimanche: 0,
        };
        animatorActivities.forEach((activity) => {
          animatorDayCount[activity.day] =
            (animatorDayCount[activity.day] || 0) + 1;
        });

        const mostActiveDay = Object.keys(animatorDayCount).reduce(
          (a, b) => (animatorDayCount[a] > animatorDayCount[b] ? a : b),
          ""
        );

        // Calculer le taux d'occupation (heures par semaine en moyenne)
        const totalHours = totalMinutes / 60;
        const weeksCount = Object.keys(weeklyStats).length || 1;
        const weeklyAverage = totalHours / weeksCount;

        return {
          id: animator.id,
          name: animator.name,
          specialty: animator.specialty,
          totalActivities: animatorActivities.length,
          totalHours: Math.floor(totalMinutes / 60),
          totalMinutes: totalMinutes % 60,
          mostActiveDay,
          activityPercentage:
            totalActivities > 0
              ? Math.round((animatorActivities.length / totalActivities) * 100)
              : 0,
          weeklyAverage: Math.round(weeklyAverage * 10) / 10,
          dayDistribution: Object.entries(animatorDayCount).map(
            ([day, count]) => ({
              day,
              count,
            })
          ),
        };
      })
      .sort((a, b) => b.totalActivities - a.totalActivities);

    // Statistiques des activités par jour
    const activitiesByDay = Object.entries(dayCount)
      .map(([day, count]) => ({
        day,
        count,
        percentage:
          totalActivities > 0 ? Math.round((count / totalActivities) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Statistiques des activités par créneau horaire
    const timeSlotCount = { morning: 0, afternoon: 0, evening: 0 };
    filteredActivities.forEach((activity) => {
      const hour = Number.parseInt(activity.startTime.split(":")[0]);
      if (hour >= 6 && hour < 12) {
        timeSlotCount.morning++;
      } else if (hour >= 12 && hour < 18) {
        timeSlotCount.afternoon++;
      } else {
        timeSlotCount.evening++;
      }
    });

    const activitiesByTimeSlot = [
      { name: "Matin (6h-12h)", value: timeSlotCount.morning },
      { name: "Après-midi (12h-18h)", value: timeSlotCount.afternoon },
      { name: "Soir (18h-00h)", value: timeSlotCount.evening },
    ];

    // Statistiques des activités par mois
    const activitiesByMonth = monthNames.map((name, index) => ({
      name,
      count: monthCount[index] || 0,
    }));

    // Statistiques des activités par durée
    const activitiesByDuration = Object.entries(durationBuckets).map(
      ([range, count]) => ({
        range,
        count,
      })
    );

    // Statistiques des activités par nombre d'animateurs
    const activitiesByAnimatorCount = Object.entries(animatorCountBuckets).map(
      ([range, count]) => ({
        range,
        count,
      })
    );

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
        const collaborationCount = filteredActivities.filter(
          (activity) =>
            activity.animators &&
            activity.animators.includes(animators[i].id) &&
            activity.animators.includes(animators[j].id)
        ).length;

        row.push(collaborationCount);
      }
      collaborationMatrix.push(row);
    }

    // Top collaborations
    const topCollaborations = [];
    for (let i = 0; i < animators.length; i++) {
      for (let j = i + 1; j < animators.length; j++) {
        const count = filteredActivities.filter(
          (activity) =>
            activity.animators &&
            activity.animators.includes(animators[i].id) &&
            activity.animators.includes(animators[j].id)
        ).length;

        if (count > 0) {
          topCollaborations.push({
            animator1: animators[i].name,
            animator2: animators[j].name,
            count,
          });
        }
      }
    }
    topCollaborations.sort((a, b) => b.count - a.count);

    // Tendances par semaine
    const activitiesByWeek = Object.entries(weeklyStats)
      .map(([week, count]) => ({
        week,
        count,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    const hoursByWeek = Object.entries(weeklyHours)
      .map(([week, hours]) => ({
        week,
        hours: Math.round(hours * 10) / 10,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Charge de travail des animateurs par semaine
    const animatorWorkload = animators
      .filter((animator) => animatorWeeklyHours[animator.id])
      .map((animator) => {
        const weeklyData = Object.entries(
          animatorWeeklyHours[animator.id] || {}
        )
          .map(([week, hours]) => ({
            week,
            hours: Math.round(hours * 10) / 10,
          }))
          .sort((a, b) => a.week.localeCompare(b.week));

        return {
          id: animator.id,
          name: animator.name,
          weeklyData,
        };
      });

    setStats({
      overview: {
        totalActivities,
        totalHours: Math.floor(totalMinutes / 60),
        averageDuration:
          totalActivities > 0 ? Math.round(totalMinutes / totalActivities) : 0,
        mostActiveDay,
        mostActiveAnimator,
        upcomingActivities,
        pastActivities,
        multiDayActivities,
        averageAnimatorsPerActivity:
          totalActivities > 0
            ? Math.round((totalAnimatorsCount / totalActivities) * 10) / 10
            : 0,
      },
      animators: animatorStats,
      activities: {
        byDay: activitiesByDay,
        byTimeSlot: activitiesByTimeSlot,
        byMonth: activitiesByMonth,
        byDuration: activitiesByDuration,
        byAnimatorCount: activitiesByAnimatorCount,
      },
      collaborations: {
        matrix: collaborationMatrix,
        top: topCollaborations.slice(0, 5),
      },
      trends: {
        activitiesByWeek,
        hoursByWeek,
        animatorWorkload,
      },
    });
  };

  // Fonction pour filtrer les activités selon le filtre temporel
  const filterActivitiesByTime = (activities) => {
    if (timeFilter === "all") return activities;

    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    return activities.filter((activity) => {
      if (!activity.fullDate) return true;

      const activityDate = new Date(activity.fullDate);
      if (timeFilter === "past3months") {
        return activityDate >= threeMonthsAgo && activityDate <= today;
      } else if (timeFilter === "future") {
        return activityDate > today;
      }
      return true;
    });
  };

  // Fonction pour obtenir une clé de semaine à partir d'une date (format YYYY-WW)
  const getWeekKey = (date) => {
    const d = new Date(date);
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDaysOfYear = (d - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil(
      (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
    );
    return `${d.getFullYear()}-${weekNumber.toString().padStart(2, "0")}`;
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins + "min" : ""}`;
  };

  // Couleurs pour les graphiques
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#8dd1e1",
  ];
  const DAY_COLORS = {
    Lundi: "#0088FE",
    Mardi: "#00C49F",
    Mercredi: "#FFBB28",
    Jeudi: "#FF8042",
    Vendredi: "#8884d8",
    Samedi: "#82ca9d",
    Dimanche: "#ffc658",
  };

  // Référence pour les graphiques
  const setChartRef = (tab, chartName, ref) => {
    if (ref) {
      chartRefs[tab][chartName] = ref;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal stats-dashboard-modal">
        <div className="modal-header">
          <h2>Tableau de bord statistique</h2>
          <div className="modal-header-actions">
            <div className="time-filter">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <option value="all">Toutes les périodes</option>
                <option value="past3months">3 derniers mois</option>
                <option value="future">Activités à venir</option>
              </select>
            </div>

            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="modal-content">
          <div className="stats-tabs">
            <button
              className={`tab-button ${
                activeTab === "overview" ? "active" : ""
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Vue d'ensemble
            </button>
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
            <button
              className={`tab-button ${activeTab === "trends" ? "active" : ""}`}
              onClick={() => setActiveTab("trends")}
            >
              Tendances
            </button>
          </div>

          <div className="stats-content">
            {activeTab === "overview" && (
              <div className="overview-stats">
                <h3>Vue d'ensemble</h3>

                <div className="stats-cards">
                  <div className="stat-card">
                    <div className="stat-value">
                      {stats.overview.totalActivities}
                    </div>
                    <div className="stat-label">Activités totales</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {stats.overview.totalHours}h
                    </div>
                    <div className="stat-label">Heures d'animation</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {formatDuration(stats.overview.averageDuration)}
                    </div>
                    <div className="stat-label">Durée moyenne</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {stats.overview.upcomingActivities}
                    </div>
                    <div className="stat-label">Activités à venir</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {stats.overview.multiDayActivities}
                    </div>
                    <div className="stat-label">Activités multi-jours</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">
                      {stats.overview.averageAnimatorsPerActivity}
                    </div>
                    <div className="stat-label">Animateurs par activité</div>
                  </div>
                </div>

                <div className="overview-highlights">
                  <div className="highlight-box">
                    <h4>Jour le plus actif</h4>
                    <div className="highlight-content">
                      <div
                        className="highlight-icon"
                        style={{
                          backgroundColor:
                            DAY_COLORS[stats.overview.mostActiveDay] ||
                            "#0088FE",
                        }}
                      >
                        {stats.overview.mostActiveDay.substring(0, 2)}
                      </div>
                      <div className="highlight-text">
                        <div className="highlight-value">
                          {stats.overview.mostActiveDay}
                        </div>
                        <div className="highlight-subtext">
                          {stats.activities.byDay.find(
                            (d) => d.day === stats.overview.mostActiveDay
                          )?.count || 0}{" "}
                          activités
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="highlight-box">
                    <h4>Animateur le plus actif</h4>
                    <div className="highlight-content">
                      <div className="highlight-icon animator-icon">
                        {stats.overview.mostActiveAnimator.substring(0, 1)}
                      </div>
                      <div className="highlight-text">
                        <div className="highlight-value">
                          {stats.overview.mostActiveAnimator}
                        </div>
                        <div className="highlight-subtext">
                          {stats.animators.find(
                            (a) => a.name === stats.overview.mostActiveAnimator
                          )?.totalActivities || 0}{" "}
                          activités
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overview-charts">
                  <div
                    className="chart-container"
                    ref={(ref) => setChartRef("overview", "dayChart", ref)}
                  >
                    <h4>Répartition par jour</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.activities.byDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" name="Activités">
                          {stats.activities.byDay.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={DAY_COLORS[entry.day]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div
                    className="chart-container"
                    ref={(ref) => setChartRef("overview", "timeSlotChart", ref)}
                  >
                    <h4>Répartition par créneau horaire</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={stats.activities.byTimeSlot}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {stats.activities.byTimeSlot.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

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
                        <th>Jour préféré</th>
                        <th>Moy. hebdo</th>
                        <th>% des activités</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.animators.map((animator) => (
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
                          <td>{animator.mostActiveDay}</td>
                          <td>{animator.weeklyAverage}h</td>
                          <td>
                            <div className="percentage-bar-container">
                              <div
                                className="percentage-bar"
                                style={{
                                  width: `${animator.activityPercentage}%`,
                                }}
                              >
                                {animator.activityPercentage}%
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  className="animator-charts"
                  ref={(ref) => setChartRef("animators", "chart", ref)}
                >
                  <h4>Répartition des activités par animateur</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={stats.animators.slice(0, 10)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="totalActivities"
                        name="Nombre d'activités"
                        fill="#8884d8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === "activities" && (
              <div className="activities-stats">
                <h3>Statistiques des activités</h3>

                <div className="activities-charts">
                  <div className="chart-container">
                    <h4>Répartition par jour</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.activities.byDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="count"
                          name="Nombre d'activités"
                          fill="#8884d8"
                        />
                        <Bar
                          dataKey="percentage"
                          name="Pourcentage (%)"
                          fill="#82ca9d"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-container">
                    <h4>Répartition par mois</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.activities.byMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="count"
                          name="Nombre d'activités"
                          fill="#8884d8"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-container">
                    <h4>Répartition par durée</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.activities.byDuration}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="count"
                          name="Nombre d'activités"
                          fill="#8884d8"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-container">
                    <h4>Répartition par nombre d'animateurs</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stats.activities.byAnimatorCount}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="count"
                          name="Nombre d'activités"
                          fill="#8884d8"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-container">
                    <h4>Répartition par créneau horaire</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={stats.activities.byTimeSlot}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, value, percent }) =>
                            `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {stats.activities.byTimeSlot.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "collaborations" && (
              <div className="collaborations-stats">
                <h3>Collaborations entre animateurs</h3>

                <div className="top-collaborations">
                  <h4>Top 5 des collaborations</h4>
                  {stats.collaborations.top &&
                  stats.collaborations.top.length > 0 ? (
                    <div className="collaboration-cards">
                      {stats.collaborations.top.map((collab, index) => (
                        <div key={index} className="collaboration-card">
                          <div className="collaboration-names">
                            <span>{collab.animator1}</span>
                            <span className="collaboration-with">avec</span>
                            <span>{collab.animator2}</span>
                          </div>
                          <div className="collaboration-count">
                            {collab.count} activités ensemble
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">Aucune collaboration détectée</p>
                  )}
                </div>

                {animators.length > 0 && (
                  <div className="collaboration-matrix-container">
                    <h4>Matrice de collaboration</h4>
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
                        {stats.collaborations.matrix &&
                          stats.collaborations.matrix.map((row, rowIndex) => (
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
                                  style={{
                                    backgroundColor:
                                      count > 0
                                        ? `rgba(0, 123, 255, ${Math.min(
                                            count * 0.2,
                                            0.8
                                          )})`
                                        : "transparent",
                                  }}
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
                )}
              </div>
            )}

            {activeTab === "trends" && (
              <div className="trends-stats">
                <h3>Tendances et évolution</h3>

                <div className="trend-charts">
                  <div
                    className="chart-container"
                    ref={(ref) => setChartRef("trends", "activitiesChart", ref)}
                  >
                    <h4>Évolution du nombre d'activités par semaine</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={stats.trends.activitiesByWeek}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="count"
                          name="Nombre d'activités"
                          stroke="#8884d8"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div
                    className="chart-container"
                    ref={(ref) => setChartRef("trends", "hoursChart", ref)}
                  >
                    <h4>Évolution des heures d'animation par semaine</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={stats.trends.hoursByWeek}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="hours"
                          name="Heures d'animation"
                          fill="#82ca9d"
                          stroke="#82ca9d"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {stats.trends.animatorWorkload.length > 0 && (
                    <div className="chart-container">
                      <h4>Charge de travail des animateurs par semaine</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="week"
                            type="category"
                            allowDuplicatedCategory={false}
                            domain={stats.trends.hoursByWeek.map(
                              (entry) => entry.week
                            )}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          {stats.trends.animatorWorkload
                            .slice(0, 5)
                            .map((animator, index) => (
                              <Line
                                key={animator.id}
                                data={animator.weeklyData}
                                type="monotone"
                                dataKey="hours"
                                name={animator.name}
                                stroke={COLORS[index % COLORS.length]}
                                activeDot={{ r: 8 }}
                              />
                            ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer"></div>
      </div>
    </div>
  );
}
