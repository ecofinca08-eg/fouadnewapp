
import React from 'react';
import { formatCurrency, formatDate, numberToFrenchWords } from '../utils/formatters';
import type { Document, Settings } from '../types';
import { Box } from 'lucide-react';

interface PrintableDocumentProps {
    document: Document;
    settings: Settings;
}

const PrintableDocument: React.FC<PrintableDocumentProps> = ({ document, settings }) => {
    const { companyInfo, tvaRate } = settings;
    const { totalHT, totalTVA, totalTTC } = document;

    // Define styles per document type
    const typeStyles = {
        'devis': {
            label: 'DEVIS',
            text: 'text-amber-700',
            border: 'border-amber-200',
            bg: 'bg-amber-50',
            totalBox: 'bg-amber-600',
            borderDark: 'border-amber-600'
        },
        'bon': {
            label: 'BON DE LIVRAISON',
            text: 'text-blue-700',
            border: 'border-blue-200',
            bg: 'bg-blue-50',
            totalBox: 'bg-blue-600',
            borderDark: 'border-blue-600'
        },
        'facture': {
            label: 'FACTURE',
            text: 'text-emerald-800', 
            border: 'border-emerald-200',
            bg: 'bg-emerald-50',
            totalBox: 'bg-emerald-700',
            borderDark: 'border-emerald-700'
        }
    };

    const currentStyle = typeStyles[document.type] || typeStyles['facture'];

    return (
        <div 
            className="bg-white mx-auto text-slate-800 font-sans shadow-2xl print:shadow-none"
            id={`printable-doc-${document.id}`}
            style={{ 
                width: '210mm', 
                minHeight: '297mm', // Standard A4
                padding: '12mm 15mm', // Standard print margins
                position: 'relative', 
                boxSizing: 'border-box',
                margin: '0 auto',
                backgroundColor: 'white',
                fontSize: '11px', // Reduced base font size
                lineHeight: '1.3'
            }}
        >
            {/* HEADER: Logo & Company Left, Doc Info Right */}
            <div className={`flex justify-between items-start mb-6 border-b pb-4 ${currentStyle.border}`}>
                <div className="flex items-start gap-4 w-[60%]">
                     {companyInfo.logoUrl ? (
                        <img src={companyInfo.logoUrl} alt="Logo" className="h-14 w-auto object-contain mt-1" /> 
                    ) : (
                        <div className="h-12 w-12 bg-slate-800 text-white flex items-center justify-center rounded flex-shrink-0 mt-1">
                            <Box size={24} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-base font-bold text-slate-900 uppercase tracking-tight leading-tight">{companyInfo.nom}</h1>
                        <div className="text-[9px] text-slate-500 mt-1 leading-snug">
                             <p>{companyInfo.adresse}</p>
                             <p>{companyInfo.telephone} {companyInfo.email && `• ${companyInfo.email}`}</p>
                             <p className="mt-0.5 text-slate-400">{companyInfo.website}</p>
                        </div>
                    </div>
                </div>

                <div className="text-right w-[35%]">
                    <h2 className={`text-xl font-extrabold uppercase tracking-widest mb-1 leading-none ${currentStyle.text}`}>
                        {currentStyle.label}
                    </h2>
                    <div className="text-xs space-y-0.5 mt-2">
                        <p><span className="text-slate-400 font-medium uppercase mr-2">N° Réf:</span> <span className="font-bold text-slate-900">{document.reference}</span></p>
                        <p><span className="text-slate-400 font-medium uppercase mr-2">Date:</span> <span className="font-bold text-slate-900">{formatDate(document.date)}</span></p>
                    </div>
                </div>
            </div>

            {/* ADDRESSES GRID */}
            <div className="flex justify-between gap-6 mb-6">
                {/* Left: Company Legal Details (Small) */}
                <div className="w-[45%] pt-1">
                     <div className="text-[8px] text-slate-500 space-y-0.5 border-l-2 border-slate-100 pl-2">
                        <p className="font-semibold text-slate-700 mb-1">{companyInfo.legal}</p>
                        {companyInfo.ice && <p>ICE: {companyInfo.ice}</p>}
                        {companyInfo.rc && <p>RC: {companyInfo.rc}</p>}
                        {companyInfo.patente && <p>Patente: {companyInfo.patente}</p>}
                        {companyInfo.if_fiscal && <p>IF: {companyInfo.if_fiscal}</p>}
                     </div>
                </div>

                {/* Right: Customer Box */}
                <div className="w-[50%] bg-slate-50 rounded border border-slate-200 p-3">
                    <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Client</h3>
                    <div className="text-sm font-bold text-slate-900 leading-tight mb-1">{document.customer.nom}</div>
                    <div className="text-[10px] text-slate-600 leading-snug whitespace-pre-line">
                        {document.customer.adresse || 'Adresse non renseignée'}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[9px] text-slate-500">
                         {document.customer.ice && <div><span className="font-medium">ICE:</span> {document.customer.ice}</div>}
                         {document.customer.telephone && <div><span className="font-medium">Tél:</span> {document.customer.telephone}</div>}
                    </div>
                </div>
            </div>

            {/* ITEMS TABLE */}
            <div className="mb-6">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-slate-800 text-[9px] font-bold uppercase tracking-wider text-slate-800">
                            <th className="py-2 text-left w-[45%]">Désignation</th>
                            <th className="py-2 text-right w-[15%]">Qté</th>
                            <th className="py-2 text-right w-[20%]">Prix Unit. HT</th>
                            <th className="py-2 text-right w-[20%]">Total HT</th>
                        </tr>
                    </thead>
                    <tbody className="text-[10px]">
                        {document.items.map((item, index) => (
                            <tr key={index} className="border-b border-slate-100 last:border-none">
                                <td className="py-1.5 pr-2 align-top">
                                    <p className="font-bold text-slate-800">{item.nom}</p>
                                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">{item.ref}</p>
                                </td>
                                <td className="py-1.5 text-right align-top font-medium">{item.quantity}</td>
                                <td className="py-1.5 text-right align-top">{formatCurrency(item.prixVente)}</td>
                                <td className="py-1.5 text-right align-top font-bold text-slate-900">{formatCurrency(item.prixVente * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* TOTALS & FOOTER AREA */}
            <div className="flex justify-between items-start mt-2">
                {/* Left: Words & Notes */}
                <div className="w-[55%] pr-6">
                    <div className="text-[9px] text-slate-500 mb-2 uppercase tracking-wide">Arrêté la présente facture à la somme de :</div>
                    <div className={`border p-2 rounded text-xs font-bold italic capitalize ${currentStyle.bg} ${currentStyle.border} ${currentStyle.text}`}>
                        {numberToFrenchWords(totalTTC)}
                    </div>
                    
                    {/* Bank Info - Compact */}
                    {companyInfo.rib && (
                        <div className="mt-4 text-[9px] text-slate-500">
                            <span className="font-bold text-slate-700">Mode de paiement:</span> Virement Bancaire<br/>
                            <span className="font-mono bg-slate-50 px-1 rounded mt-1 inline-block">RIB: {companyInfo.rib}</span>
                        </div>
                    )}
                </div>

                {/* Right: Calculation Block */}
                <div className="w-[40%]">
                    <div className="space-y-1 text-[10px]">
                        <div className="flex justify-between py-1">
                            <span className="text-slate-500 font-medium">Total HT</span>
                            <span className="font-bold text-slate-900">{formatCurrency(totalHT)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-200">
                            <span className="text-slate-500 font-medium">TVA ({tvaRate * 100}%)</span>
                            <span className="font-bold text-slate-900">{formatCurrency(totalTVA)}</span>
                        </div>
                        
                        {/* Colored Total Box */}
                        <div className={`flex justify-between items-center py-2 px-3 mt-2 rounded shadow-sm ${currentStyle.totalBox} text-white print:!bg-opacity-100 print:!text-white`}>
                            <span className="font-bold text-xs uppercase opacity-90">Net à Payer</span>
                            <span className="font-extrabold text-lg">{formatCurrency(totalTTC)}</span>
                        </div>
                    </div>
                </div>
            </div>

             {/* Fixed Footer */}
            <div className="absolute bottom-0 left-0 right-0 pb-6 px-12 text-center">
                <div className="border-t border-slate-200 pt-2">
                    <p className="font-bold text-[9px] text-slate-800 mb-1">Merci de votre confiance.</p>
                    <p className="text-[8px] text-slate-400 leading-none">
                         {companyInfo.nom} • {companyInfo.legal}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrintableDocument;
