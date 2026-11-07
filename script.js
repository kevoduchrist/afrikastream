// ======================================
// AFRIKASTREAM - FIREBASE
// ======================================

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

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Éléments du site
const toast = document.getElementById("toast");
const loginForm = document.getElementById("loginForm");
const artistForm = document.getElementById("artistForm");

// ======================================
// NOTIFICATIONS
// ======================================

function notify(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Traduction des erreurs Firebase
function firebaseError(error) {
  const errors = {
    "auth/email-already-in-use": "Cette adresse e-mail possède déjà un compte.",
    "auth/invalid-email": "Adresse e-mail invalide.",
    "auth/weak-password": "Le mot de passe doit contenir au moins 6 caractères.",
    "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
    "auth/user-disabled": "Ce compte a été désactivé.",
    "auth/too-many-requests": "Trop de tentatives. Réessaie plus tard.",
    "permission-denied": "Accès refusé. Vérifie les règles Firestore."
  };

  return errors[error.code] || error.message || "Une erreur est survenue.";
}

// ======================================
// FENÊTRES MODALES
// ======================================

document.querySelectorAll("[data-open]").forEach(button => {
  button.addEventListener("click", () => {
    const modal = document.getElementById(button.dataset.open);

    if (modal) {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    }
  });
});

function closeModal(modal) {
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal(modal);
  });

  const closeButton = modal.querySelector(".modal-close");

  if (closeButton) {
    closeButton.addEventListener("click", () => closeModal(modal));
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal").forEach(closeModal);
  }
});

// ======================================
// CRÉATION DE COMPTE
// ======================================

// On ajoute un bouton "Créer un compte"
// dans le formulaire de connexion.
if (loginForm) {
  const createButton = document.createElement("button");

  createButton.type = "button";
  createButton.className = "outline-btn full";
  createButton.textContent = "Créer un compte";
  createButton.style.marginTop = "12px";

  loginForm.appendChild(createButton);

  createButton.addEventListener("click", async () => {
    const email = loginForm.querySelector('input[type="email"]').value.trim();
    const password = loginForm.querySelector('input[type="password"]').value;

    if (!email || !password) {
      notify("Entre ton e-mail et un mot de passe.");
      return;
    }

    if (password.length < 6) {
      notify("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    createButton.disabled = true;
    createButton.textContent = "Création en cours...";

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", result.user.uid), {
        email: result.user.email,
        role: "listener",
        createdAt: serverTimestamp()
      });

      notify("Ton compte AfrikaStream est créé !");
      closeModal(loginForm.closest(".modal"));
      loginForm.reset();

    } catch (error) {
      console.error(error);
      notify(firebaseError(error));

    } finally {
      createButton.disabled = false;
      createButton.textContent = "Créer un compte";
    }
  });
}

// ======================================
// CONNEXION
// ======================================

if (loginForm) {
  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = loginForm.querySelector('input[type="email"]').value.trim();
    const password = loginForm.querySelector('input[type="password"]').value;
    const submitButton = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      notify("Remplis tous les champs.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Connexion...";

    try {
      await signInWithEmailAndPassword(auth, email, password);

      notify("Connexion réussie !");

      closeModal(loginForm.closest(".modal"));
      loginForm.reset();

    } catch (error) {
      console.error(error);
      notify(firebaseError(error));

    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Se connecter";
    }
  });
}

// ======================================
// ÉTAT DU COMPTE ET DÉCONNEXION
// ======================================

onAuthStateChanged(auth, user => {
  const loginButtons = document.querySelectorAll(
    '[data-open="loginModal"]'
  );

  loginButtons.forEach(button => {
    button.textContent = user ? "Mon compte" : "Connexion";

    if (user) {
      button.onclick = async () => {
        const confirmation = confirm(
          "Veux-tu te déconnecter de AfrikaStream ?"
        );

        if (confirmation) {
          try {
            await signOut(auth);
            notify("Tu es déconnecté.");
          } catch (error) {
            notify(firebaseError(error));
          }
        }
      };
    } else {
      button.onclick = () => {
        document.getElementById("loginModal").classList.add("open");
      };
    }
  });
});

