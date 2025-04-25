"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import "../styles/search-bar.css";

export default function SearchBar({ activities, onActivitySelect, weekDates }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.trim() === "") {
      setSearchResults([]);
      return;
    }

    // Filtrer les activités qui correspondent au terme de recherche
    const results = activities.filter(
      (activity) =>
        activity.title.toLowerCase().includes(term.toLowerCase()) ||
        activity.description?.toLowerCase().includes(term.toLowerCase())
    );

    setSearchResults(results);
  };

  const handleSelectActivity = (activity) => {
    onActivitySelect(activity);
    setSearchTerm("");
    setSearchResults([]);
  };

  // Fonction pour obtenir la date formatée d'une activité
  const getActivityDate = (activity) => {
    if (!activity || !weekDates || !weekDates.dates) return "";

    const days = [
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
      "Dimanche",
    ];
    const dayIndex = days.indexOf(activity.day);

    if (dayIndex === -1 || !weekDates.dates[dayIndex]) return "";

    return weekDates.dates[dayIndex].toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="search-container">
      <div className="search-input-container">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Rechercher une activité..."
          value={searchTerm}
          onChange={handleSearch}
          onFocus={() => setIsSearching(true)}
          onBlur={() => setTimeout(() => setIsSearching(false), 200)}
          className="search-input"
        />
      </div>

      {isSearching && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((activity) => (
            <div
              key={activity.id}
              className="search-result-item"
              onClick={() => handleSelectActivity(activity)}
              style={{ borderLeft: `4px solid ${activity.color || "#ccc"}` }}
            >
              <div className="search-result-title">{activity.title}</div>
              <div className="search-result-details">
                {activity.day} {getActivityDate(activity)} •{" "}
                {activity.startTime}-{activity.endTime}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
