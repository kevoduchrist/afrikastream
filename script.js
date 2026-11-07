
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import firebaseConfig from "./firebase-config.js";

// ======================================
// 1. INITIALISATION DE FIREBASE
// ======================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ======================================
// 2. OUTILS
// ======================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function showMessage(message) {
  alert(message);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("active");
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("active");
}

// Fermer les fenêtres avec les boutons de fermeture
$$(".close-modal, [data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const modal = button.closest(".modal");
    if (modal) modal.classList.remove("active");
  });
});

// Fermer en cliquant à l'extérieur
$$(".modal").forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("active");
    }
  });
});

// ======================================
// 3. OUVERTURE DES FENÊTRES
// ======================================

$$("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    const modalId = button.dataset.open;

    if (modalId === "loginModal" && auth.currentUser) {
      const confirmLogout = confirm(
        "Tu es connecté. Veux-tu te déconnecter ?"
      );

      if (confirmLogout) {
        signOut(auth)
          .then(() => showMessage("Déconnexion réussie."))
          .catch((error) => showMessage(error.message));
      }

      return;
    }

    openModal(modalId);
  });
});

// ======================================
// 4. AFFICHAGE DE L'UTILISATEUR CONNECTÉ
// ======================================

onAuthStateChanged(auth, (user) => {
  const loginButtons = $$('[data-open="loginModal"]');

  loginButtons.forEach((button) => {
    button.textContent = user ? "Mon compte / Déconnexion" : "Connexion";
  });
});

// ======================================
// 5. INSCRIPTION ET CONNEXION
// ======================================

const loginForm = $("#loginForm");

if (loginForm) {
  const registerButton = document.createElement("button");

  registerButton.type = "button";
  registerButton.className = "primary-btn full";
  registerButton.textContent = "Créer un compte";

  loginForm.appendChild(registerButton);

  registerButton.addEventListener("click", async () => {
    const email = loginForm.querySelector('input[type="email"]')?.value.trim();
    const password = loginForm.querySelector('input[type="password"]')?.value;

    if (!email || !password) {
      showMessage("Entre ton adresse e-mail et ton mot de passe.");
      return;
    }

    if (password.length < 6) {
      showMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    registerButton.disabled = true;
    registerButton.textContent = "Création en cours...";

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", credential.user.uid), {
        email: credential.user.email,
        role: "listener",
        createdAt: serverTimestamp()
      });

      closeModal("loginModal");
      loginForm.reset();

      showMessage("Bienvenue sur AfrikaStream ! Ton compte est créé.");
    } catch (error) {
      console.error("Erreur inscription :", error);

      if (error.code === "auth/email-already-in-use") {
        showMessage("Cette adresse possède déjà un compte. Connecte-toi.");
      } else if (error.code === "auth/weak-password") {
        showMessage("Ton mot de passe est trop faible.");
      } else if (error.code === "auth/invalid-email") {
        showMessage("L'adresse e-mail est invalide.");
      } else {
        showMessage("Erreur lors de la création : " + error.message);
      }
    } finally {
      registerButton.disabled = false;
      registerButton.textContent = "Créer un compte";
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = loginForm.querySelector('input[type="email"]')?.value.trim();
    const password = loginForm.querySelector('input[type="password"]')?.value;

    if (!email || !password) {
      showMessage("Remplis tous les champs.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);

      closeModal("loginModal");
      loginForm.reset();

      showMessage("Connexion réussie. Bienvenue sur AfrikaStream !");
    } catch (error) {
      console.error("Erreur connexion :", error);

      if (error.code === "auth/invalid-credential") {
        showMessage("E-mail ou mot de passe incorrect.");
      } else {
        showMessage("Erreur de connexion : " + error.message);
      }
    }
  });
}

// ======================================
// 6. PRÉINSCRIPTION DES ARTISTES
// ======================================

const artistForm = $("#artistForm");

