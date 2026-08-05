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
Avant de commencer, assurez-vous d'avoir installé :
* **PHP >= 8.2** (avec les extensions `pdo_mysql`, `curl`, `zip`, `mbstring`, et `pcntl` sous Linux)
* **Composer** & **Node.js**
* **MySQL** ou **MariaDB**

### 2. Clonage et Dépendances

Commencez par cloner le code source depuis le dépôt Git, accédez au dossier du projet, puis installez les dépendances PHP et JavaScript requises par le framework :

```bash
git clone <url-du-depot-git>
cd asklepios-backend
composer install
npm install
```
3. Configuration de l'Environnement (.env)

Dupliquez le fichier d'environnement d'exemple pour créer votre configuration locale, et générez la clé de chiffrement unique de l'application :
```Bash

cp .env.example .env
php artisan key:generate
```
🚨 IMPORTANT : Ouvrez ensuite votre nouveau fichier .env et remplacez son contenu par la configuration ci-dessous. Cette configuration désactive les caches problématiques en base de données et prépare les variables pour l'architecture Multi-Tenant :
Code snippet
```bash
APP_NAME="Asklepios ERP"
APP_ENV=local
APP_KEY= # (Laissez la clé générée automatiquement à l'étape précédente)
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
```
4. Configuration Interne (config/database.php)

Pour garantir le bon fonctionnement des commandes de terminal (comme les seeders) sur la base de données de l'hôpital, vérifiez que votre fichier config/database.php contient bien la valeur de secours suivante dans le bloc tenant :
```bash
PHP

'tenant' => [
    'driver' => 'mysql',
    // ...
    'database' => env('DB_TENANT_DATABASE', 'asklepios_dev_tenant'), 
    // ...
],
```
5. Préparation des Bases de Données

Ouvrez votre interface de gestion de base de données (PhpMyAdmin, DBeaver, etc.) ou votre terminal MySQL, et créez manuellement deux bases de données vides :

    asklepios_system

    asklepios_dev_tenant

6. Nettoyage et Migrations

Avant de construire les tables, il est impératif de supprimer tout fichier de cache résiduel qui pourrait faire planter les migrations de l'architecture multi-bases :
```Bash

rm bootstrap/cache/*.php
php artisan optimize:clear
```
Exécutez maintenant les migrations de la Base Système. Cela va créer les tables de routage SaaS et insérer une licence de développement pour localhost :
```Bash

php artisan migrate:fresh --database=system --path=database/migrations/system
php artisan db:seed --class=SystemDatabaseSeeder --database=system
```
Exécutez ensuite les migrations de la Base Tenant. Cela va construire toute l'architecture de l'hôpital (patients, médicaments, utilisateurs) et la remplir avec des fausses données de test :
```Bash

php artisan migrate:fresh --database=tenant --path=database/migrations/tenant
php artisan db:seed --database=tenant
```
⚡ Lancement du Serveur (Octane / RoadRunner)

Ouvrez votre terminal Linux (ou WSL sous Windows), assurez-vous d'être dans le dossier du projet, et installez les dépendances du serveur RoadRunner (cette commande est à faire une seule fois) :
```Bash

composer require spiral/roadrunner-cli spiral/roadrunner-http
php artisan octane:install --server=roadrunner
```
Enfin, démarrez le serveur Laravel Octane en mode "watch" pour qu'il recharge automatiquement votre code à chaque sauvegarde de fichier :
```Bash

php artisan octane:start --server=roadrunner --port=8000 --watch
```
L'API est maintenant en ligne et ultra-rapide !

    URL de l'API : http://localhost:8000

    Documentation Interactive Swagger : http://localhost:8000/api/documentation

    Identifiants de test (Hôpital) : admin@asklepios.com / secrets

🛠️ Dépannage Rapide (Cheat Sheet)

    Erreur Undefined constant SIGINT : Vous essayez d'exécuter octane:start sous Windows PowerShell. Vous devez absolument basculer sur votre terminal Linux/WSL.

    Erreur Invalid catalog name: 1046 No database selected en console : La console d'Artisan ne sait pas quelle base cibler. Ajoutez toujours l'argument --database=tenant quand vous manipulez l'ERP en ligne de commande (ex: php artisan db:seed --database=tenant).

    Erreur Table asklepios_system.cache doesn't exist lors d'un optimize:clear : Laravel est bloqué sur un vieux cache de l'environnement précédent. Allez dans le dossier bootstrap/cache/, supprimez manuellement tous les fichiers .php, et relancez la commande.

    Comment créer une nouvelle Migration pour l'Hôpital ? Créez la migration normalement avec Artisan, puis déplacez manuellement le fichier généré dans le dossier database/migrations/tenant.