// ======================================
// PRÉINSCRIPTION ARTISTE
// ======================================

if (artistForm) {
  artistForm.addEventListener("submit", async event => {
    event.preventDefault();

    const inputs = artistForm.querySelectorAll("input");
    const name = inputs[0].value.trim();
    const email = inputs[1].value.trim();
    const phone = inputs[2].value.trim();
    const genre = artistForm.querySelector("select").value;

    const submitButton = artistForm.querySelector('button[type="submit"]');

    if (!auth.currentUser) {
      notify("Connecte-toi ou crée un compte avant ta préinscription.");
      return;
    }

    if (email.toLowerCase() !== auth.currentUser.email.toLowerCase()) {
      notify("Utilise l'adresse e-mail de ton compte connecté.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Envoi en cours...";

    try {
      await addDoc(collection(db, "artistApplications"), {
        userId: auth.currentUser.uid,
        artistName: name,
        email: email,
        phone: phone,
        genre: genre,
        status: "pending",
        createdAt: serverTimestamp()
      });

      notify("Ta préinscription artiste a été envoyée !");

      closeModal(artistForm.closest(".modal"));
      artistForm.reset();

    } catch (error) {
      console.error(error);
      notify(firebaseError(error));

    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Envoyer ma préinscription";
    }
  });
}

// ======================================
// FILTRES MUSICAUX
// ======================================

document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(item => {
      item.classList.remove("selected");
    });

    chip.classList.add("selected");

    const genre = chip.dataset.genre;

    document.querySelectorAll(".track-card").forEach(card => {
      card.style.display =
        genre === "Tous" || card.dataset.genre === genre ? "" : "none";
    });
  });
});

// ======================================
// RECHERCHE
// ======================================

const search = document.getElementById("searchInput");

if (search) {
  search.addEventListener("input", () => {
    const query = search.value.toLowerCase().trim();

    document.querySelectorAll(".track-card").forEach(card => {
      const content = (
        card.dataset.title + " " +
        card.dataset.artist + " " +
        card.dataset.genre
      ).toLowerCase();

      card.style.display = content.includes(query) ? "" : "none";
    });
  });
}

// ======================================
// LECTEUR DE DÉMONSTRATION
// ======================================

function playCard(card) {
  if (!card) return;

  document.getElementById("nowTitle").textContent = card.dataset.title;
  document.getElementById("nowArtist").textContent = card.dataset.artist;
  document.getElementById("mainPlay").textContent = "Ⅱ";

  notify("Aperçu : les fichiers audio seront ajoutés au catalogue.");
}

document.querySelectorAll(".play-cover").forEach(button => {
  button.addEventListener("click", () => {
    playCard(button.closest(".track-card"));
  });
});

const mainPlay = document.getElementById("mainPlay");

if (mainPlay) {
  mainPlay.addEventListener("click", () => {
    mainPlay.textContent =
      mainPlay.textContent === "▶" ? "Ⅱ" : "▶";

    if (
      !document.getElementById("nowTitle").textContent.includes("Choisis")
    ) {
      notify("La lecture réelle sera activée avec les fichiers audio.");
    }
  });
}

// ======================================
// FAVORIS DE DÉMONSTRATION
// ======================================

document.querySelectorAll(".heart").forEach(button => {
  button.addEventListener("click", () => {
    button.textContent = button.textContent === "♡" ? "♥" : "♡";
    notify("Les favoris seront enregistrés dans ton compte prochainement.");
  });
});

document.querySelectorAll(".track-foot span:last-child").forEach(button => {
  button.addEventListener("click", () => {
    button.textContent = button.textContent === "♡" ? "♥" : "♡";
    notify("Favori sélectionné.");
  });
});

console.log("AfrikaStream : Firebase est initialisé.");
