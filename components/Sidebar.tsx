
import React from 'react';
import { Home, Boxes, ShoppingCart, FileText, Users, Settings, BarChart3, PanelLeft, LogOut, LucideProps } from 'lucide-react';
import type { View } from '../types';

interface SidebarProps {
    view: View;
    setView: (view: View) => void;
    userId: string | null;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    handleSignOut: () => void;
}

interface NavItemProps {
    icon: React.ComponentType<LucideProps>;
    label: string;
    viewName: View;
    onClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ view, setView, userId, isSidebarOpen, setIsSidebarOpen, handleSignOut }) => {

    const NavItem: React.FC<NavItemProps & { currentView: View }> = ({ icon: Icon, label, viewName, onClick, currentView }) => (
        <button
            onClick={onClick ? onClick : () => setView(viewName)}
            className={`
                flex items-center w-full px-4 py-3 text-sm font-medium
                ${!onClick && currentView === viewName 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                transition-colors rounded-lg ${!isSidebarOpen ? 'justify-center' : ''}
            `}
            title={isSidebarOpen ? '' : label}
        >
            <Icon size={20} className={`${isSidebarOpen ? 'mr-3' : 'mr-0'}`} />
            <span className={`whitespace-nowrap transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 h-0 w-0'}`}>{label}</span>
        </button>
    );

    return (
        <aside id="app-sidebar" className={`bg-gray-800 text-white flex flex-col h-screen shadow-lg transition-all duration-300 ${isSidebarOpen ? 'w-64 p-4' : 'w-20 p-4'}`}>
            <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} mb-8 px-2`}>
                <div className={`flex items-center space-x-3 overflow-hidden`}>
                    <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                        <svg className="h-8 w-8 text-gray-800" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 18V6H9.75L12 9.75L14.25 6H18V18H15V10.5L12 15L9 10.5V18H6Z" />
                        </svg>
                    </div>
                    <span className={`text-xl font-semibold text-white whitespace-nowrap transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                        MedoApp
                    </span>
                </div>
                {isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="text-gray-400 hover:text-white p-1 rounded-md"
                    >
                        <PanelLeft size={20} />
                    </button>
                )}
            </div>

            {!isSidebarOpen && (
                <div className="mb-8 px-2 flex justify-center">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-gray-400 hover:text-white p-1 rounded-md"
                    >
                        <PanelLeft size={20} className="rotate-180" />
                    </button>
                </div>
            )}

            <nav className="flex-1 space-y-2">
                <NavItem icon={Home} label="Tableau de bord" viewName="dashboard" currentView={view} />
                <NavItem icon={ShoppingCart} label="Caisse" viewName="pos" currentView={view} />
                <NavItem icon={Boxes} label="Gestion de Stock" viewName="stock" currentView={view} />
                <NavItem icon={Users} label="Clients" viewName="customers" currentView={view} />
                <NavItem icon={FileText} label="Documents" viewName="documents" currentView={view} />
                <NavItem icon={BarChart3} label="Rapports" viewName="reports" currentView={view} />
            </nav>

            <div className="mt-auto">
                <NavItem icon={Settings} label="Paramètres" viewName="settings" currentView={view} />
                 <NavItem icon={LogOut} label="Déconnexion" viewName="dashboard" onClick={handleSignOut} currentView={view} />
                <div className={`pt-4 border-t border-gray-600 mt-2 transition-opacity ${!isSidebarOpen ? 'opacity-0 h-0 invisible' : 'opacity-100'}`}>
                    <p className="text-xs text-gray-400 whitespace-nowrap">Connecté en tant que:</p>
                    <p className="text-xs text-gray-200 font-medium break-all">{userId || 'Chargement...'}</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
