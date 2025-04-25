"use client";

import { useState, useEffect } from "react";
import DragDropCalendar from "../components/drag-drop-calendar";
import ActivityModal from "../components/ActivityModal";
import AnimatorModal from "../components/AnimatorModal";
import ActivityDetailsModal from "../components/ActivityDetailsModal";
import AnimatorsListModal from "../components/AnimatorsListModal";
import ExportButton from "../components/ExportButton";
import SyncModal from "../components/SyncModal";
import SearchBar from "../components/search-bar";
import AnimatorFilter from "../components/animator-filter";
import HelpButton from "../components/help-button";
import Footer from "../components/Footer";
import AnimationSheetModal from "../components/animation-sheet-modal";
import StatsDashboardModal from "../components/stats-dashboard-modal";
import ActivityDuplicationModal from "../components/activity-duplication-modal";

import {
  FaPlus,
  FaEye,
  FaSyncAlt,
  FaTrashAlt,
  FaChartBar,
} from "react-icons/fa"; // Import des icônes
import "../styles/page.css";

export default function Home() {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
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
  const [selectedAnimatorFilter, setSelectedAnimatorFilter] = useState(null);

  // Nouveaux états pour les nouvelles modales
  const [showAnimationSheetModal, setShowAnimationSheetModal] = useState(false);
  const [showStatsDashboardModal, setShowStatsDashboardModal] = useState(false);
  const [showDuplicationModal, setShowDuplicationModal] = useState(false);

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
        setFilteredActivities(cleanedActivities);

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
      setFilteredActivities([]);
      setAnimators([]);
    }
  }, []);

  // Effet pour filtrer les activités lorsque le filtre d'animateur change
  useEffect(() => {
    if (selectedAnimatorFilter) {
      const filtered = activities.filter(
        (activity) =>
          activity.animators &&
          Array.isArray(activity.animators) &&
          activity.animators.includes(selectedAnimatorFilter)
      );
      setFilteredActivities(filtered);
    } else {
      setFilteredActivities(activities);
    }
  }, [selectedAnimatorFilter, activities]);

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
    const updatedActivities = [...activities, activityWithId];
    setActivities(updatedActivities);
    setShowActivityModal(false);
  };

  const handleEditActivity = (updatedActivity) => {
    const updatedActivities = activities.map((activity) =>
      activity.id === updatedActivity.id ? updatedActivity : activity
    );
    setActivities(updatedActivities);
    setShowDetailsModal(false);
  };

  const handleDeleteActivity = (id) => {
    const updatedActivities = activities.filter(
      (activity) => activity.id !== id
    );
    setActivities(updatedActivities);
    setShowDetailsModal(false);
  };

  // Fonction pour mettre à jour une activité (utilisée pour le drag-and-drop)
  const handleUpdateActivity = (updatedActivity) => {
    const updatedActivities = activities.map((activity) =>
      activity.id === updatedActivity.id ? updatedActivity : activity
    );
    setActivities(updatedActivities);
  };

  // Fonction pour supprimer toutes les activités
  const handleClearAllActivities = () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer toutes les activités ?"
      )
    ) {
      setActivities([]);
      setFilteredActivities([]);
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

  // Fonction pour gérer la sélection d'une activité depuis la barre de recherche
  const handleSearchActivitySelect = (activity) => {
    setSelectedActivity(activity);
    setShowDetailsModal(true);
  };

  // Fonction pour gérer le changement de filtre d'animateur
  const handleAnimatorFilterChange = (animatorId) => {
    setSelectedAnimatorFilter(animatorId);
  };

  // Fonction pour gérer l'importation des données
  const handleDataImport = (importedActivities, importedAnimators) => {
    // Vérifier et nettoyer les données importées
    const cleanedActivities = cleanInvalidData(importedActivities);
    const cleanedAnimators = cleanInvalidData(importedAnimators);

    // Mettre à jour l'état avec les données importées
    setActivities(cleanedActivities);
    setFilteredActivities(cleanedActivities);
    setAnimators(cleanedAnimators);

    // Sauvegarder dans localStorage
    localStorage.setItem("activities", JSON.stringify(cleanedActivities));
    localStorage.setItem("animators", JSON.stringify(cleanedAnimators));
  };

  // Nouvelle fonction pour gérer la duplication d'une activité
  const handleDuplicateActivity = (duplicatedActivity) => {
    const id =
      activities.length > 0 ? Math.max(...activities.map((a) => a.id)) + 1 : 1;
    const activityWithId = { ...duplicatedActivity, id };
    const updatedActivities = [...activities, activityWithId];
    setActivities(updatedActivities);
  };

  // Fonction pour ouvrir la modale de fiche d'animation
  const handleOpenAnimationSheet = () => {
    if (selectedActivity) {
      setShowAnimationSheetModal(true);
    }
  };

  // Fonction pour ouvrir la modale de duplication
  const handleOpenDuplicationModal = () => {
    if (selectedActivity) {
      setShowDuplicationModal(true);
    }
  };

  return (
    <main className="container">
      <header>
        <h1>Calendrier des Animations</h1>
        <div className="search-and-actions">
          <div className="search-filter-container">
            <SearchBar
              activities={activities}
              onActivitySelect={handleSearchActivitySelect}
              weekDates={currentWeekDates}
            />
            <AnimatorFilter
              animators={animators}
              onFilterChange={handleAnimatorFilterChange}
            />
          </div>
          <div className="actions">
            <button
              onClick={() => setShowActivityModal(true)}
              className="add-button"
            >
              <FaPlus /> Ajouter une activité
            </button>
            <button
              onClick={() => setShowAnimatorModal(true)}
              className="add-button"
            >
              <FaPlus /> Ajouter un animateur
            </button>
            <button
              onClick={() => setShowAnimatorsListModal(true)}
              className="view-button"
            >
              <FaEye /> Voir les animateurs
            </button>
            <button
              onClick={() => setShowStatsDashboardModal(true)}
              className="stats-button"
            >
              <FaChartBar /> Statistiques
            </button>
            <ExportButton
              activities={filteredActivities}
              animators={animators}
              currentWeekDates={currentWeekDates}
            />
            <button
              onClick={() => setShowSyncModal(true)}
              className="sync-button"
            >
              <FaSyncAlt /> Synchroniser
            </button>
            {activities.length > 0 && (
              <button
                onClick={handleClearAllActivities}
                className="clear-button"
              >
                <FaTrashAlt /> Supprimer toutes les activités
              </button>
            )}
          </div>
        </div>
      </header>

      {selectedAnimatorFilter && (
        <div className="filter-indicator">
          <div className="filter-badge">
            Filtré par animateur:{" "}
            {animators.find((a) => a.id === selectedAnimatorFilter)?.name}
            <button
              className="clear-filter"
              onClick={() => setSelectedAnimatorFilter(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <DragDropCalendar
        activities={filteredActivities}
        animators={animators}
        onActivityClick={handleActivityClick}
        onAddActivity={handleAddActivity}
        onUpdateActivity={handleUpdateActivity}
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
          onCreateSheet={() => {
            setShowDetailsModal(false);
            setShowAnimationSheetModal(true);
          }}
          onDuplicate={() => {
            setShowDetailsModal(false);
            setShowDuplicationModal(true);
          }}
        />
      )}

      {showSyncModal && (
        <SyncModal
          activities={activities}
          animators={animators}
          onClose={() => setShowSyncModal(false)}
          onDataImport={handleDataImport}
          currentWeekDates={currentWeekDates}
        />
      )}

      {/* Nouvelles modales */}
      {showAnimationSheetModal && selectedActivity && (
        <AnimationSheetModal
          activity={selectedActivity}
          animators={animators}
          onClose={() => setShowAnimationSheetModal(false)}
        />
      )}

      {showStatsDashboardModal && (
        <StatsDashboardModal
          activities={activities}
          animators={animators}
          onClose={() => setShowStatsDashboardModal(false)}
        />
      )}

      {showDuplicationModal && selectedActivity && (
        <ActivityDuplicationModal
          activity={selectedActivity}
          onClose={() => setShowDuplicationModal(false)}
          onDuplicate={handleDuplicateActivity}
          currentWeekDates={currentWeekDates}
        />
      )}

      {/* Ajout du bouton d'aide */}
      <HelpButton />

      <footer>
        <Footer />
      </footer>
    </main>
  );
}
