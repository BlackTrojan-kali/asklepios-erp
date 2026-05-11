import React, { useEffect, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const AuthMiddleware = ({ children }: { children: ReactNode }) => {
    // On récupère aussi l'état 'loading' depuis le contexte
    const { token, loading } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
        // On ne déclenche la redirection que si l'initialisation est terminée
        if (!loading && !token) {
            navigate('/auth/login', { replace: true }); 
        }
    }, [token, navigate, loading]);

    // 1. Pendant que React lit le localStorage, on affiche l'écran de chargement
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#faf8f1] dark:bg-gray-900">
                <Loader2 size={40} className="animate-spin text-[#00a896]" />
            </div>
        );
    }

    // 2. Si le chargement est fini mais qu'il n'y a pas de token, 
    // on ne rend rien (le useEffect se charge de la redirection vers /login)
    if (!token) {
        return null;
    }

    // 3. Si tout est bon (chargement fini ET token présent), on affiche la suite
    return <>{children}</>;
}

export default AuthMiddleware;