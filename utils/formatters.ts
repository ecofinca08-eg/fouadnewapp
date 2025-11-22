
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Define Timestamp type from the compat library
type Timestamp = firebase.firestore.Timestamp;


export const formatCurrency = (amount: number): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        amount = 0;
    }
    return new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD'
    }).format(amount);
};

export const formatDate = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as any);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export const numberToFrenchWords = (n: number): string => {
    if (n === 0) return "zéro";
    
    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
    const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

    const convertGroup = (num: number): string => {
        let str = "";
        if (num >= 100) {
            const h = Math.floor(num / 100);
            if (h > 1) str += units[h] + " cent ";
            else str += "cent ";
            num %= 100;
            if (num === 0 && h > 1) str += "s"; // cents
        }
        
        if (num >= 20) {
            const t = Math.floor(num / 10);
            const u = num % 10;
            
            if (t === 7 || t === 9) {
                str += tens[t - 1] + "-";
                str += (t === 7 && u === 1) ? "et-onze" : teens[u];
            } else {
                str += tens[t];
                if (u > 0) {
                    str += (u === 1 ? "-et-" : "-") + units[u];
                }
            }
        } else if (num >= 10) {
            str += teens[num - 10];
        } else if (num > 0) {
            str += units[num];
        }
        return str.trim();
    };

    // Simple version handling up to thousands for this context
    const intPart = Math.floor(n);
    const decPart = Math.round((n - intPart) * 100);

    let result = "";
    
    if (intPart >= 1000000) {
        result += convertGroup(Math.floor(intPart / 1000000)) + " millions ";
    }
    if (intPart >= 1000) {
        const k = Math.floor((intPart % 1000000) / 1000);
        if (k === 1) result += "mille ";
        else if (k > 1) result += convertGroup(k) + " mille ";
    }
    if (intPart % 1000 > 0) {
        result += convertGroup(intPart % 1000);
    }

    result += " dirhams";

    if (decPart > 0) {
        result += " et " + convertGroup(decPart) + " centimes";
    } else {
        result += " et zéro centime";
    }

    return result.trim();
};
