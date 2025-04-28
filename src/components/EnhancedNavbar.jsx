import { useState, useEffect } from "react";
import {
  FaPlus,
  FaEye,
  FaSyncAlt,
  FaTrashAlt,
  FaChartBar,
  FaChevronDown,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import "../styles/navbar.css";

export default function EnhancedNavbar({
  activities,
  filteredActivities,
  animators,
  currentWeekDates,
  setShowActivityModal,
  setShowAnimatorModal,
  setShowAnimatorsListModal,
  setShowStatsDashboardModal,
  setShowSyncModal,
  handleClearAllActivities,
  ExportButton,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  // Détection de la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Ferme le menu mobile si on passe au desktop
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
      // Ferme les dropdowns si on change la taille
      setDropdownOpen(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fonction pour gérer les clics du menu mobile
  const handleMobileAction = (action) => {
    setMobileMenuOpen(false);
    if (action && typeof action === "function") {
      action();
    }
  };

  // Groupe les boutons pour une meilleure organisation
  const actionGroups = [
    {
      id: "add",
      label: "Ajouter",
      icon: <FaPlus />,
      color: "#4caf50",
      actions: [
        {
          label: "Activité",
          onClick: () => setShowActivityModal(true),
        },
        {
          label: "Animateur",
          onClick: () => setShowAnimatorModal(true),
        },
      ],
    },
    {
      id: "view",
      label: "Visualiser",
      icon: <FaEye />,
      color: "#ff9800",
      actions: [
        {
          label: "Animateurs",
          onClick: () => setShowAnimatorsListModal(true),
        },
        {
          label: "Statistiques",
          onClick: () => setShowStatsDashboardModal(true),
          icon: <FaChartBar />,
        },
      ],
    },
    {
      id: "data",
      label: "Données",
      icon: <FaSyncAlt />,
      color: "#4a90e2",
      actions: [
        {
          label: "Synchroniser",
          onClick: () => setShowSyncModal(true),
        },
        {
          label: "Exporter",
          component: () => (
            <ExportButton
              activities={filteredActivities}
              animators={animators}
              currentWeekDates={currentWeekDates}
            />
          ),
        },
        activities.length > 0 && {
          label: "Supprimer tout",
          onClick: handleClearAllActivities,
          icon: <FaTrashAlt />,
          color: "#ff4d4d",
        },
      ].filter(Boolean),
    },
  ];

  // Affichage mobile
  if (windowWidth <= 768) {
    return (
      <div className="mobile-navbar">
        <button
          className={`mobile-menu-toggle ${mobileMenuOpen ? "active" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          <span>Actions</span>
        </button>

        {mobileMenuOpen && (
          <div className="mobile-menu">
            {actionGroups.map((group) => (
              <div key={group.id} className="mobile-group">
                <div
                  className="mobile-group-header"
                  style={{ backgroundColor: group.color }}
                >
                  {group.icon} {group.label}
                </div>
                <div className="mobile-group-actions">
                  {group.actions.map((action, index) => {
                    if (action.component) {
                      const ActionComponent = action.component;
                      return (
                        <div
                          key={`component-${index}`}
                          className="mobile-action-wrapper"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <ActionComponent />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={`action-${index}`}
                        className="mobile-action"
                        onClick={() => handleMobileAction(action.onClick)}
                      >
                        {action.icon || group.icon} {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Affichage desktop
  return (
    <div className="enhanced-navbar">
      {actionGroups.map((group) => (
        <div key={group.id} className="navbar-group">
          <button
            className="group-button"
            style={{ backgroundColor: group.color }}
            onClick={() =>
              setDropdownOpen(group.id === dropdownOpen ? false : group.id)
            }
          >
            {group.icon}
            <span>{group.label}</span>
            <FaChevronDown
              className={`dropdown-arrow ${
                dropdownOpen === group.id ? "open" : ""
              }`}
            />
          </button>

          {dropdownOpen === group.id && (
            <div className="group-dropdown">
              {group.actions.map((action, index) => {
                if (action.component) {
                  const ActionComponent = action.component;
                  return (
                    <div
                      key={`component-${index}`}
                      className="dropdown-component"
                    >
                      <ActionComponent />
                    </div>
                  );
                }

                return (
                  <button
                    key={`action-${index}`}
                    className="dropdown-action"
                    onClick={() => {
                      setDropdownOpen(false);
                      action.onClick();
                    }}
                    style={action.color ? { color: action.color } : {}}
                  >
                    {action.icon || group.icon} {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
