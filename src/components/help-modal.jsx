"use client";

import React from "react";
import "../styles/help-modal.css";
import {
  X,
  Calendar,
  Search,
  Users,
  DropletsIcon as DragDropIcon,
  Filter,
  Clock,
  Plus,
  Trash,
  Download,
  Moon,
  FileText,
  Copy,
  BarChart2,
} from "lucide-react";

export default function HelpModal({ onClose }) {
  // Référence pour détecter les clics en dehors de la modale
  const modalRef = React.useRef(null);

  // Fermer la modale si on clique en dehors
  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Fermer la modale avec la touche Escape
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  React.useEffect(() => {
    // Ajouter les écouteurs d'événements
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    // Désactiver le défilement du body
    document.body.style.overflow = "hidden";

    // Nettoyer les écouteurs d'événements
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="help-modal-overlay">
      <div className="help-modal" ref={modalRef}>
        <div className="help-modal-header">
          <h2>Guide d'utilisation de Planimation</h2>
          <button className="help-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="help-modal-content">
          <div className="help-tabs">
            <div className="help-section">
              <div className="help-section-header">
                <Calendar className="help-icon" />
                <h3>Calendrier</h3>
              </div>
              <div className="help-section-content">
                <p>
                  Le calendrier affiche toutes les activités planifiées par jour
                  et par heure.
                </p>
                <ul>
                  <li>
                    <strong>Navigation entre semaines</strong> : Utilisez les
                    boutons "Semaine précédente" et "Semaine suivante" pour
                    naviguer dans le temps.
                  </li>
                  <li>
                    <strong>Vue semaine/jour</strong> : Basculez entre la vue
                    semaine complète et la vue d'un jour spécifique.
                  </li>
                  <li>
                    <strong>Créer une activité</strong> : Cliquez sur un créneau
                    horaire vide pour créer une nouvelle activité à cet horaire.
                  </li>
                </ul>
              </div>
            </div>

            <div className="help-section">
              <div className="help-section-header">
                <DragDropIcon className="help-icon" />
                <h3>Glisser-déposer</h3>
              </div>
              <div className="help-section-content">
                <p>
                  Vous pouvez facilement réorganiser les activités par
                  glisser-déposer :
                </p>
                <ul>
                  <li>
                    Cliquez et maintenez sur une activité pour la déplacer
                  </li>
                  <li>
                    Faites glisser l'activité vers un nouveau créneau horaire
                  </li>
                  <li>Relâchez pour confirmer le déplacement</li>
                  <li>
                    La durée de l'activité est préservée lors du déplacement
                  </li>
                </ul>
              </div>
            </div>

            <div className="help-section">
              <div className="help-section-header">
                <Search className="help-icon" />
                <h3>Recherche</h3>
              </div>
              <div className="help-section-content">
                <p>
                  La barre de recherche vous permet de trouver rapidement des
                  activités :
                </p>
                <ul>
                  <li>Recherchez par titre ou description</li>
                  <li>
                    Les résultats affichent le jour, la date et l'heure de
                    l'activité
                  </li>
                  <li>
                    Cliquez sur un résultat pour voir les détails de l'activité
                  </li>
                </ul>
              </div>
            </div>

            <div className="help-section">
              <div className="help-section-header">
                <Filter className="help-icon" />
                <h3>Filtrage</h3>
              </div>
              <div className="help-section-content">
                <p>Filtrez les activités par animateur :</p>
                <ul>
                  <li>
                    Utilisez le menu déroulant "Filtrer par animateur" pour
                    sélectionner un animateur spécifique
                  </li>
                  <li>
                    Seules les activités de l'animateur sélectionné seront
                    affichées
                  </li>
                  <li>
                    Un badge de filtre apparaît pour indiquer le filtre actif
                  </li>
                  <li>
                    Cliquez sur "×" dans le badge pour supprimer le filtre
                  </li>
                </ul>
              </div>
            </div>

            <div className="help-section">
              <div className="help-section-header">
                <Users className="help-icon" />
                <h3>Gestion des animateurs</h3>
              </div>
              <div className="help-section-content">
                <p>Gérez les animateurs de votre équipe :</p>
                <ul>
                  <li>
                    <strong>Ajouter</strong> : Cliquez sur "Ajouter un
                    animateur" pour créer un nouvel animateur
                  </li>
                  <li>
                    <strong>Voir</strong> : Cliquez sur "Voir les animateurs"
                    pour afficher la liste complète
                  </li>
                  <li>
                    <strong>Modifier/Supprimer</strong> : Dans la liste des
                    animateurs, vous pouvez modifier ou supprimer chaque
                    animateur
                  </li>
                  <li>
                    <strong>Assigner</strong> : Lors de la création ou
                    modification d'une activité, vous pouvez assigner un ou
                    plusieurs animateurs
                  </li>
                </ul>
              </div>
            </div>

            <div className="help-section">
              <div className="help-section-header">
                <Plus className="help-icon" />
                <h3>Activités</h3>
              </div>
              <div className="help-section-content">
                <p>Gérez vos activités :</p>
                <ul>
                  <li>
                    <strong>Créer</strong> : Cliquez sur "Ajouter une activité"
                    ou sur un créneau horaire vide
                  </li>
                  <li>
                    <strong>Voir</strong> : Cliquez sur une activité dans le
                    calendrier pour voir ses détails
                  </li>
                  <li>
                    <strong>Modifier</strong> : Dans la vue détaillée, vous
                    pouvez modifier tous les aspects de l'activité
                  </li>
                  <li>
                    <strong>Supprimer</strong> : Supprimez une activité depuis
                    sa vue détaillée
                  </li>
                  <li>
                    <strong>Description</strong> : Cliquez sur "Voir
                    description" dans une activité pour afficher sa description
                    complète
                  </li>
                </ul>
              </div>
            </div>

            <div className="help-section">
              <div className="help-section-header">
                <FileText className="help-icon" />
                <h3>Fiches d'animation</h3>
              </div>
              <div className="help-section-content">
                <p>Créez et exportez des fiches d'animation détaillées :</p>
                <ul>
                  <li>
                    <strong>Créer</strong> : Dans les détails d'une activité,
                    cliquez sur "Créer une fiche d'animation"
                  </li>
                  <li>
                    <strong>Éditer</strong> : Complétez les différentes sections
                    (matériel, objectifs, description, etc.)
                  </li>
                  <li>
                    <strong>Exporter</strong> : Cliquez sur "Exporter en PDF"
                    pour générer une fiche professionnelle à imprimer ou
                    partager
                  </li>
                </ul>
              </div>
            </div>

            <div className="help-section">
              <div className="help-section-header">
                <Copy className="help-icon" />
                <h3>Duplication d'activités</h3>
              </div>
              <div className="help-section-content">
                <p>Dupliquez facilement vos activités :</p>
                <ul>
                  <li>
                    <strong>Dupliquer</strong> : Dans les détails d'une
                    activité, cliquez sur "Dupliquer cette activité"
                  </li>
                  <li>
                    <strong>Personnaliser</strong> : Modifiez le titre, la date,
                    l'heure ou conservez les paramètres originaux
                  </li>
                  <li>
                    <strong>Confirmer</strong> : Validez pour créer une copie de
                    l'activité avec les nouveaux paramètres
                  </li>
                </ul>
              </div>
            </div>

            <div className="help-section">
              <div className="help-section-header">
                <BarChart2 className="help-icon" />
                <h3>Statistiques</h3>
              </div>
              <div className="help-section-content">
                <p>Analysez vos activités et animateurs :</p>
                <ul>
                  <li>
                    <strong>Accès</strong> : Cliquez sur le bouton
                    "Statistiques" dans la barre d'actions
                  </li>
                  <li>
                    <strong>Animateurs</strong> : Consultez le nombre
                    d'activités et les heures travaillées par animateur
                  </li>
                  <li>
                    <strong>Activités</strong> : Visualisez la répartition par
                    jour et par créneau horaire
                  </li>
                  <li>
                    <strong>Collaborations</strong> : Examinez les
                    collaborations entre animateurs
                  </li>
                </ul>
              </div>
            </div>

            <div className="help-section">
              <div className="help-section-header">
                <Download className="help-icon" />
                <h3>Exportation et synchronisation</h3>
              </div>
              <div className="help-section-content">
                <p>Sauvegardez et partagez vos données :</p>
                <ul>
                  <li>
                    <strong>Exporter</strong> : Utilisez le bouton d'exportation
                    pour télécharger vos données au format JSON
                  </li>
                  <li>
                    <strong>Synchroniser</strong> : Utilisez la fonction de
                    synchronisation pour importer des données ou les partager
                  </li>
                  <li>
                    <strong>Sauvegarde automatique</strong> : Toutes les
                    modifications sont automatiquement sauvegardées dans votre
                    navigateur
                  </li>
                </ul>
              </div>
            </div>

            <div className="help-section">
              <div className="help-section-header">
                <Trash className="help-icon" />
                <h3>Suppression des données</h3>
              </div>
              <div className="help-section-content">
                <p>Gérez la suppression des données :</p>
                <ul>
                  <li>
                    Utilisez le bouton "Supprimer toutes les activités" pour
                    effacer toutes les activités
                  </li>
                  <li>
                    Cette action nécessite une confirmation et est irréversible
                  </li>
                  <li>Les animateurs ne sont pas supprimés par cette action</li>
                </ul>
              </div>
            </div>

            <div className="help-section">
              <div className="help-section-header">
                <Clock className="help-icon" />
                <h3>Fonctionnalités à venir</h3>
              </div>
              <div className="help-section-content">
                <p>Prochainement disponibles :</p>
                <ul>
                  <li>
                    <Moon /> Mode sombre
                  </li>
                  <li>Modèles d'activités</li>
                  <li>Vue par animateur</li>
                  <li>Glisser-déposer entre semaines</li>
                  <li>Filtres avancés</li>
                  <li>Tutoriel interactif</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="help-footer">
            <p>Planimation - Votre outil de planification d'activités</p>
            <p>
              Pour toute question supplémentaire, contactez l'administrateur du
              système.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
