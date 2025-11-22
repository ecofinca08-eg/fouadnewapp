
import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
// FIX: No longer need v9 imports
// import { doc, deleteDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import type { Customer, FirebaseContextType } from '../types';

interface CustomerManagementProps {
    customers: Customer[];
    firebaseContext: FirebaseContextType;
    openModal: (title: string | false, content?: React.ReactNode, size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl') => void;
    openConfirmModal: (title: string, message: string, onConfirm: () => void) => void;
}

interface CustomerFormProps {
    initialData?: Customer | null;
    onSave: (formData: Omit<Customer, 'id'> | Customer) => void;
    onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState(
        initialData || { nom: '', email: '', telephone: '', adresse: '', ice: '' }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div> <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet / Raison Sociale</label> <input type="text" name="nom" value={formData.nom} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required /> </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div> <label className="block text-sm font-medium text-gray-700 mb-1">Email</label> <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
                <div> <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label> <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
            </div>
            <div> <label className="block text-sm font-medium text-gray-700 mb-1">ICE (Identifiant Commun de l'Entreprise)</label> <input type="text" name="ice" value={formData.ice || ''} onChange={handleChange} placeholder="Ex: 001234567890000" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> </div>
            <div> <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label> <textarea name="adresse" value={formData.adresse} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea> </div>
            <div className="flex justify-end space-x-3 pt-4"> <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">Annuler</button> <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Enregistrer</button> </div>
        </form>
    );
};

const CustomerManagement: React.FC<CustomerManagementProps> = ({ customers, firebaseContext, openModal, openConfirmModal }) => {
    const { db, userId, appId } = firebaseContext;
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCustomers = useMemo(() =>
        customers.filter(c =>
            c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.ice && c.ice.includes(searchTerm))
        ).sort((a, b) => a.nom.localeCompare(b.nom)), [customers, searchTerm]);

    const confirmDeleteCustomer = (id: string, nom: string) => {
        if (nom === 'Client de Passage') {
            openModal('Action Impossible', <p>Vous ne pouvez pas supprimer le "Client de Passage" par défaut.</p>);
            return;
        }
        openConfirmModal(
            'Supprimer le Client',
            `Êtes-vous sûr de vouloir supprimer le client "${nom}" ?`,
            async () => {
                try {
                    if (!userId) throw new Error("User not authenticated");
                    // FIX: Use Firebase v8 compat Firestore API
                    const customerRef = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('customers').doc(id);
                    await customerRef.delete();
                } catch (error) {
                    console.error("Erreur lors de la suppression du client:", error);
                    openModal('Erreur', <p>Impossible de supprimer le client.</p>);
                }
            }
        );
    };
    
    const handleSaveCustomer = async (formData: Omit<Customer, 'id'> | Customer) => {
        if (!userId) return;
        const customerData = { ...formData };
        try {
            // FIX: Use Firebase v8 compat Firestore API
            if ('id' in customerData && customerData.id) {
                const customerRef = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('customers').doc(customerData.id);
                const { id, ...dataToSave } = customerData;
                await customerRef.set(dataToSave, { merge: true });
            } else {
                const collectionRef = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('customers');
                await collectionRef.add(customerData);
            }
            openModal(false);
        } catch (error) {
            console.error("Erreur lors de l'enregistrement du client:", error);
        }
    };

    const showAddModal = () => openModal('Ajouter un nouveau client', <CustomerForm onSave={handleSaveCustomer} onCancel={() => openModal(false)} />);
    const showEditModal = (customer: Customer) => openModal('Modifier le client', <CustomerForm initialData={customer} onSave={handleSaveCustomer} onCancel={() => openModal(false)} />);

    return (
        <div>
            <div className="flex justify-between items-center mb-6"> <h2 className="text-3xl font-semibold text-gray-800">Gestion des Clients</h2> <button onClick={showAddModal} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors"> <Plus size={20} /> <span>Nouveau Client</span> </button> </div>
            <div className="mb-4 relative"> <input type="text" placeholder="Rechercher un client (par nom, email ou ICE)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /> <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /> </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th scope="col" className="px-6 py-3 font-medium">Nom</th>
                                <th scope="col" className="px-6 py-3 font-medium">ICE</th>
                                <th scope="col" className="px-6 py-3 font-medium">Email</th>
                                <th scope="col" className="px-6 py-3 font-medium">Téléphone</th>
                                <th scope="col" className="px-6 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{customer.nom}</td>
                                    <td className="px-6 py-4">{customer.ice || '-'}</td>
                                    <td className="px-6 py-4">{customer.email}</td>
                                    <td className="px-6 py-4">{customer.telephone}</td>
                                    <td className="px-6 py-4 flex space-x-2"> <button onClick={() => showEditModal(customer)} className="text-blue-600 hover:text-blue-800 p-1" title="Modifier"> <Edit size={18} /> </button> <button onClick={() => confirmDeleteCustomer(customer.id, customer.nom)} className="text-red-600 hover:text-red-800 p-1" title="Supprimer"> <Trash2 size={18} /> </button> </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredCustomers.length === 0 && (<p className="text-center text-gray-500 py-6">Aucun client trouvé.</p>)}
            </div>
        </div>
    );
};

export default CustomerManagement;
