import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { ProfileDto } from "../types/types";
interface AuthContextType {
    profile: ProfileDto | null;
    token: string | null;
    setProfile: (profile: ProfileDto | null) => void;
    setToken: (token: string | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
    profile: null,
    token: null,
    setProfile: () => {},
    setToken: () => {},
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
    const [profile, setProfile] = useState<ProfileDto | null>();
    const [token, setToken] = useState<string | null>();

    useEffect(() => {
        const storedToken = localStorage.getItem("ACCESS_TOKEN");
        const storedUser = localStorage.getItem("current_user");
        console.log(JSON.parse(storedUser))
        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setProfile(JSON.parse(storedUser));
            } catch (error) {
                console.error("Erreur de lecture du profil:", error);
            }
        }
    }, []);

    return (
        <AuthContext.Provider value={{ profile, token, setProfile, setToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);