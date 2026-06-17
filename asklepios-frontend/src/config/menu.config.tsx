import React from 'react';
import { 
    Globe, Hospital, Shield, NotebookText, Settings, 
    HospitalIcon, Pill,
    Home,
    ListOrdered
} from 'lucide-react';

// --- 1. DÉFINITION DES TYPES ---
export type MenuItemType = {
    title: string;
    icon?: React.ReactNode;
    path?: string;
    roles?: string[];
    subItems?: MenuItemType[];
};

// --- 2. CONFIGURATION GLOBALE DES MENUS ---
export const MENU_CONFIG: MenuItemType[] = [
    {
        title: "Pays",
        icon: <Globe size={20} />,
        path: "/countries",
        roles: ["super_admin"],
    },
    {
        title: "Hôpitaux",
        icon: <Hospital size={20} />,
        path: "/hospitals",
        roles: ["super_admin"],
    },
    {
        title: "Admins",
        icon: <Shield size={20}/>,
        path: "/admins",
        roles: ["super_admin"],
    },
    {
        title: "Licences & Souscriptions",
        icon: <NotebookText size={20} />,
        roles: ["super_admin"],
        subItems: [
            { title: "Licences", path: "/licences" },
            { title: "Souscriptions", path: "/subscriptions" },
        ]
    },
    {
        title: "Paramètres",
        icon: <Settings size={20} />,
        path: "/settings",
        roles: ["super_admin"],
    },
    // Onglets Admin
    {
        title: "Centres",
        icon: <HospitalIcon size={20}/>,
        roles:["admin"],
        subItems:[
            {
                title:"Centres",
                path:"/admin/centers"
            },
            {
                title:"Départements",
                path:"/admin/departments"
            }
        ]
    },
    {
        title:"Pharmacies",
        icon: <Pill size={20}/>,
        roles:["admin"],
        subItems:[
            {
                title:"Pharmacies",
                path:"/admin/pharmacies"
            },
            {
                title:"Articles",
                  subItems: [
                      { title: "Categories", path: "/admin/pharmacy/acticles-categories" },
                      { title: "Articles", path: "/admin/pharmacy/articles" },
                      { title:"Lots", path:"/admin/pharmacy/batch"}
                  ]
            },
            {
                title:"Pharmaciens",
                path:"/admin/pharmaciens"
            },
            {
                title:"Versements",
                path:"/admin/pharmacy/versements"
            },
            {
                title:"Movements",
                path:"/admin/movements",
            },
            {
                title:"Stocks",
                path:"/admin/pharmacy/stocks",
            },
            {
                title:"Fournisseurs",
                path:"/admin/pharmacy/providers"
            }
           
        ]
    },
    //pharmacien magasin
    {
        title:"Acceuil",
        icon: <Home/>,
        roles:["pharmacy"],
        subItems:[
            {
                title:"stocks",
                path:"/pharmacy"
            },{
                title:"Movements",
                path:"/pharmacy/movements",
            },
            {
                title:"emplacements",
                path:"/pharmacy/storage_location"
            }
        ]
        
    },
    {
        title:"Commandes",
        icon:<ListOrdered/>,
        roles:["pharmacy"],
        subItems:[
            {
                title:"Commandes effectuées",
                path:"/pharmacy/orders"
            },
            {
                title:"Retours Commandes",
                path:"/pharmacy/returns"
            }
        ]
    },//reporting commandes admin
      {
        title:"Commandes",
        icon:<ListOrdered/>,
        roles:["admin"],
        subItems:[
            {
                title:"Commandes effectuées",
                path:"/admin/orders"
            },
            {
                title:"Retours Commandes",
                path:"/admin/returns"
            }
        ]
    }
];