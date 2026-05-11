import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

type SubMenuItem = {
    title: string;
    path: string;
};
type MenuItem = {
    title: string;
    icon: React.ReactNode;
    path?: string; // Optionnel si on a des subItems
    roles: string[]; // Les rôles autorisés à voir ce menu
    subItems?: SubMenuItem[];
};

// --- 3. SOUS-COMPOSANT : GESTION D'UN ITEM & DROPDOWN ---
const SidebarItem = ({ 
    item, 
    isCollapsed, 
    setExpanded 
}: { 
    item: MenuItem; 
    isCollapsed: boolean; 
    setExpanded: (val: boolean) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasSubItems = item.subItems && item.subItems.length > 0;
const navigate  = useNavigate();
    const handleClick = () => {
        if (hasSubItems) {
            // Si la sidebar est rétractée, on l'ouvre d'abord
            if (isCollapsed) setExpanded(false);
            setIsOpen(!isOpen);
        } else { 
         navigate(item.path)
            console.log("Naviguer vers :", item.path);
        }
    };

    return (
        <div className="mb-1">
            {/* Bouton principal du menu */}
            <button 
                onClick={handleClick}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 
                hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-700 dark:text-gray-300
                ${isOpen && !isCollapsed ? 'bg-slate-50 dark:bg-gray-800/50 text-brand-blue dark:text-brand-teal font-semibold' : ''}`}
                title={isCollapsed ? item.title : ""}
            >
                <div className="flex items-center gap-3">
                    <span className="text-current">{item.icon}</span>
                    {!isCollapsed && <span className="text-sm whitespace-nowrap">{item.title}</span>}
                </div>
                
                {/* Icône Chevron pour les menus déroulants */}
                {hasSubItems && !isCollapsed && (
                    <span className="text-gray-400">
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                )}
            </button>

            {/* Sous-menus (Dropdown) */}
            {hasSubItems && isOpen && !isCollapsed && (
                <div className="ml-9 mt-1 space-y-1 overflow-hidden transition-all duration-300">
                    {item.subItems!.map((sub, idx) => (
                        <button 
                            key={idx}
                            onClick={() => navigate(sub.path)}
                            className="w-full flex items-center p-2 text-sm text-slate-500 hover:text-brand-blue dark:text-gray-400 dark:hover:text-brand-teal hover:bg-slate-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-3 opacity-50"></span>
                            {sub.title}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
export default SidebarItem