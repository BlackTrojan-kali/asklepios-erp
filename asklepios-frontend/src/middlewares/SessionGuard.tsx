import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useMyActiveSession } from "../hooks/pharmacy/useCashRegisterSession";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface SessionGuardProps {
  children: React.ReactNode;
}

const SessionGuard = ({ children }: SessionGuardProps) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: myActiveSession, isLoading } = useMyActiveSession();

  const isPharmacy = profile?.role === "pharmacy";

  useEffect(() => {
    if (isPharmacy && !isLoading) {
      const currentPath = location.pathname;

      if (!myActiveSession || !myActiveSession.id) {
        if (
          currentPath !== "/pharmacy/cash/session/open" &&
          currentPath !== "/pharmacy/cash/session/history"
        ) {
          toast.error(
            "Aucune session de caisse active. Veuillez d'abord en ouvrir une.",
          );
          navigate("/pharmacy/cash/session/open", { replace: true });
        }
      } else {
        if (currentPath === "/pharmacy/cash/session/open") {
          toast.error("Vous avez déjà une session active ouverte.");
          navigate("/pharmacy/cash/session/close", { replace: true });
        }
      }
    }
  }, [myActiveSession, isLoading, isPharmacy, location.pathname, navigate]);

  if (isPharmacy && isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-gray-900">
        <Loader2 size={40} className="animate-spin text-teal-600" />
      </div>
    );
  }

  return <>{children}</>;
};

export default SessionGuard;
