import type { AxiosError } from "axios";
import api from "../../api/api";
import type { UserLoginDto } from "../../types/types";
import axios from "axios";
import toast from "react-hot-toast";

const login = async (payload: UserLoginDto) => {
    try {
        const res = await api.post("/auth/login", payload);
        
        if (res && res.data) {
            localStorage.setItem("ACCESS_TOKEN", res.data.token);
            
            const userString = typeof res.data.user === 'string' 
                ? res.data.user 
                : JSON.stringify(res.data.user);
            localStorage.setItem("current_user", userString);
            
            toast.success("Authentification réussie");
            
            return res.data; 
        }
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const errorMessage = typeof error.response?.data === 'string' 
                ? error.response.data 
                : "Identifiants invalides";
            toast.error(errorMessage);
        } else {
            toast.error("Erreur de connexion au serveur");
        }
        
        return null;
    }
}
const logout = async () =>{
    try {
        const res = await api.post("/auth/logout");
                if (res) {
            localStorage.removeItem("ACCESS_TOKEN");
            
            localStorage.removeItem("current_user");
            
            toast.success("deconnexion reussie");
            
        }
    } catch (error) {
          if (axios.isAxiosError(error)) {
            const errorMessage = typeof error.response?.data === 'string' 
                ? error.response.data 
                : "Operation impossible";
            toast.error(errorMessage);
        } else {
            toast.error("Erreur de connexion au serveur");
        }
        
        return null;
    }
}
export { login ,logout};