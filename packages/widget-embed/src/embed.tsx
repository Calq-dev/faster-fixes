import { FeedbackProvider } from "@fasterfixes/react";
import { createRoot } from "react-dom/client";

// Usage:
// <script src="https://<instance>/widget.js" data-project-id="proj_..." defer></script>
// Optional attributes: data-lang="nl", data-color="#02527E", data-position="bottom-left",
// data-capture-diagnostics="true". Diagnostics are off by default: they copy the host
// page's console output into the feedback, which on a client site can hold personal data.
// The API origin defaults to the origin this script is served from.

const DUTCH_LABELS = {
  submitButton: "Versturen",
  cancelButton: "Annuleren",
  textareaPlaceholder: "Beschrijf wat je ziet of wilt veranderen...",
  successMessage: "Feedback verstuurd",
  closeButton: "Sluiten",
  retryButton: "Opnieuw proberen",
  errorMessage: "Er ging iets mis",
  deleteConfirm: "Deze feedback verwijderen?",
  deleteButton: "Verwijderen",
  editButton: "Bewerken",
  saveButton: "Opslaan",
  showResolved: "Toon opgeloste punten",
  hideResolved: "Verberg opgeloste punten",
  feedbackListTitle: "Feedback",
  emptyList: "Nog geen feedback op deze pagina",
};

type Position = NonNullable<React.ComponentProps<typeof FeedbackProvider>["position"]>;

const script = document.currentScript as HTMLScriptElement | null;

function mount() {
  if (!script) return;

  const projectId = script.dataset.projectId;
  if (!projectId) {
    console.warn("[fasterfixes] widget.js needs a data-project-id attribute");
    return;
  }

  const container = document.createElement("div");
  container.id = "fasterfixes-widget";
  document.body.appendChild(container);

  createRoot(container).render(
    <FeedbackProvider
      projectId={projectId}
      apiOrigin={script.dataset.apiOrigin ?? new URL(script.src).origin}
      color={script.dataset.color}
      position={script.dataset.position as Position | undefined}
      labels={script.dataset.lang === "nl" ? DUTCH_LABELS : undefined}
      captureDiagnostics={script.dataset.captureDiagnostics === "true"}
    >
      {null}
    </FeedbackProvider>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
