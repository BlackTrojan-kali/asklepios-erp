# 💻 Asklepios ERP - Application Frontend (React / TypeScript)

Bienvenue sur le dépôt de l'interface utilisateur d'**Asklepios ERP**, une interface web moderne, réactive et ergonomique dédiée à la gestion d'établissements de santé et à la logistique de pharmacie.

L'application est bâtie sur **React 19**, **TypeScript** et **Vite 8** pour des performances d'affichage optimales et un rechargement à chaud ultra-rapide (HMR).

---

## 🎨 Design & Expérience Utilisateur

* **Framework CSS :** Tailwind CSS v4, offrant un design épuré, responsive et adaptatif.
* **Thématisation :** Support natif du mode Sombre / Clair (via un context provider `ThemeContext`).
* **Micro-animations & Modales :** 
  * `SweetAlert2` pour des confirmations élégantes (suppressions, validations de commandes, etc.).
  * `React Hot Toast` pour les notifications toast non intrusives en haut à droite.
* **Composants d'Entrée Avancés :** `React Select` pour la sélection dynamique d'articles, hôpitaux, chauffeurs, etc., avec recherche intégrée.
* **Bibliothèques d'Icônes :** Lucide React et FontAwesome pour une identité visuelle moderne et cohérente.

---

## 🔒 Sécurité & Routage

L'application intègre un routeur declaratif basé sur **React Router v7** avec gestion d'accès granulaire :

* **`AuthMiddleware` :** Intercepte les accès et redirige les utilisateurs non connectés vers la page de login.
* **`CheckRole` :** Filtre l'accès aux pages selon les rôles attribués (`super_admin`, `admin`, `pharmacy`).
* **Intercepteur Axios (`src/api/api.ts`) :**
  * Ajoute automatiquement le token JWT (`ACCESS_TOKEN` stocké dans le `localStorage`) dans l'en-tête `Authorization: Bearer <token>` de chaque requête sortante.
  * Détecte les réponses HTTP `401 Unauthorized` (token expiré ou révoqué) pour déconnecter automatiquement l'utilisateur et le rediriger vers `/auth/login`.

---

## 📂 Structure du Code Frontend

```bash
asklepios-frontend/
├── src/
│   ├── api/
│   │   └── api.ts             # Configuration d'Axios avec intercepteurs Auth
│   ├── assets/                # Logos et images statiques
│   ├── components/            # Composants UI partagés (Boutons, Tables, Modales...)
│   ├── config/
│   │   └── menu.config.tsx    # Configuration des menus de navigation selon les rôles
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Fournisseur d'état d'authentification utilisateur
│   │   └── ThemeContext.tsx   # Gestionnaire de thème (Clair / Sombre)
│   ├── Layouts/
│   │   └── AppLayout.tsx      # Structure globale (Sidebar, Header, Zone de Contenu)
│   ├── middlewares/
│   │   ├── authMiddleware.tsx # Protection des routes authentifiées
│   │   └── CheckRole.tsx      # Protection des routes par rôle
│   ├── Pages/
│   │   ├── Auth/              # Page de connexion
│   │   ├── SUPA/              # Espace Super Admin (gestion SaaS des hôpitaux)
│   │   ├── Admin/             # Espace Admin Hôpital (ressources globales et logistique)
│   │   └── PHARMACY/          # Espace Opérationnel Pharmacie (commandes, transferts, stocks)
│   ├── types/                 # Déclarations de types TypeScript (transferTypes, etc.)
│   ├── App.tsx                # Composant racine
│   ├── main.tsx               # Point d'entrée de l'application React
│   └── routes.tsx             # Configuration de toutes les routes de l'application
├── package.json               # Dépendances et scripts de build NPM
├── vite.config.ts             # Configuration du bundler Vite avec plugin Tailwind
└── tsconfig.json              # Configuration globale TypeScript
```

---

## 📦 Organisation des Pages par Rôle

### 1. 🛡️ Espace Super Admin (`/SUPA`)
* **Hôpitaux (`/hospitals`) :** Création et modification des structures médicales souscriptrices.
* **Admins (`/admins`) :** Attribution des comptes administrateurs spécifiques aux hôpitaux.
* **Licences (`/licences`) & Abonnements (`/subscriptions`) :** Configuration des offres de modules (Pharmacie, Labo) et facturation associée.
* **Pays (`/countries`) :** Gestion des pays opérationnels de la plateforme.

### 2. 🏛️ Espace Administrateur Hôpital (`/admin`)
* **Départements & Centres (`/admin/departments`, `/admin/centers`) :** Cartographie physique et structurelle de l'établissement.
* **Succursales Pharmaceutiques (`/admin/pharmacies`) :** Liste des pharmacies reliées à l'hôpital.
* **Personnels de Pharmacie (`/admin/pharmaciens`) :** Attribution des accès aux pharmaciens de chaque succursale.
* **Référentiel Logistique (`/admin/vehicules`, `/admin/drivers`) :** Enregistrement de la flotte pour les transferts inter-sites.
* **Supervision Pharmacie (`/admin/pharmacy/...`) :** Catalogue général d'articles, gestion des catégories, des lots, suivi global des inventaires, mouvements, commandes et retours d'achat.

### 3. 💊 Espace Pharmacie / Magasin (`/pharmacy`)
* **Tableau de Bord (`/pharmacy`) :** Indicateurs sur l'état des stocks locaux.
* **Emplacements Physiques (`/pharmacy/storage_location`) :** Assignation des articles à des zones d'étagères/rayonnages.
* **Commandes & Retours d'Achat (`/pharmacy/orders`, `/pharmacy/returns`) :** Approvisionnement local de la succursale auprès des fournisseurs autorisés.
* **Transferts Logistiques (`/pharmacy/stock_transfers`) :** Demandes de transfert, expédition et réception d'articles inter-pharmacies.
* **Inventaires (`/pharmacy/inventory`) :** Saisie des comptages physiques et ajustements de stock.

---

## ⚙️ Installation & Configuration

### Prérequis
* Node.js (version 18+ recommandée)
* NPM (inclus avec Node.js)

### 1. Installer les Dépendances
Accédez au dossier `asklepios-frontend` et exécutez la commande suivante :
```bash
npm install
```

### 2. Variables d'Environnement
Copiez le fichier `.env.example` pour créer votre fichier `.env` :
```bash
cp .env.example .env
```

Éditez le fichier `.env` pour y insérer l'URL de votre API backend :
```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🚀 Lancement & Build

### Serveur de Développement
Pour démarrer le serveur de développement local avec rechargement à chaud (Hot Module Replacement) :
```bash
npm run dev
```
Par défaut, le projet s'exécute sur **`http://localhost:5173`** (ou l'adresse affichée dans votre terminal).

### Compilation pour la Production
Pour compiler et optimiser l'application en vue d'un déploiement en production :
```bash
npm run build
```
Les fichiers générés et prêts à être servis par un serveur web (Nginx, Apache, etc.) seront stockés dans le dossier `/dist`.

### Qualité du Code (Linting)
Pour vérifier la conformité du code avec les règles ESLint configurées :
```bash
npm run lint
```
