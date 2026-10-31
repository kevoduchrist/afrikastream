# AfrikaStream — prototype web

Site vitrine responsive en français pour le projet AfrikaStream.

## Ouvrir le site
1. Décompresser le dossier.
2. Ouvrir `index.html` dans un navigateur (Chrome, Edge, Firefox).
3. Pour un hébergement, publier le dossier sur GitHub Pages, Netlify ou Vercel.

## Ce qui fonctionne dans ce prototype
- Interface responsive ordinateur et téléphone.
- Navigation par sections.
- Filtrage des titres par genre et recherche.
- Lecteur visuel de démonstration.
- Fenêtres de connexion et préinscription artiste (démo uniquement).

## À connecter pour la vraie version
Ce prototype n'envoie et ne stocke aucune donnée. Les formulaires sont des démonstrations.
La prochaine étape consiste à créer le projet Firebase et connecter :
- Firebase Authentication : comptes et vérification e-mail.
- Cloud Firestore : profils, artistes, titres, abonnements et signalements.
- Firebase Storage : fichiers audio et pochettes.
- Cloud Functions : validation des publications, modération et règles métier.

Les titres visibles sont des exemples et ne sont pas des morceaux audio réels.
Le classement « tendance au Bénin » doit être alimenté par les écoutes réelles avant d'être présenté comme un classement réel.

## Structure
- `index.html` : contenu et sections
- `style.css` : identité visuelle noir / vert / jaune
- `script.js` : interactions de démonstration
- `firebase-config.example.js` : exemple de configuration à compléter
