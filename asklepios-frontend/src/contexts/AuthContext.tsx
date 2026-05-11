import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { ProfileDto } from "../types/types";

// 1. On ajoute 'loading' dans l'interface
interface AuthContextType {
    profile: ProfileDto | null;
    token: string | null;
    loading: boolean; 
    setProfile: (profile: ProfileDto | null) => void;
    setToken: (token: string | null) => void;
}

// 2. On l'initialise à true par défaut
export const AuthContext = createContext<AuthContextType>({
    profile: null, 
    token: null,
    loading: true, 
    setProfile: () => {},
    setToken: () => {},
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
    // Initialisation explicite à null pour éviter le type 'undefined'
    const [profile, setProfile] = useState<ProfileDto | null>(null);
    const [token, setToken] = useState<string | null>(null);
    
    // 3. Création de l'état loading (qui commence à true)
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const storedToken = localStorage.getItem("ACCESS_TOKEN");
        const storedUser = localStorage.getItem("current_user");
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setProfile(JSON.parse(storedUser));
            } catch (error) {
                console.error("Erreur de lecture du profil:", error);
            }
        }
        
        // 4. TRÈS IMPORTANT : On indique que la lecture est terminée,
        // qu'on ait trouvé un utilisateur ou non !
        setLoading(false);
    }, []);

    return (
        // 5. On expose 'loading' dans la valeur du Provider
        <AuthContext.Provider value={{ profile, token, loading, setProfile, setToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);