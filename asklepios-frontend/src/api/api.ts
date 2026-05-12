import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000/api",
    withCredentials: true,
    headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
});

// Intercepteur de REQUÊTE : Ajoute le token avant l'envoi
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Intercepteur de RÉPONSE : Gère les retours du serveur
api.interceptors.response.use(
    (response) => {
        // Tout s'est bien passé (Status 2xx), on retourne la réponse
        return response;
    },
    (error) => {
        try {
            const { response } = error;
            
            // Si le serveur répond avec une erreur 401 (Non Autorisé / Token expiré)
            if (response && response.status === 401) {
                // 1. On supprime le token expiré du stockage
                localStorage.removeItem("ACCESS_TOKEN");
                
                // (Optionnel) Nettoyer d'autres données liées à la session
                // localStorage.removeItem("USER_PROFILE");

                // 2. Redirection forcée vers la page de connexion
                // On utilise window.location car nous sommes en dehors du contexte de React Router
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        } catch (e) {
            console.error("Erreur lors de l'interception de la réponse :", e);
        }

        // On rejette l'erreur pour que les blocs try/catch de tes composants puissent aussi la voir
        return Promise.reject(error);
    }
);

export default api;