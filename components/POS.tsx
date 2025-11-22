
import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Trash2, CircleOff, ClipboardList, PackageCheck, FilePlus, X } from 'lucide-react';
// FIX: No longer need v9 imports. Import firebase for Timestamp.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { formatCurrency } from '../utils/formatters';
import type { Product, Customer, Settings, FirebaseContextType, DocumentData } from '../types';

interface POSProps {
    products: Product[];
    customers: Customer[];
    firebaseContext: FirebaseContextType;
    settings: Settings;
    openModal: (title: string, content: React.ReactNode) => void;
    openConfirmModal: (title: string, message: string, onConfirm: () => void) => void;
    onDocumentCreated: () => void;
}

type CartItem = Product & { quantity: number };

const POS: React.FC<POSProps> = ({ products, customers, firebaseContext, settings, openModal, openConfirmModal, onDocumentCreated }) => {
    const { db, userId, appId } = firebaseContext;
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { tvaRate } = settings;

    useEffect(() => {
        const defaultCustomer = customers.find(c => c.nom === 'Client de Passage');
        if (defaultCustomer && !selectedCustomerId) {
            setSelectedCustomerId(defaultCustomer.id);
        }
    }, [customers, selectedCustomerId]);

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            (p.nom.toLowerCase().includes(searchTerm.toLowerCase()) || p.ref.toLowerCase().includes(searchTerm.toLowerCase())) && p.stock > 0
        ), [products, searchTerm]);

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                if (existingItem.quantity < product.stock) {
                    return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
                }
                return prevCart;
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
    };

    const updateCartQuantity = (productId: string, newQuantityStr: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        const newQuantity = parseInt(newQuantityStr);

        if (isNaN(newQuantity) || newQuantity <= 0) {
            setCart(prevCart => prevCart.filter(item => item.id !== productId));
        } else if (newQuantity <= product.stock) {
            setCart(prevCart => prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
        } else {
            setCart(prevCart => prevCart.map(item => item.id === productId ? { ...item, quantity: product.stock } : item));
        }
    };

    const clearCart = () => {
        openConfirmModal('Vider le Panier', 'Êtes-vous sûr de vouloir vider le panier actuel ?', () => setCart([]));
    };

    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.prixVente * item.quantity), 0), [cart]);
    const tva = cartTotal * tvaRate;
    const totalTTC = cartTotal + tva;
    
    const getStatusForType = (type: 'devis' | 'bon' | 'facture'): DocumentData['status'] => {
        switch (type) {
            case 'devis': return 'Brouillon';
            case 'bon': return 'Livré';
            case 'facture': return 'Payée';
        }
    };


    const generateDocument = async (type: 'devis' | 'bon' | 'facture') => {
        if (cart.length === 0) { openModal('Erreur', <p>Votre panier est vide.</p>); return; }
        if (!selectedCustomerId) { openModal('Erreur', <p>Veuillez sélectionner un client.</p>); return; }
        if (!userId) { openModal('Erreur', <p>Utilisateur non authentifié.</p>); return; }

        setIsLoading(true);
        try {
            const customer = customers.find(c => c.id === selectedCustomerId);
            if (!customer) throw new Error("Client non trouvé");

            const newDocument: Omit<DocumentData, 'id'> = {
                type, reference: `${type.toUpperCase()}-${Date.now()}`, date: firebase.firestore.Timestamp.now(),
                customer: { 
                    id: customer.id, 
                    nom: customer.nom, 
                    email: customer.email, 
                    telephone: customer.telephone, 
                    adresse: customer.adresse,
                    ice: customer.ice || '' 
                },
                items: cart.map(({ id, ref, nom, quantity, prixVente }) => ({ id, ref, nom, quantity, prixVente })),
                totalHT: cartTotal, totalTVA: tva, totalTTC, status: getStatusForType(type),
            };

            // FIX: Use Firebase v8 compat Firestore API
            const batch = db.batch();
            const newDocRef = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('documents').doc();
            batch.set(newDocRef, newDocument);

            if (type === 'facture' || type === 'bon') {
                const productsCollection = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('products');
                const productDocs = await productsCollection.where(firebase.firestore.FieldPath.documentId(), 'in', cart.map(item => item.id)).get();
                const currentProducts = productDocs.docs.reduce((acc, doc) => ({ ...acc, [doc.id]: doc.data() as Product }), {} as Record<string, Product>);
                
                let stockIssues: string[] = [];
                for (const item of cart) {
                    if (!currentProducts[item.id] || currentProducts[item.id].stock < item.quantity) {
                        stockIssues.push(`${item.nom} (demandé: ${item.quantity}, dispo: ${currentProducts[item.id]?.stock || 0})`);
                    }
                }
                if (stockIssues.length > 0) throw new Error(`Stock insuffisant pour: ${stockIssues.join(', ')}`);
                
                for (const item of cart) {
                    const productRef = productsCollection.doc(item.id);
                    batch.update(productRef, { stock: firebase.firestore.FieldValue.increment(-item.quantity) });
                }
            }

            await batch.commit();
            setCart([]);
            onDocumentCreated();
        } catch (error: any) {
            console.error("Erreur:", error);
            openModal('Erreur de Stock', <p>{error.message}</p>);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
            <div className="lg:w-3/5 h-full flex flex-col">
                <h2 className="text-3xl font-semibold text-gray-800 mb-6">Caisse</h2>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <input type="text" placeholder="Rechercher un produit..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 pl-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500" />
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="relative md:w-1/3">
                        <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full px-3 py-2 pr-8 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 appearance-none">
                            <option value="" disabled>Sélectionner un client</option>
                            {customers.sort((a, b) => a.nom.localeCompare(b.nom)).map(c => (<option key={c.id} value={c.id}>{c.nom}</option>))}
                        </select>
                        <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
                <div className="flex-1 bg-white shadow-md rounded-lg overflow-y-auto p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (<button key={product.id} onClick={() => addToCart(product)} className="border rounded-lg p-3 text-left hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"> <h4 className="text-sm font-semibold text-gray-800 truncate">{product.nom}</h4> <p className="text-xs text-gray-500">Réf: {product.ref}</p> <p className="text-sm font-bold text-blue-600 mt-2">{formatCurrency(product.prixVente)}</p> <p className="text-xs text-gray-600">Stock: {product.stock}</p> </button>))}
                        {filteredProducts.length === 0 && (<p className="col-span-full text-center text-gray-500 py-6">Aucun produit.</p>)}
                    </div>
                </div>
            </div>
            <div className="lg:w-2/5 h-full flex flex-col bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-center mb-4 border-b pb-3"> <h3 className="text-2xl font-semibold text-gray-800">Panier</h3> {cart.length > 0 && (<button onClick={clearCart} className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"> <Trash2 size={16} /> <span>Vider</span> </button>)} </div>
                <div className="flex-1 overflow-y-auto -mx-6 px-6">
                    {cart.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-gray-500"> <CircleOff size={48} className="mb-4" /> <p>Le panier est vide</p> </div>) : (<div className="space-y-4">{cart.map(item => (<div key={item.id} className="flex items-center space-x-3"> <div className="flex-1"> <p className="text-sm font-medium text-gray-800">{item.nom}</p> <p className="text-xs text-gray-500">{formatCurrency(item.prixVente)}</p> </div> <input type="number" value={item.quantity} onChange={(e) => updateCartQuantity(item.id, e.target.value)} min="1" max={item.stock} className="w-16 text-center px-2 py-1 border rounded-md" /> <p className="text-sm font-semibold text-gray-800 w-24 text-right">{formatCurrency(item.prixVente * item.quantity)}</p> <button onClick={() => updateCartQuantity(item.id, '0')} className="text-red-500 hover:text-red-700 p-1"> <X size={16} /> </button> </div>))}</div>)}
                </div>
                {cart.length > 0 && (<div className="pt-6 border-t mt-4">
                    <div className="space-y-2 text-sm mb-6">
                        <div className="flex justify-between text-gray-600"> <span>Total HT:</span> <span className="font-medium">{formatCurrency(cartTotal)}</span> </div>
                        <div className="flex justify-between text-gray-600"> <span>TVA ({tvaRate * 100}%):</span> <span className="font-medium">{formatCurrency(tva)}</span> </div>
                        <div className="flex justify-between text-xl font-bold text-gray-900 mt-2"> <span>Total TTC:</span> <span>{formatCurrency(totalTTC)}</span> </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <button onClick={() => generateDocument('devis')} disabled={isLoading} className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-yellow-500 text-white rounded-md shadow hover:bg-yellow-600 disabled:opacity-50"> <ClipboardList size={18} /> <span>Devis</span> </button>
                        <button onClick={() => generateDocument('bon')} disabled={isLoading} className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 disabled:opacity-50"> <PackageCheck size={18} /> <span>B. Livraison</span> </button>
                        <button onClick={() => generateDocument('facture')} disabled={isLoading} className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 disabled:opacity-50"> <FilePlus size={18} /> <span>Facture</span> </button>
                    </div>
                    {isLoading && <p className="text-center text-sm text-gray-600 mt-2">Génération en cours...</p>}
                </div>)}
            </div>
        </div>
    );
};

export default POS;
