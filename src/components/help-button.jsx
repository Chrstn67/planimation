"use client";

import { useState } from "react";
import HelpModal from "./help-modal";
import "../styles/help-button.css";
import { HelpCircle } from "lucide-react";

export default function HelpButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        className="help-button"
        onClick={() => setShowModal(true)}
        title="Aide"
        aria-label="Aide"
      >
        <HelpCircle size={24} />
      </button>
      {showModal && <HelpModal onClose={() => setShowModal(false)} />}
    </>
  );
}
