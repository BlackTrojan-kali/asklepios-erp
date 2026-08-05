Vous pouvez copier ce code et remplacer l'intégralité de votre fichier actuel.
Markdown

# 🏥 Asklepios ERP - Guide de Démarrage Développeur

Bienvenue sur le dépôt backend d'**Asklepios ERP**. Ce document est le guide officiel pour configurer, exécuter et tester le projet en local sans rencontrer d'erreurs.

Ce projet utilise une architecture **Multi-Tenant (Database-per-tenant)** propulsée par **Laravel 12** et **Laravel Octane (RoadRunner)** pour des performances maximales.

---

## ⚠️ AVERTISSEMENT : Environnement de Développement (Windows vs Linux)
Le serveur **Laravel Octane** nécessite l'extension PHP `pcntl` (Process Control) pour gérer les signaux d'arrêt du serveur (`SIGINT`, `Ctrl+C`). 
**Cette extension n'est pas supportée nativement par Windows.** 
* Si vous développez sous Windows, vous **devez** exécuter les commandes du serveur depuis un terminal Linux (via WSL - Windows Subsystem for Linux, ou une distribution comme Parrot OS/Ubuntu).
* Si vous ne pouvez pas utiliser WSL, vous devrez utiliser le serveur lent par défaut (`php artisan serve`) au lieu d'Octane.

---

## 🏗️ Architecture Multi-Tenant : Comment ça marche ?

Le projet interagit avec deux bases de données distinctes :
1. 🟢 **Base Système (`asklepios_system`) :** C'est le cerveau SaaS. Elle contient la table `saas_tenants` (les licences) et route dynamiquement les requêtes.
2. 🔵 **Base Tenant (`asklepios_dev_tenant`) :** C'est la base de l'hôpital. Elle contient tout le métier (Patients, Pharmacie, Labo, etc.). 

À chaque requête, un Middleware lit le domaine (ex: `localhost`), interroge la base Système, puis bascule la connexion sur la base Tenant correspondante.

---

## ⚙️ Installation Étape par Étape

### 1. Prérequis Système
* **PHP >= 8.2** (avec `pdo_mysql`, `curl`, `zip`, `mbstring`, et `pcntl` sous Linux)
* **Composer** & **Node.js**
* **MySQL** ou **MariaDB**

### 2. Clonage et Dépendances
```bash
git clone <url-du-depot-git>
cd asklepios-backend
composer install
npm install

3. Configuration de l'Environnement (.env)

Créez votre fichier d'environnement et générez la clé d'application :
Bash

cp .env.example .env
php artisan key:generate

🚨 IMPORTANT : Ouvrez votre fichier .env et configurez-le exactement comme suit. Assurez-vous qu'il n'y ait aucun doublon de variable (notamment pour CACHE_STORE ou QUEUE_CONNECTION) plus bas dans le fichier.
Code snippet

APP_NAME="Asklepios ERP"
APP_ENV=local
APP_KEY= # (Générée automatiquement)
APP_DEBUG=true
APP_URL=http://localhost:8000

# MOTEUR OCTANE
OCTANE_SERVER=roadrunner

# BASE SYSTÈME (Routeur)
DB_CONNECTION=system
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=asklepios_system
DB_USERNAME=root
DB_PASSWORD=votre_mot_de_passe

# BASE TENANT (CLI par défaut)
DB_TENANT_HOST=127.0.0.1
DB_TENANT_PORT=3306
DB_TENANT_DATABASE=asklepios_dev_tenant
DB_TENANT_USERNAME=root
DB_TENANT_PASSWORD=votre_mot_de_passe

# PERFORMANCES (Toujours sur "file" ou "sync" en dev local)
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local

4. Configuration Interne (config/database.php)

Pour que les commandes de terminal (CLI) comme db:seed fonctionnent sur la base de l'hôpital, vérifiez que le bloc tenant possède bien un point de chute défini dans config/database.php :
PHP

'tenant' => [
    'driver' => 'mysql',
    // ...
    'database' => env('DB_TENANT_DATABASE', 'asklepios_dev_tenant'), 
    // ...
],

5. Préparation des Bases de Données

Dans PhpMyAdmin, DBeaver ou votre terminal MySQL, créez deux bases de données vides :

    asklepios_system

    asklepios_dev_tenant

6. Nettoyage et Migrations

Avant de lancer les migrations, purgez les anciens caches résiduels qui pourraient bloquer l'application (Erreurs SQL "Table cache doesn't exist") :
Bash

# S'il y a des fichiers .php dans bootstrap/cache/, supprimez-les manuellement !
rm bootstrap/cache/*.php
php artisan optimize:clear

Exécutez ensuite les migrations dans l'ordre strict de l'architecture Multi-Tenant :

A. La Base Système :
Bash

php artisan migrate:fresh --database=system --path=database/migrations/system
php artisan db:seed --class=SystemDatabaseSeeder --database=system

B. La Base de l'Hôpital (Tenant) :
Bash

php artisan migrate:fresh --database=tenant --path=database/migrations/tenant
php artisan db:seed --database=tenant

⚡ Lancement du Serveur (Octane / RoadRunner)

Ouvrez un terminal Linux (WSL, Ubuntu, Parrot, etc.), placez-vous dans le dossier du projet et lancez le serveur :
Bash

# Installation du binaire RoadRunner (à faire une seule fois)
composer require spiral/roadrunner-cli spiral/roadrunner-http
php artisan octane:install --server=roadrunner

# Lancement du serveur avec rechargement automatique du code
php artisan octane:start --server=roadrunner --port=8000 --watch

L'API est maintenant accessible sur http://localhost:8000.

    Identifiants de test (Hôpital) : admin@asklepios.com / secrets

    Documentation Interactive : http://localhost:8000/api/documentation

🛠️ Dépannage Rapide (Cheat Sheet)

    Erreur Undefined constant SIGINT : Vous essayez d'exécuter octane:start sous Windows PowerShell. Basculez sur votre terminal Linux/WSL.

    Erreur Invalid catalog name: 1046 No database selected en tapant une commande Artisan : La console ne sait pas quelle base cibler. Ajoutez toujours --database=tenant quand vous manipulez l'ERP en ligne de commande (ex: php artisan db:seed --database=tenant).

    Erreur Table asklepios_system.cache doesn't exist lors d'un optimize:clear : Laravel lit un vieux cache. Allez dans le dossier bootstrap/cache/ et supprimez manuellement tous les fichiers .php, puis relancez la commande.

    Nouvelle Migration pour l'Hôpital ? Créez la migration normalement, puis déplacez manuellement le fichier généré dans database/migrations/tenant.