if (artistForm) {
  artistForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      showMessage("Connecte-toi avant d'envoyer ta candidature.");
      openModal("loginModal");
      return;
    }

    const inputs = artistForm.querySelectorAll("input");
    const artistName = inputs[0]?.value.trim();
    const email = inputs[1]?.value.trim();
    const phone = inputs[2]?.value.trim();
    const genre = artistForm.querySelector("select")?.value;

    if (!artistName || !email || !phone || !genre) {
      showMessage("Remplis tous les champs du formulaire.");
      return;
    }

    if (email.toLowerCase() !== user.email?.toLowerCase()) {
      showMessage(
        "Utilise la même adresse e-mail que celle de ton compte connecté."
      );
      return;
    }

    const submitButton = artistForm.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Envoi en cours...";
    }

    try {
      await addDoc(collection(db, "artistApplications"), {
        userId: user.uid,
        artistName,
        email: user.email,
        phone,
        genre,
        status: "pending",
        createdAt: serverTimestamp()
      });

      artistForm.reset();
      closeModal("artistModal");

      showMessage(
        "Ta candidature a bien été envoyée. Notre équipe l'examinera."
      );
    } catch (error) {
      console.error("Erreur candidature artiste :", error);
      showMessage("Impossible d'envoyer ta candidature : " + error.message);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Envoyer ma préinscription";
      }
    }
  });
}

// ======================================
// 7. RECHERCHE DE MUSIQUES
// ======================================

const searchInput = $(
  'input[type="search"], input[placeholder*="Rechercher"], input[placeholder*="rechercher"]'
);

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const search = searchInput.value.toLowerCase().trim();

    $$(".track-card, .music-card, .song-card").forEach((card) => {
      const content = card.textContent.toLowerCase();
      card.style.display = content.includes(search) ? "" : "none";
    });
  });
}

// ======================================
// 8. FILTRES PAR GENRE
// ======================================

$$("[data-genre], .genre-filter").forEach((button) => {
  button.addEventListener("click", () => {
    const genre = (
      button.dataset.genre || button.textContent
    ).toLowerCase().trim();

    $$(".track-card, .music-card, .song-card").forEach((card) => {
      const cardGenre = (
        card.dataset.genre || card.textContent
      ).toLowerCase();

      card.style.display =
        genre === "tout" || genre === "tous" || cardGenre.includes(genre)
          ? ""
          : "none";
    });

    $$(".genre-filter, [data-genre]").forEach((item) => {
      item.classList.remove("active");
    });

    button.classList.add("active");
  });
});

// ======================================
// 9. LECTEUR AUDIO
// ======================================

const audio = new Audio();
audio.preload = "none";

let currentTrackButton = null;

$$("[data-audio], .play-btn, .track-play").forEach((button) => {
  button.addEventListener("click", async () => {
    const card = button.closest(
      ".track-card, .music-card, .song-card"
    );

    const audioUrl =
      button.dataset.audio ||
      card?.dataset.audio ||
      card?.querySelector("audio")?.src;

    if (!audioUrl) {
      showMessage(
        "Cette musique est une démonstration. Aucun fichier audio n'est encore associé."
      );
      return;
    }

    if (audio.src === new URL(audioUrl, window.location.href).href) {
      if (audio.paused) {
        await audio.play();
        button.classList.add("playing");
      } else {
        audio.pause();
        button.classList.remove("playing");
      }

      return;
    }

    if (currentTrackButton) {
      currentTrackButton.classList.remove("playing");
    }

    audio.src = audioUrl;
    currentTrackButton = button;

    try {
      await audio.play();
      button.classList.add("playing");
    } catch (error) {
      console.error("Erreur lecture audio :", error);
      showMessage("Impossible de lire ce fichier audio.");
    }
  });
});

audio.addEventListener("ended", () => {
  if (currentTrackButton) {
    currentTrackButton.classList.remove("playing");
  }
});

// ======================================
// 10. FAVORIS
// ======================================

$$(".favorite-btn, [data-favorite]").forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.toggle("active");

    const icon = button.querySelector("i");

    if (icon) {
      icon.classList.toggle("fas");
      icon.classList.toggle("far");
    }
  });
});

// ======================================
// 11. MENU MOBILE
// ======================================

const menuButton = $(".menu-toggle");
const sidebar = $(".sidebar");

if (menuButton && sidebar) {
  menuButton.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });
}

// Fermer le menu après sélection d'un lien
$$(".sidebar a").forEach((link) => {
  link.addEventListener("click", () => {
    sidebar?.classList.remove("open");
  });
});

// ======================================
// 12. ANNEE AUTOMATIQUE
// ======================================

const yearElement = $("#currentYear");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

console.log("AfrikaStream : application initialisée.");
