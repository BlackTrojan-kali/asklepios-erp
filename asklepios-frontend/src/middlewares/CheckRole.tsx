import React, { useEffect, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // Attention : react-router-dom
import toast from 'react-hot-toast';

// J'ai modifié 'role' en 'roles' (un tableau) pour plus de flexibilité !
interface CheckRoleProps {
    roles: string[]; 
    children: ReactNode;
}

const CheckRole = ({ children, roles }: CheckRoleProps) => {
    const { profile } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // On attend que le profil soit chargé avant de vérifier
        if (profile) {
            // Si le rôle de l'utilisateur n'est pas dans la liste des rôles autorisés
            if (!roles.includes(profile.role)) {
                toast.error("Vous n'avez pas le droit d'accéder à cette page.");
                // Il vaut mieux le renvoyer vers l'accueil plutôt que le déconnecter
                navigate("/", { replace: true }); 
            }
        }
    }, [profile, roles, navigate]);

    // Pendant la vérification, ou si bloqué, on affiche rien (ou un Loader)
    if (!profile || !roles.includes(profile.role)) {
        return null; 
    }

    // Si tout est bon, on affiche le contenu (l'AppLayout)
    return <>{children}</>;
}

export default CheckRole;