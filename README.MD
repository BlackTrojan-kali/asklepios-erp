# 🏥 Asklepios ERP (E-Patrimoine ASECNA)

**Asklepios ERP** est une suite logicielle intégrée (ERP) multi-locataire (SaaS) conçue pour la gestion complète d'établissements hospitaliers, de services cliniques et de la logistique pharmaceutique de pointe.

Ce dépôt héberge l'ensemble du projet, divisé en deux parties indépendantes : le backend API (Laravel) et le frontend applicatif (React / TypeScript).

---

## 📂 Structure du Répertoire Global

Le projet est divisé comme suit :

1. **[`asklepios-backend`](file:///c:/Users/joelt/Workspace/asklepios-erp/asklepios-backend)** :
   * API REST propulsée par **Laravel 12**.
   * Gestion multi-tenant, abonnements, rôles, logistique, inventaires, transferts de stock et génération automatique de rapports PDF/Excel.
   * Contient la documentation interactive Swagger accessible en local.
   * 👉 Consultez le [README du Backend](file:///c:/Users/joelt/Workspace/asklepios-erp/asklepios-backend/README.md) pour les détails d'installation et de configuration de l'API.

2. **[`asklepios-frontend`](file:///c:/Users/joelt/Workspace/asklepios-erp/asklepios-frontend)** :
   * Interface Single Page Application (SPA) construite avec **React 19**, **TypeScript** et **Vite 8**.
   * Design moderne, responsive et adaptatif stylisé avec **Tailwind CSS v4**.
   * Expérience utilisateur soignée avec alertes interactives (`SweetAlert2` & `React Hot Toast`).
   * 👉 Consultez le [README du Frontend](file:///c:/Users/joelt/Workspace/asklepios-erp/asklepios-frontend/README.md) pour démarrer l'interface utilisateur.

3. **[`analyse`](file:///c:/Users/joelt/Workspace/asklepios-erp/analyse)** :
   * Contient les spécifications, le cahier des charges de réalisation, la planification (Master Plan) ainsi que les diagrammes UML (cas d'utilisation, diagrammes de classes, architecture de déploiement).

---

## 🛠️ Architecture Globale & Rôles

Asklepios ERP implémente un contrôle d'accès basé sur les rôles (RBAC) et un mécanisme de licences pour moduler les fonctionnalités disponibles :

* **Super Admin (`super_admin`) :** Gestion SaaS globale (hôpitaux clients, licences, abonnements et facturation).
* **Administrateur d'Hôpital (`admin`) :** Configuration interne de l'établissement (centres, départements, succursales, personnel, flotte logistique de transport et catalogue général d'articles).
* **Personnel de Pharmacie (`pharmacy`) :** Gestion physique des stocks locaux, étagères, bons de commande fournisseur, transferts inter-sites et audits d'inventaire.

---

## 🚀 Démarrage Rapide en Local

Pour lancer l'application en local :

1. **Démarrer l'API Backend :**
   * Allez dans le dossier `asklepios-backend`.
   * Initialisez l'environnement : `composer run setup`.
   * Lancez le serveur : `composer run dev` (l'API tourne sur `http://localhost:8000`).
   * Identifiants de test Super Admin : `admin@asklepios.com` / `secrets`.

2. **Démarrer l'Interface Frontend :**
   * Allez dans le dossier `asklepios-frontend`.
   * Installez les modules : `npm install`.
   * Configurez l'API dans un fichier `.env` : `VITE_API_URL=http://localhost:8000/api`.
   * Lancez le serveur de développement : `npm run dev` (l'application tourne sur `http://localhost:5173`).