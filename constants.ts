
import type { Product, Customer, Settings } from './types';

export const exampleCustomer: Omit<Customer, 'id'> = {
    nom: 'Client de Passage',
    email: 'contact@client.com',
    telephone: 'N/A',
    adresse: 'Comptoir',
    ice: ''
};

export const defaultSettings: Settings = {
    companyInfo: {
        nom: "OULAD ALLOU",
        adresse: "RUE 58 N° 3005 1ER ETAGE HAY EL AMAL, KÉNITRA",
        email: "",
        telephone: "",
        website: "",
        legal: "SARL AU au capital de 100 000,00 MAD",
        logoUrl: "",
        ice: "003435101000084",
        rc: "79999",
        if_fiscal: "",
        cnss: "",
        patente: "",
        rib: ""
    },
    tvaRate: 0.20
};
