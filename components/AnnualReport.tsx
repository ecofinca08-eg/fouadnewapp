import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, Percent, Package } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import type { Document, Product, Settings } from '../types';

interface AnnualReportProps {
    documents: Document[];
    products: Product[];
    settings: Settings;
}

const AnnualReport: React.FC<AnnualReportProps> = ({ documents, products }) => {
    const allInvoices = useMemo(() =>
        documents.filter(d => d.type === 'facture' && d.status !== 'Annulée'), [documents]);

    const allSoldItems = useMemo(() =>
        allInvoices.flatMap(d => d.items), [allInvoices]);

    const stats = useMemo(() => {
        const totalTTC = allInvoices.reduce((sum, d) => sum + d.totalTTC, 0);
        const totalHT = allInvoices.reduce((sum, d) => sum + d.totalHT, 0);
        const totalTVA = allInvoices.reduce((sum, d) => sum + d.totalTVA, 0);

        const totalCOGS = allSoldItems.reduce((sum, item) => {
            const product = products.find(p => p.id === item.id);
            const cost = product ? product.prixAchat : item.prixVente;
            return sum + (cost * item.quantity);
        }, 0);

        const grossProfit = totalHT - totalCOGS;
        const grossMargin = totalHT > 0 ? (grossProfit / totalHT) * 100 : 0;
        const totalItemsSold = allSoldItems.reduce((sum, item) => sum + item.quantity, 0);

        return { totalTTC, totalHT, totalTVA, totalCOGS, grossProfit, grossMargin, totalItemsSold };
    }, [allInvoices, allSoldItems, products]);

    const topSellersByRevenue = useMemo(() => {
        // FIX: Using a for...of loop for aggregation to ensure proper type inference,
        // which was failing with the `reduce` method.
        const aggregated: Record<string, { nom: string; revenue: number; quantity: number }> = {};
        for (const item of allSoldItems) {
            const revenue = item.prixVente * item.quantity;
            if (!aggregated[item.ref]) {
                aggregated[item.ref] = { nom: item.nom, revenue: 0, quantity: 0 };
            }
            aggregated[item.ref].revenue += revenue;
            aggregated[item.ref].quantity += item.quantity;
        }
        return Object.entries(aggregated).map(([ref, { nom, revenue, quantity }]) => ({ ref, nom, revenue, quantity })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [allSoldItems]);

    const topCustomersByRevenue = useMemo(() => {
        // FIX: Using a for...of loop for aggregation to ensure proper type inference,
        // which was failing with the `reduce` method.
        const aggregated: Record<string, { revenue: number; invoices: number }> = {};
        for (const doc of allInvoices) {
            const customerName = doc.customer.nom;
            if (!aggregated[customerName]) {
                aggregated[customerName] = { revenue: 0, invoices: 0 };
            }
            aggregated[customerName].revenue += doc.totalTTC;
            aggregated[customerName].invoices += 1;
        }
        return Object.entries(aggregated).map(([name, { revenue, invoices }]) => ({ name, revenue, invoices })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    }, [allInvoices]);
    
    const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; colorClass: { border: string; text: string } }> = ({ title, value, icon, colorClass }) => (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-start space-x-4">
            <div className={`p-3 rounded-lg border-2 ${colorClass.border} ${colorClass.text}`}>{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );

    const ListCard: React.FC<{ title: string; data: any[]; valueKey: string; labelKey: string; unit?: string }> = ({ title, data, valueKey, labelKey, unit = '' }) => (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
                {data.length > 0 ? data.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <div>
                            <p className="font-medium text-gray-700">{item[labelKey]}</p>
                            {item.ref && <p className="text-xs text-gray-500">{item.ref}</p>}
                        </div>
                        <span className="font-semibold text-blue-700">
                            {unit === 'MAD' ? formatCurrency(item[valueKey]) : `${item[valueKey]} ${unit}`}
                        </span>
                    </div>
                )) : <p className="text-sm text-gray-500">Aucune donnée disponible.</p>}
            </div>
        </div>
    );

    return (
        <div>
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">Rapport Annuel (Global)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Revenu Total (TTC)" value={formatCurrency(stats.totalTTC)} icon={<DollarSign size={28} />} colorClass={{ border: 'border-green-200', text: 'text-green-600' }} />
                <StatCard title="Profit Brut (HT - Coûts)" value={formatCurrency(stats.grossProfit)} icon={<TrendingUp size={28} />} colorClass={{ border: 'border-blue-200', text: 'text-blue-600' }} />
                <StatCard title="Marge Brute (%)" value={`${stats.grossMargin.toFixed(1)}%`} icon={<Percent size={28} />} colorClass={{ border: 'border-indigo-200', text: 'text-indigo-600' }} />
                <StatCard title="Articles Vendus" value={stats.totalItemsSold.toString()} icon={<Package size={28} />} colorClass={{ border: 'border-yellow-300', text: 'text-yellow-600' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md text-center"> <p className="text-sm font-medium text-gray-500">Total Ventes (HT)</p> <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalHT)}</p> </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center"> <p className="text-sm font-medium text-gray-500">Total TVA Collectée</p> <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalTVA)}</p> </div>
                <div className="bg-white p-6 rounded-lg shadow-md text-center"> <p className="text-sm font-medium text-gray-500">Coût des March. (HT)</p> <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalCOGS)}</p> </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <ListCard title="Top 5 Produits (par Revenu)" data={topSellersByRevenue} valueKey="revenue" labelKey="nom" unit="MAD" />
                <ListCard title="Top 5 Clients (par Revenu)" data={topCustomersByRevenue} valueKey="revenue" labelKey="name" unit="MAD" />
            </div>
        </div>
    );
};

export default AnnualReport;