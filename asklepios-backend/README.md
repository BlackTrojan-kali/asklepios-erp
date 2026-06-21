# 🏥 Asklepios ERP - API Backend (Laravel)

Bienvenue sur le dépôt backend d'**Asklepios ERP**, une solution logicielle SaaS multi-locataire (Multi-tenant) de pointe conçue pour la gestion d'établissements hospitaliers, de services cliniques et de logistique pharmaceutique avancée.

Le backend est propulsé par le framework **Laravel 12** avec une API REST moderne, sécurisée, entièrement documentée et prête pour la production.

---

## 🚀 Fonctionnalités & Modules Clés

Asklepios ERP est architecturé autour de rôles d'utilisateurs distincts et de licences applicatives modulaires :

### 1. 🌐 Administration SaaS (Super Admin - `SUPA`)
* **Gestion Multi-tenant :** Création, activation et suivi des établissements hospitaliers affiliés.
* **Licences & Abonnements :** Gestion des licences disponibles (`base_hospital`, `laboratory`, `pharmacy`) et cycle de vie des abonnements (création, renouvellement, historique de facturation).
* **Facturation :** Génération automatique de factures acquittées au format PDF avec filigrane dynamique.
* **Référentiel Géographique :** Gestion des pays pour l'expansion du SaaS.

### 2. 🏢 Administration Hospitalière (Admin)
* **Configuration Structurelle :** Définition des centres hospitaliers et des départements cliniques (Ex. Pédiatrie, Urgences, Cardiologie).
* **Gestion du Personnel :** Enrôlement des administrateurs d'hôpitaux, des pharmaciens, des médecins et autres profils professionnels.
* **Logistique & Transports :** Enregistrement des véhicules de livraison et des chauffeurs avec outils d'importation/exportation Excel pour un gain de temps opérationnel.
* **Catalogue Pharmaceutique Global :** Configuration des articles (médicaments, consommables), catégories et gestion globale des lots (Batches) avec traçabilité complète.

### 3. 🧪 Gestion Logistique & Pharmacie (Pharmacien / Admin)
* **Emplacements de Stockage :** Découpage physique d'une pharmacie en allées et étagères pour localiser précisément les articles.
* **Commandes & Retours d'Achat :** Processus complet d'approvisionnement auprès des fournisseurs (création, validation, annulation, génération automatique de bons de commande PDF).
* **Transferts de Stock Inter-succursales :** Expédition et réception sécurisée d'articles d'une pharmacie à une autre avec génération de lettre de voiture (Waybill) et suivi logistique en temps réel.
* **Inventaires Physiques :** Audits de stock périodiques avec ajustement automatique des stocks réels après validation.
* **Mouvements de Stock :** Historique immuable de toutes les transactions de stock (entrées, sorties, transferts, ajustements).

---

## 🛠️ Stack Technique & Dépendances

* **Framework :** Laravel v12.x
* **Base de données :** SQLite (par défaut pour le développement) ou MySQL/PostgreSQL (production).
* **Authentification :** Laravel Sanctum (tokens Bearer sécurisés).
* **Génération PDF :** `barryvdh/laravel-dompdf` pour les factures, bons de commande et rapports.
* **Import/Export Excel :** `maatwebsite/excel` pour les listes de fournisseurs, véhicules et chauffeurs.
* **Documentation API :** `darkaonline/l5-swagger` (OpenAPI v3.0 annotations).

---

## 📂 Structure du Projet Backend

```bash
asklepios-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/         # Contrôleurs pour la gestion interne d'un hôpital
│   │   │   ├── Auth/          # Contrôle d'accès et authentification
│   │   │   ├── Pharmacien/    # Gestion des stocks, inventaires et achats
│   │   │   └── SUPA/          # Espace Super Admin (gestion SaaS)
│   │   └── Middleware/        # Middlewares de vérification de Rôles et Licences
│   └── Models/
│       ├── Pharmacy/          # Modèles logistiques (Article, Batch, Stock, Transfer...)
│       └── ...                # Modèles de base (User, Hospital, Subscription, Role...)
├── config/                    # Fichiers de configuration de l'application
├── database/
│   ├── migrations/            # Schéma de base de données (40+ migrations d'entités)
│   └── seeders/               # Données de démonstration et rôles initiaux
├── routes/
│   └── api.php                # Définition complète des routes REST de l'ERP
└── storage/api-docs/          # Spécifications OpenAPI/Swagger générées
```

---

## ⚙️ Installation & Configuration

### Prérequis
* PHP >= 8.2 (avec extensions curl, sqlite3, zip, mbstring)
* Composer
* Node.js & NPM (pour compiler les assets de base si nécessaire)

### 1. Cloner et Initialiser le Projet
Pour vous faciliter le travail, un script de configuration automatisé est inclus dans le fichier `composer.json`. Placez-vous dans le dossier `asklepios-backend` et lancez :

```bash
composer run setup
```

Ce script va automatiquement :
1. Installer les dépendances Composer (`composer install`).
2. Créer le fichier d'environnement `.env` à partir de `.env.example`.
3. Générer la clé d'application unique (`php artisan key:generate`).
4. Préparer la base de données SQLite et appliquer toutes les migrations.
5. Installer et compiler les paquets NPM.

### 2. Base de données & Seeders
Si vous souhaitez réinitialiser ou peupler la base de données avec les données initiales de démonstration (utilisateurs de test, hôpitaux, licences et rôles), exécutez la commande suivante :

```bash
php artisan migrate:fresh --seed
```

#### Identifiants par défaut (Super Admin)
* **Email :** `admin@asklepios.com`
* **Mot de passe :** `secrets`

---

## 💻 Démarrage du Serveur de Développement

Pour démarrer simultanément le serveur de développement Laravel Artisan, le listener de files d'attente (Queue Worker), le logger interactif Pail et le serveur de build Vite, lancez :

```bash
composer run dev
```

L'API sera par défaut accessible sur **`http://localhost:8000`**.

---

## 📖 Documentation Interactive de l'API (Swagger)

Le projet intègre une interface Swagger UI permettant de tester et d'interagir en temps réel avec tous les endpoints de l'API.

* **URL de l'interface :** `http://localhost:8000/api/documentation`
* **Mise à jour de la documentation :** Si vous modifiez les annotations dans vos contrôleurs, relancez le serveur de dev ou utilisez :
  ```bash
  php artisan l5-swagger:generate
  ```

---

## 🧪 Tests Unitaires & d'Intégration

Les tests automatisés d'Asklepios ERP couvrent les flux critiques comme l'authentification, les transactions de stock et l'attribution des licences. Pour exécuter la suite de tests PHPUnit :

```bash
composer run test
```
