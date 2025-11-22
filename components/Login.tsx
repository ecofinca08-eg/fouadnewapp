
import React, { useState } from 'react';
// FIX: Import firebase.auth.Auth type for v8 compat
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { AlertCircle, UserPlus, LogIn, Info } from 'lucide-react';

interface LoginProps {
    // FIX: Use firebase.auth.Auth type for v8 compat
    auth: firebase.auth.Auth;
    db: firebase.firestore.Firestore;
    appId: string;
}

const Login: React.FC<LoginProps> = ({ auth, db, appId }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isRegistering) {
                // 1. Create Auth User ONLY. Profile creation is handled by App.tsx onAuthStateChanged.
                await auth.createUserWithEmailAndPassword(email, password);
            } else {
                // Login
                await auth.signInWithEmailAndPassword(email, password);
            }
            // onAuthStateChanged in App.tsx will handle the redirect and permission check
        } catch (err: any) {
            // Log for dev only
            console.error('Authentication Error Code:', err?.code, err?.message);

            let userMessage = "Une erreur technique est survenue. Veuillez réessayer.";

            if (err && err.code) {
                switch (err.code) {
                    case 'auth/invalid-email':
                        userMessage = 'L\'adresse e-mail n\'est pas valide.';
                        break;
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                    case 'auth/invalid-login-credentials': // Newer firebase versions
                        userMessage = 'Email ou mot de passe incorrect.';
                        break;
                    case 'auth/email-already-in-use':
                        userMessage = 'Cette adresse e-mail est déjà utilisée par un autre compte.';
                        break;
                    case 'auth/weak-password':
                        userMessage = 'Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.';
                        break;
                    case 'auth/user-disabled':
                        userMessage = 'Ce compte a été désactivé.';
                        break;
                    case 'auth/too-many-requests':
                        userMessage = 'Trop de tentatives échouées. Veuillez patienter quelques minutes.';
                        break;
                    case 'auth/network-request-failed':
                        userMessage = 'Problème de connexion internet. Vérifiez votre réseau.';
                        break;
                    default:
                        userMessage = "Impossible de se connecter. Vérifiez vos informations.";
                }
            }
            
            setError(userMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="flex flex-col items-center justify-center mb-6">
                     <div className="p-4 bg-slate-900 rounded-2xl shadow-lg mb-4">
                        <svg className="h-12 w-12 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 18V6H9.75L12 9.75L14.25 6H18V18H15V10.5L12 15L9 10.5V18H6Z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        MedoApp
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Gestion Commerciale</p>
                </div>
                
                <div>
                    <h3 className="text-xl font-bold text-center text-gray-800 mb-6">
                        {isRegistering ? 'Créer un nouveau compte' : 'Connexion'}
                    </h3>
                </div>

                {isRegistering && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex items-start gap-3">
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>Les nouveaux comptes nécessitent une validation par un administrateur avant activation.</p>
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleAuthAction}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                            Adresse e-mail
                        </label>
                        <div className="relative">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="votre@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password"className="block text-sm font-semibold text-gray-700 mb-1">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                            <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Traitement...
                                </span>
                            ) : (isRegistering ? (
                                <>
                                    <UserPlus size={18} className="mr-2" />
                                    Créer le compte
                                </>
                            ) : (
                                <>
                                    <LogIn size={18} className="mr-2" />
                                    Se connecter
                                </>
                            ))}
                        </button>
                    </div>
                </form>
                
                <div className="pt-2 border-t border-gray-100">
                    <p className="text-sm text-center text-gray-600">
                        {isRegistering ? 'Vous avez déjà un compte ?' : "Vous n'avez pas de compte ?"}
                        <button
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError(null);
                            }}
                            className="ml-2 font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                        >
                            {isRegistering ? 'Se connecter' : "S'inscrire"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
