
import React, { useState, useEffect } from 'react';
// FIX: Use Firebase v8 compat imports
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { AlertTriangle, LogOut, Clock, Lock } from 'lucide-react';
import type { Product, Customer, Document, Settings, FirebaseContextType, View } from './types';
import { exampleCustomer, defaultSettings } from './constants';
import AppSidebar from './components/AppSidebar';
import Dashboard from './components/Dashboard';
import StockManagement from './components/StockManagement';
import CustomerManagement from './components/CustomerManagement';
import POS from './components/POS';
import DocumentList from './components/DocumentList';
import AnnualReport from './components/AnnualReport';
import SettingsComponent from './components/SettingsComponent';
import Modal from './components/Modal';
import ConfirmationModal from './components/ConfirmationModal';
import Login from './components/Login';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlXxm-OYuG8w3LZf2w2k9wB1r2Z_k5Hf8",
  authDomain: "medoapp---abdo.firebaseapp.com",
  projectId: "medoapp---abdo",
  storageBucket: "medoapp---abdo.firebasestorage.app",
  messagingSenderId: "224747133866",
  appId: "1:224747133866:web:398b0d08b0c837248d29d3"
};

const appId = firebaseConfig.appId;

export default function App() {
    const [view, setView] = useState<View>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [firebaseContext, setFirebaseContext] = useState<FirebaseContextType | null>(null);
    const [modal, setModal] = useState({ isOpen: false, title: '', content: null as React.ReactNode, size: 'lg' as 'sm' | 'md' | 'lg' | 'xl' | '2xl' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    const [initializationError, setInitializationError] = useState<string | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState<'approved' | 'pending' | 'unknown'>('unknown');

    useEffect(() => {
        try {
            if (!firebaseConfig.apiKey) { 
                const errorMsg = "Configuration Firebase manquante. L'application ne peut pas se connecter.";
                console.error(errorMsg);
                setInitializationError(errorMsg);
                return;
            }
            
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
                firebase.firestore().enablePersistence()
                    .catch((err) => console.warn("Persistence error:", err.code));
            }
            const auth = firebase.auth();
            const db = firebase.firestore();

            let userProfileUnsubscribe = () => {};

            const authUnsubscribe = auth.onAuthStateChanged(async (user) => {
                userProfileUnsubscribe();

                if (user) {
                    const userDocRef = db.collection('artifacts').doc(appId).collection('users').doc(user.uid);
                    
                    try {
                        // 1. Check profile
                        const userDoc = await userDocRef.get();
                        const userData = userDoc.exists ? userDoc.data() : undefined;

                        // 2. FAILSAFE: Check if user has existing products (Legacy User / Owner)
                        const productsCheck = await userDocRef.collection('products').limit(1).get();
                        const hasLegacyData = !productsCheck.empty;

                        // 3. Determine Status
                        let isApproved = userData?.isApproved === true;

                        // Force approval for legacy users immediately in local state
                        if (hasLegacyData) {
                            isApproved = true;
                            setApprovalStatus('approved'); // Immediate access
                        } else if (isApproved) {
                            setApprovalStatus('approved');
                        } else {
                            setApprovalStatus('pending');
                        }

                        // 4. Set Context early
                        setFirebaseContext({ db, auth, userId: user.uid, isAuthReady: true, appId });

                        // 5. Background Updates (Database Sync)
                        if (!userDoc.exists) {
                            // New User
                            const usersSnapshot = await db.collection('artifacts').doc(appId).collection('users').limit(1).get();
                            const isFirstUser = usersSnapshot.empty; // First user ever is admin/approved
                            
                            await userDocRef.set({
                                email: user.email,
                                isApproved: isFirstUser,
                                role: isFirstUser ? 'admin' : 'user',
                                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                            });
                            
                            if (isFirstUser) setApprovalStatus('approved');

                        } else {
                            // Existing User
                            const updates: any = {
                                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                            };

                            // If legacy user was stuck in pending in DB, fix it in DB now
                            if (hasLegacyData && userData?.isApproved !== true) {
                                updates.isApproved = true;
                                updates.role = 'admin';
                            }

                            await userDocRef.update(updates).catch(e => console.warn("Update failed", e));
                        }

                        // 6. Listen for Status Changes (for real-time approval)
                        userProfileUnsubscribe = userDocRef.onSnapshot((snapshot) => {
                            const currentData = snapshot.data();
                            if (currentData?.isApproved === true) {
                                setApprovalStatus('approved');
                            } else if (!hasLegacyData) {
                                setApprovalStatus('pending');
                            }
                        });

                    } catch (error) {
                        console.error("Auth flow error:", error);
                    }
                } else {
                    setFirebaseContext({ db, auth, userId: null, isAuthReady: true, appId });
                    setApprovalStatus('unknown');
                    setIsDataLoaded(false);
                }
            });
            
            return () => {
                authUnsubscribe();
                userProfileUnsubscribe();
            };
        } catch (e: any) {
            setInitializationError(e.message);
        }
    }, []);

    useEffect(() => {
        if (!firebaseContext?.isAuthReady || !firebaseContext?.userId || approvalStatus !== 'approved') return;
        const { db, userId } = firebaseContext;

        const seedData = async () => {
            try {
                const settingsRef = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('config').doc('settings');
                const settingsDoc = await settingsRef.get();

                if (!settingsDoc.exists) {
                    const batch = db.batch();
                    batch.set(settingsRef, defaultSettings);
                    const customerRef = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('customers').doc();
                    batch.set(customerRef, exampleCustomer);
                    await batch.commit();
                }
            } catch (error) { console.error("Seeding Error:", error); }
        };
        seedData();
    }, [firebaseContext?.isAuthReady, firebaseContext?.userId, approvalStatus]);

    useEffect(() => {
        if (!firebaseContext?.isAuthReady || !firebaseContext?.userId || approvalStatus !== 'approved') return;
        const { db, userId } = firebaseContext;

        const unsub = (path: string, setter: (data: any[]) => void) => db.collection('artifacts').doc(appId).collection('users').doc(userId).collection(path).onSnapshot(
            (snapshot) => setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
            (error) => console.error(`Listener Error on ${path}:`, error)
        );

        const settingsUnsub = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('config').doc('settings').onSnapshot((doc) => {
            setSettings(doc.exists ? doc.data() as Settings : defaultSettings);
            setIsDataLoaded(true);
        });

        const productsUnsub = unsub('products', setProducts);
        const customersUnsub = unsub('customers', setCustomers);
        const documentsUnsub = unsub('documents', (data) => setDocuments(data as Document[]));

        return () => { productsUnsub(); customersUnsub(); documentsUnsub(); settingsUnsub(); };
    }, [firebaseContext?.isAuthReady, firebaseContext?.userId, approvalStatus]);

    const handleSignOut = async () => {
        if (firebaseContext?.auth) {
            try {
                await firebaseContext.auth.signOut();
                setIsDataLoaded(false); 
                setApprovalStatus('unknown');
            } catch (error) {
                console.error("Error signing out:", error);
            }
        }
    };

    const handleOpenModal = (title: string | false, content: React.ReactNode = null, size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'lg') => {
        setModal(title === false ? { isOpen: false, title: '', content: null, size: 'lg' } : { isOpen: true, title, content, size });
    };

    const handleOpenConfirmModal = (title: string, message: string, onConfirm: () => void) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm: () => { onConfirm(); setConfirmModal({ ...confirmModal, isOpen: false }); } });
    };

    const handleCloseConfirmModal = () => setConfirmModal({ ...confirmModal, isOpen: false });

    if (initializationError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-4 bg-gray-50">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-red-600">Erreur de Connexion</h3>
                <p className="text-lg text-gray-600 mt-2">{initializationError}</p>
            </div>
        );
    }

    if (!firebaseContext?.isAuthReady) {
        return <div className="flex items-center justify-center h-screen bg-gray-50"><p className="text-lg text-gray-600 animate-pulse">Chargement de MedoApp...</p></div>;
    }

    if (!firebaseContext.userId) {
        const auth = firebase.auth();
        const db = firebase.firestore();
        return <Login auth={auth} db={db} appId={appId} />;
    }

    if (approvalStatus === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-white/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-yellow-500"></div>
                    
                    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-50 mb-6 shadow-inner">
                        <Lock className="h-10 w-10 text-yellow-600" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Compte en Attente</h2>
                    <p className="text-slate-500 mb-8">
                        Votre demande d'inscription a bien été reçue. Un administrateur doit valider votre compte avant que vous puissiez accéder au système.
                    </p>
                    
                    <div className="bg-slate-50 p-5 rounded-xl mb-8 text-left border border-slate-100">
                        <div className="flex items-start space-x-3">
                             <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                             <div>
                                 <p className="text-sm text-slate-800 font-semibold">Statut : En cours d'examen</p>
                                 <p className="text-xs text-slate-500 mt-1">L'accès sera débloqué automatiquement après validation.</p>
                             </div>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleSignOut}
                        className="w-full flex justify-center items-center px-4 py-3 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Se déconnecter
                    </button>
                </div>
                <p className="mt-6 text-xs text-slate-400">MedoApp Security System</p>
            </div>
        );
    }
    
    if (!isDataLoaded) {
        return <div className="flex items-center justify-center h-screen bg-gray-50"><p className="text-lg text-gray-600 animate-pulse">Synchronisation des données...</p></div>;
    }
    
    const commonProps = { firebaseContext, openModal: handleOpenModal, openConfirmModal: handleOpenConfirmModal };
    const currentView = () => {
        switch (view) {
            case 'dashboard': return <Dashboard products={products} customers={customers} documents={documents} setView={setView} />;
            case 'stock': return <StockManagement products={products} {...commonProps} />;
            case 'customers': return <CustomerManagement customers={customers} {...commonProps} />;
            case 'pos': return <POS products={products} customers={customers} settings={settings} onDocumentCreated={() => setView('documents')} {...commonProps} />;
            case 'documents': return <DocumentList documents={documents} settings={settings} onDocumentCreated={() => setView('documents')} products={products} {...commonProps} />;
            case 'reports': return <AnnualReport documents={documents} products={products} settings={settings} />;
            case 'settings': return <SettingsComponent settings={settings} firebaseContext={firebaseContext} openModal={handleOpenModal} openConfirmModal={handleOpenConfirmModal} />;
            default: return <Dashboard products={products} customers={customers} documents={documents} setView={setView} />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <AppSidebar 
                view={view} 
                setView={setView} 
                userId={firebaseContext.userId} 
                isSidebarOpen={isSidebarOpen} 
                setIsSidebarOpen={setIsSidebarOpen}
                handleSignOut={handleSignOut}
            />
            <main id="app-main-content" className="flex-1 overflow-y-auto p-8">
                {currentView()}
            </main>
            <Modal isOpen={modal.isOpen} onClose={() => handleOpenModal(false)} title={modal.title} size={modal.size}>{modal.content}</Modal>
            <ConfirmationModal isOpen={confirmModal.isOpen} onClose={handleCloseConfirmModal} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} />
        </div>
    );
}
