# Asklepios ERP - Directives de Développement Frontend & UX

## 1. Optimistic UI Updates (TanStack Query / React Query)
- **Principe Général** : Pour toutes les mutations de données de type `UPDATE` (mise à jour) et `DELETE` (suppression) dans l'application, utiliser systématiquement les **Optimistic Updates** via `onMutate` dans les hooks TanStack Query.
- **Objectif** : L'interface utilisateur (UI) doit réagir instantanément en **0 milliseconde**, fermer les éditeurs/modales et mettre à jour le cache React Query avant la réponse du serveur.
- **Rollback Sécurisé** : Toujours inclure `onError` avec restauration du snapshot (`context.previousData`) et un Toast d'erreur en cas d'échec réseau.
- **Background Invalidation** : Appeler `invalidateQueries` dans `onSettled` pour garantir la synchronisation finale avec le serveur.

## 2. Précautions et Exceptions Strictes
- 🔴 **FINANCE, FACTURATION & CAISSE** (Factures, Encaissements, Mobile Money) : Ne PAS utiliser d'Optimistic UI. Attendre la confirmation formelle du serveur (`onSuccess`) pour garantir la fiabilité financière absolue.
- 🔴 **GÉNÉRATION DE DOCUMENTS** (PDFs, Bulletins d'analyses, Reçus) : Attendre la réponse du serveur pour récupérer l'URL du fichier généré.
- 🟡 **CRÉATIONS (POST/CREATE)** : Utiliser un identifiant temporaire dans le cache si la réactivité instantanée est requise, puis synchroniser silencieusement avec le vrai ID serveur.
