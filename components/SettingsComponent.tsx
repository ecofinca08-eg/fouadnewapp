
import React, { useState, useEffect } from 'react';
import { Percent, Trash2, AlertTriangle, Save } from 'lucide-react';
// FIX: No longer need v9 imports
// import { doc, setDoc } from 'firebase/firestore';
import type { Settings, FirebaseContextType } from '../types';

interface SettingsComponentProps {
    settings: Settings;
    firebaseContext: FirebaseContextType;
    openModal: (title: string, content: React.ReactNode) => void;
    openConfirmModal: (title: string, message: string, onConfirm: () => void) => void;
}

const SettingsComponent: React.FC<SettingsComponentProps> = ({ settings, firebaseContext, openModal, openConfirmModal }) => {
    const { db, userId, appId } = firebaseContext;
    const [formData, setFormData] = useState<Settings>(settings);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(settings);
    }, [settings]);

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            companyInfo: { ...prev.companyInfo, [name]: value }
        }));
    };

    const handleTvaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rate = parseFloat(e.target.value);
        if (!isNaN(rate)) {
            setFormData(prev => ({ ...prev, tvaRate: rate / 100 }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (!userId) throw new Error("User not authenticated");
            // FIX: Use Firebase v8 compat Firestore API
            const settingsRef = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('config').doc('settings');
            await settingsRef.set(formData);
            openModal('Succès', <p>Paramètres enregistrés avec succès.</p>);
        } catch (error) {
            console.error("Erreur d'enregistrement des paramètres:", error);
            openModal('Erreur', <p>Impossible d'enregistrer les paramètres.</p>);
        }
        setIsSaving(false);
    };

    const handleClearStock = () => {
        openConfirmModal(
            'Attention: Action Irréversible',
            'Êtes-vous sûr de vouloir supprimer TOUS les produits du stock ? Cette action ne peut pas être annulée.',
            async () => {
                setIsSaving(true);
                try {
                    if (!userId) return;
                    const productsRef = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('products');
                    const snapshot = await productsRef.get();
                    
                    if (snapshot.empty) {
                        openModal('Info', <p>Le stock est déjà vide.</p>);
                        setIsSaving(false);
                        return;
                    }

                    const batch = db.batch();
                    snapshot.docs.forEach(doc => {
                        batch.delete(doc.ref);
                    });

                    await batch.commit();
                    openModal('Succès', <p>Le stock a été vidé avec succès.</p>);
                } catch (error) {
                    console.error("Error clearing stock:", error);
                    openModal('Erreur', <p>Une erreur est survenue lors de la suppression.</p>);
                } finally {
                    setIsSaving(false);
                }
            }
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-semibold text-gray-800">Paramètres de l'Entreprise</h2>
                <button 
                    type="submit" 
                    form="settingsForm"
                    disabled={isSaving} 
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
                > 
                    <Save size={18} />
                    <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span> 
                </button>
            </div>
            
            <form id="settingsForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Identité et Coordonnées */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Identité & Coordonnées</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"> <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label> <input type="text" name="nom" value={formData.companyInfo.nom} onChange={handleCompanyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                        <div className="md:col-span-2"> <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label> <textarea name="adresse" value={formData.companyInfo.adresse} onChange={handleCompanyChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea> </div>
                        <div> <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label> <input type="tel" name="telephone" value={formData.companyInfo.telephone} onChange={handleCompanyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                        <div> <label className="block text-sm font-medium text-gray-700 mb-1">Email</label> <input type="email" name="email" value={formData.companyInfo.email} onChange={handleCompanyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                        <div> <label className="block text-sm font-medium text-gray-700 mb-1">Site Web</label> <input type="text" name="website" value={formData.companyInfo.website || ''} onChange={handleCompanyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                        <div> <label className="block text-sm font-medium text-gray-700 mb-1">URL du Logo</label> <input type="text" name="logoUrl" value={formData.companyInfo.logoUrl} onChange={handleCompanyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                    </div>
                </div>

                {/* Informations Légales et Fiscales */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Informations Légales & Fiscales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div> <label className="block text-sm font-medium text-gray-700 mb-1">ICE</label> <input type="text" name="ice" value={formData.companyInfo.ice || ''} onChange={handleCompanyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                        <div> <label className="block text-sm font-medium text-gray-700 mb-1">Identifiant Fiscal (IF)</label> <input type="text" name="if_fiscal" value={formData.companyInfo.if_fiscal || ''} onChange={handleCompanyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                        <div> <label className="block text-sm font-medium text-gray-700 mb-1">Registre de Commerce (RC)</label> <input type="text" name="rc" value={formData.companyInfo.rc || ''} onChange={handleCompanyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                        <div> <label className="block text-sm font-medium text-gray-700 mb-1">CNSS</label> <input type="text" name="cnss" value={formData.companyInfo.cnss || ''} onChange={handleCompanyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                        <div> <label className="block text-sm font-medium text-gray-700 mb-1">Taxe Pro (Patente)</label> <input type="text" name="patente" value={formData.companyInfo.patente || ''} onChange={handleCompanyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                        <div> <label className="block text-sm font-medium text-gray-700 mb-1">RIB / Compte Bancaire</label> <input type="text" name="rib" value={formData.companyInfo.rib || ''} onChange={handleCompanyChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                        <div className="md:col-span-2"> <label className="block text-sm font-medium text-gray-700 mb-1">Forme Juridique / Capital (Légal)</label> <input type="text" name="legal" value={formData.companyInfo.legal} onChange={handleCompanyChange} placeholder="Ex: SARL au capital de 100 000 MAD" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                    </div>
                </div>

                {/* Finances */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Configuration Financière</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taux de TVA (%)</label>
                        <div className="relative max-w-xs"> <input type="number" name="tvaRate" value={formData.tvaRate * 100} onChange={handleTvaChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /> </div>
                    </div>
                </div>

            </form>
            
            <div className="mt-8 border border-red-200 rounded-lg bg-red-50 p-6">
                <h3 className="text-lg font-semibold text-red-800 flex items-center mb-4">
                    <AlertTriangle className="mr-2" size={24} />
                    Zone de Danger
                </h3>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-red-700 font-medium">Vider le Stock</p>
                        <p className="text-red-600 text-sm">Supprime définitivement tous les produits de la base de données.</p>
                    </div>
                    <button 
                        type="button" 
                        onClick={handleClearStock}
                        disabled={isSaving}
                        className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                        <Trash2 size={18} />
                        <span>Supprimer tous les produits</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsComponent;
