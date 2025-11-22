import React, { useMemo } from 'react';
import { Boxes, ShoppingCart, Users, Plus, Package, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import type { Product, Customer, Document, View } from '../types';

interface DashboardProps {
    products: Product[];
    customers: Customer[];
    documents: Document[];
    setView: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ products, customers, documents, setView }) => {
    const totalStockValue = useMemo(() =>
        products.reduce((sum, p) => sum + (p.prixVente * p.stock), 0), [products]);

    const totalInvoiced = useMemo(() =>
        documents
        .filter(d => d.type === 'facture' && d.status !== 'Annulée')
        .reduce((sum, d) => sum + d.totalTTC, 0), [documents]);

    const lowStockProducts = useMemo(() =>
        products.filter(p => p.stock <= 10).sort((a, b) => a.stock - b.stock), [products]);

    const bestSellers = useMemo(() => {
        const sales = documents
            .filter(d => d.type === 'facture' && d.status !== 'Annulée')
            .flatMap(d => d.items);

        // FIX: Using a for...of loop for aggregation to ensure proper type inference,
        // which was failing with the `reduce` method.
        const aggregated: Record<string, { nom: string, quantity: number }> = {};
        for (const item of sales) {
            if (!aggregated[item.ref]) {
                aggregated[item.ref] = { nom: item.nom, quantity: 0 };
            }
            aggregated[item.ref].quantity += item.quantity;
        }

        return Object.entries(aggregated)
            .map(([ref, { nom, quantity }]) => ({ ref, nom, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [documents]);

    const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: { border: string; text: string }; onClick: () => void }> = ({ title, value, icon, color, onClick }) => (
        <button
            onClick={onClick}
            className={`bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 w-full text-left transition-shadow hover:shadow-lg`}
        >
            <div className={`p-3 rounded-lg border-2 ${color.border} ${color.text}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </button>
    );

    return (
        <div>
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">Tableau de bord</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Produits en Stock" value={products.length} icon={<Boxes size={28} />} color={{ border: 'border-blue-200', text: 'text-blue-600' }} onClick={() => setView('stock')} />
                <StatCard title="Valeur du Stock (Vente)" value={formatCurrency(totalStockValue)} icon={<Package size={28} />} color={{ border: 'border-green-200', text: 'text-green-600' }} onClick={() => setView('stock')} />
                <StatCard title="Clients Enregistrés" value={customers.length} icon={<Users size={28} />} color={{ border: 'border-indigo-200', text: 'text-indigo-600' }} onClick={() => setView('customers')} />
                <StatCard title="Total Facturé (TTC)" value={formatCurrency(totalInvoiced)} icon={<DollarSign size={28} />} color={{ border: 'border-yellow-300', text: 'text-yellow-600' }} onClick={() => setView('documents')} />
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Actions Rapides</h3>
                <div className="flex flex-wrap gap-4">
                    <button onClick={() => setView('pos')} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors"> <ShoppingCart size={20} /> <span>Nouvelle Vente</span> </button>
                    <button onClick={() => setView('stock')} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors"> <Plus size={20} /> <span>Nouveau Produit</span> </button>
                    <button onClick={() => setView('customers')} className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"> <Users size={20} /> <span>Nouveau Client</span> </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"> <AlertTriangle size={20} className="text-red-500 mr-2" /> Produits en Stock Faible </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
                            <div key={p.id} className="flex justify-between items-center text-sm">
                                <div> <p className="font-medium text-gray-700">{p.nom}</p> <p className="text-xs text-gray-500">{p.ref}</p> </div>
                                <span className="font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs"> {p.stock} restants </span>
                            </div>
                        )) : <p className="text-sm text-gray-500">Aucun produit en stock faible. Bravo!</p>}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"> <TrendingUp size={20} className="text-green-500 mr-2" /> Meilleures Ventes (par Qté) </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {bestSellers.length > 0 ? bestSellers.map(p => (
                            <div key={p.ref} className="flex justify-between items-center text-sm">
                                <div> <p className="font-medium text-gray-700">{p.nom}</p> <p className="text-xs text-gray-500">{p.ref}</p> </div>
                                <span className="font-semibold text-green-700"> {p.quantity} vendus </span>
                            </div>
                        )) : <p className="text-sm text-gray-500">Aucune vente enregistrée pour le moment.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;