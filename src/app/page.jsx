"use client";

import { useState, useEffect } from "react";
import Calendar from "../components/Calendar";
import ActivityModal from "../components/ActivityModal";
import AnimatorModal from "../components/AnimatorModal";
import ActivityDetailsModal from "../components/ActivityDetailsModal";
import AnimatorsListModal from "../components/AnimatorsListModal";
import ExportButton from "../components/ExportButton";
import SyncModal from "../components/SyncModal";
import "../styles/page.css";

export default function Home() {
  const [activities, setActivities] = useState([]);
  const [animators, setAnimators] = useState([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showAnimatorModal, setShowAnimatorModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedAnimator, setSelectedAnimator] = useState(null);
  const [showAnimatorsListModal, setShowAnimatorsListModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [currentWeekDates, setCurrentWeekDates] = useState({
    startDate: new Date(),
    dates: [],
  });

  // Fonction pour nettoyer les données invalides
  const cleanInvalidData = (dataArray) => {
    if (!Array.isArray(dataArray)) return [];

    return dataArray.filter((item) => {
      // Vérifier que l'objet existe et a les propriétés minimales nécessaires
      return item && typeof item === "object" && item.id;
    });
  };

  // Charger les données depuis localStorage au démarrage
  useEffect(() => {
    try {
      const savedActivities = localStorage.getItem("activities");
      const savedAnimators = localStorage.getItem("animators");

      // Nettoyer et valider les données avant de les utiliser
      if (savedActivities) {
        const parsedActivities = JSON.parse(savedActivities);
        const cleanedActivities = cleanInvalidData(parsedActivities);
        setActivities(cleanedActivities);

        // Si des données ont été nettoyées, mettre à jour le localStorage
        if (cleanedActivities.length !== parsedActivities.length) {
          localStorage.setItem("activities", JSON.stringify(cleanedActivities));
        }
      }

      if (savedAnimators) {
        const parsedAnimators = JSON.parse(savedAnimators);
        const cleanedAnimators = cleanInvalidData(parsedAnimators);
        setAnimators(cleanedAnimators);

        // Si des données ont été nettoyées, mettre à jour le localStorage
        if (cleanedAnimators.length !== parsedAnimators.length) {
          localStorage.setItem("animators", JSON.stringify(cleanedAnimators));
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      // En cas d'erreur, réinitialiser le localStorage
      localStorage.removeItem("activities");
      localStorage.removeItem("animators");
      setActivities([]);
      setAnimators([]);
    }
  }, []);

  // Sauvegarder les données dans localStorage quand elles changent
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem("activities", JSON.stringify(activities));
    } else {
      // Si pas d'activités, supprimer l'entrée du localStorage pour éviter les données résiduelles
      localStorage.removeItem("activities");
    }

    if (animators.length > 0) {
      localStorage.setItem("animators", JSON.stringify(animators));
    } else {
      localStorage.removeItem("animators");
    }
  }, [activities, animators]);

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    setShowDetailsModal(true);
  };

  const handleAddActivity = (newActivity) => {
    const id =
      activities.length > 0 ? Math.max(...activities.map((a) => a.id)) + 1 : 1;
    const activityWithId = { ...newActivity, id };
    setActivities([...activities, activityWithId]);
    setShowActivityModal(false);
  };

  const handleEditActivity = (updatedActivity) => {
    setActivities(
      activities.map((activity) =>
        activity.id === updatedActivity.id ? updatedActivity : activity
      )
    );
    setShowDetailsModal(false);
  };

  const handleDeleteActivity = (id) => {
    setActivities(activities.filter((activity) => activity.id !== id));
    setShowDetailsModal(false);
  };

  // Fonction pour supprimer toutes les activités
  const handleClearAllActivities = () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer toutes les activités ?"
      )
    ) {
      setActivities([]);
      localStorage.removeItem("activities");
    }
  };

  const handleAddAnimator = (newAnimator) => {
    const id =
      animators.length > 0 ? Math.max(...animators.map((a) => a.id)) + 1 : 1;
    const animatorWithId = { ...newAnimator, id };
    setAnimators([...animators, animatorWithId]);
    setShowAnimatorModal(false);
  };

  const handleEditAnimator = (updatedAnimator) => {
    setAnimators(
      animators.map((animator) =>
        animator.id === updatedAnimator.id ? updatedAnimator : animator
      )
    );
    setShowAnimatorModal(false);
  };

  const handleDeleteAnimator = (id) => {
    setAnimators(animators.filter((animator) => animator.id !== id));
    setShowAnimatorModal(false);
  };

  const handleAnimatorClick = (animator) => {
    setSelectedAnimator(animator);
    setShowAnimatorModal(true);
  };

  // Fonction pour mettre à jour les dates de la semaine actuelle
  const updateCurrentWeek = (weekData) => {
    setCurrentWeekDates(weekData);
  };

  // Nouvelle fonction pour gérer l'importation des données
  const handleDataImport = (importedActivities, importedAnimators) => {
    // Vérifier et nettoyer les données importées
    const cleanedActivities = cleanInvalidData(importedActivities);
    const cleanedAnimators = cleanInvalidData(importedAnimators);

    // Mettre à jour l'état avec les données importées
    setActivities(cleanedActivities);
    setAnimators(cleanedAnimators);

    // Sauvegarder dans localStorage
    localStorage.setItem("activities", JSON.stringify(cleanedActivities));
    localStorage.setItem("animators", JSON.stringify(cleanedAnimators));
  };

  return (
    <main className="container">
      <header>
        <h1>Calendrier des Animations</h1>
        <div className="actions">
          <button onClick={() => setShowActivityModal(true)}>
            Ajouter une activité
          </button>
          <button onClick={() => setShowAnimatorModal(true)}>
            Ajouter un animateur
          </button>
          <button onClick={() => setShowAnimatorsListModal(true)}>
            Voir les animateurs
          </button>
          <ExportButton
            activities={activities}
            animators={animators}
            currentWeekDates={currentWeekDates}
          />
          <button
            onClick={() => setShowSyncModal(true)}
            className="sync-button"
          >
            Synchroniser
          </button>
          {activities.length > 0 && (
            <button
              onClick={handleClearAllActivities}
              className="clear-button"
              style={{ backgroundColor: "#ff4d4d" }}
            >
              Supprimer toutes les activités
            </button>
          )}
        </div>
      </header>

      <Calendar
        activities={activities}
        animators={animators}
        onActivityClick={handleActivityClick}
        onAddActivity={handleAddActivity}
        onWeekChange={updateCurrentWeek}
      />

      {showAnimatorsListModal && (
        <AnimatorsListModal
          animators={animators}
          onClose={() => {
            setSelectedAnimator(null);
            setShowAnimatorsListModal(false);
          }}
          onEdit={(animator) => {
            setSelectedAnimator(animator);
            setShowAnimatorModal(true);
            setShowAnimatorsListModal(false);
          }}
          onDelete={handleDeleteAnimator}
        />
      )}

      {showActivityModal && (
        <ActivityModal
          onClose={() => setShowActivityModal(false)}
          onSave={handleAddActivity}
          animators={animators}
        />
      )}

      {showAnimatorModal && (
        <AnimatorModal
          onClose={() => setShowAnimatorModal(false)}
          onSave={selectedAnimator ? handleEditAnimator : handleAddAnimator}
          onDelete={handleDeleteAnimator}
          animator={selectedAnimator}
        />
      )}

      {showDetailsModal && selectedActivity && (
        <ActivityDetailsModal
          activity={selectedActivity}
          animators={animators}
          onClose={() => setShowDetailsModal(false)}
          onEdit={handleEditActivity}
          onDelete={handleDeleteActivity}
        />
      )}

      {showSyncModal && (
        <SyncModal
          activities={activities}
          animators={animators}
          onClose={() => setShowSyncModal(false)}
          onDataImport={handleDataImport}
        />
      )}
    </main>
  );
}
