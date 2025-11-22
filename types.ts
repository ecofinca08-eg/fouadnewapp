
// FIX: Use Firebase v8 compat type imports
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

export interface Product {
  id: string;
  ref: string;
  nom: string;
  description: string;
  prixAchat: number;
  prixVente: number;
  stock: number;
}

export interface Customer {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ice?: string;
}

export interface DocumentItem {
  id: string;
  ref: string;
  nom: string;
  quantity: number;
  prixVente: number;
}

export interface DocumentData {
  type: 'devis' | 'bon' | 'facture';
  reference: string;
  // FIX: Use Firebase v8 compat Timestamp type
  date: firebase.firestore.Timestamp;
  customer: Omit<Customer, 'id'> & { id: string }; // Ensure customer has id
  items: DocumentItem[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  status: 'Brouillon' | 'Converti' | 'Payée' | 'Annulée' | 'Livré';
  devisRef?: string;
}

export interface Document extends DocumentData {
  id: string;
}


export interface CompanyInfo {
    nom: string;
    adresse: string;
    email: string;
    telephone: string;
    website?: string;
    logoUrl: string;
    ice?: string;
    rc?: string;
    if_fiscal?: string;
    cnss?: string;
    patente?: string;
    rib?: string;
    legal: string; // Keep for backward compatibility or general notes
}

export interface Settings {
    companyInfo: CompanyInfo;
    tvaRate: number;
}

export interface FirebaseContextType {
    // FIX: Use Firebase v8 compat types
    db: firebase.firestore.Firestore;
    auth: firebase.auth.Auth;
    userId: string | null;
    isAuthReady: boolean;
    appId: string;
}

export type View = 'dashboard' | 'stock' | 'customers' | 'pos' | 'documents' | 'reports' | 'settings';
