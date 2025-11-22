
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

    const docTypeLabel: Record<string, string> = { 
        'devis': 'DEVIS', 
        'bon': 'BON DE LIVRAISON', 
        'facture': 'FACTURE' 
    };

    return (
        <div 
            className="bg-white mx-auto text-slate-800 font-sans shadow-2xl print:shadow-none"
            id={`printable-doc-${document.id}`}
            style={{ 
                width: '210mm', 
                minHeight: '290mm', // Reduced to 290mm to ensure safety margin on A4 (297mm)
                padding: '0', 
                position: 'relative', 
                boxSizing: 'border-box',
                margin: '0 auto',
                backgroundColor: 'white'
            }}
        >
            <div className="p-8"> {/* Reduced padding from 12mm to 8 (2rem) */}
                {/* 1. HEADER */}
                <div className="flex justify-between items-start mb-8"> {/* Reduced mb-12 to mb-8 */}
                    {/* Left: Company Identity (Logo ABOVE Name) */}
                    <div className="w-1/2">
                        <div className="inline-flex flex-col items-center justify-center bg-slate-50 px-6 py-4 rounded-sm border border-slate-100 shadow-sm min-w-[200px]">
                            <div className="mb-3">
                                {companyInfo.logoUrl ? (
                                    <img src={companyInfo.logoUrl} alt="Logo" className="h-40 w-auto object-contain" />
                                ) : (
                                    <div className="h-24 w-24 bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md">
                                        <Box size={48} />
                                    </div>
                                )}
                            </div>
                            <h1 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide leading-none text-center">
                                {companyInfo.nom}
                            </h1>
                        </div>
                        
                        <div className="mt-4 text-sm text-slate-500 space-y-1 pl-2 border-l-2 border-blue-600 ml-2">
                            <p className="font-medium text-slate-700 max-w-[250px]">{companyInfo.adresse}</p>
                            {companyInfo.email && <p>{companyInfo.email}</p>}
                            {companyInfo.telephone && <p>{companyInfo.telephone}</p>}
                        </div>
                    </div>

                    {/* Right: Document Details & Banner */}
                    <div className="w-[45%] flex flex-col items-end pt-2">
                        <div className="bg-slate-900 text-white px-6 py-3 shadow-md mb-6 w-full text-center rounded-sm">
                            <h2 className="text-2xl font-bold uppercase tracking-[0.2em]">
                                {docTypeLabel[document.type]}
                            </h2>
                        </div>
                        <div className="w-full pr-1 space-y-2">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">N° Référence</span>
                                <span className="text-slate-900 font-bold text-lg">{document.reference}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                                <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">Date d'émission</span>
                                <span className="text-slate-900 font-bold text-lg">{formatDate(document.date)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. CUSTOMER INFO SECTION */}
                <div className="flex justify-between gap-8 mb-10 bg-slate-50 p-5 rounded-sm border border-slate-100">
                    {/* De (From) */}
                    <div className="w-1/2 border-r border-slate-200 pr-4">
                        <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Émetteur</h3>
                        <div className="text-sm text-slate-600">
                            <p className="font-bold text-slate-900 text-base mb-1">{companyInfo.nom}</p>
                            <p className="text-xs text-slate-500 italic mb-2">{companyInfo.legal}</p>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                                {companyInfo.ice && <p><span className="font-semibold">ICE:</span> {companyInfo.ice}</p>}
                                {companyInfo.rc && <p><span className="font-semibold">RC:</span> {companyInfo.rc}</p>}
                                {companyInfo.patente && <p><span className="font-semibold">Patente:</span> {companyInfo.patente}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Facturé à (To) */}
                    <div className="w-1/2 pl-2">
                        <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Destinataire</h3>
                        <div>
                            <p className="text-lg font-bold text-slate-900">{document.customer.nom}</p>
                            <p className="text-sm text-slate-600 whitespace-pre-line mb-2">{document.customer.adresse || 'Adresse non renseignée'}</p>
                            <div className="text-xs text-slate-500 space-y-1">
                                {document.customer.ice && <p><span className="font-semibold">ICE:</span> {document.customer.ice}</p>}
                                {document.customer.email && <p>{document.customer.email}</p>}
                                {document.customer.telephone && <p>{document.customer.telephone}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. ITEMS TABLE */}
                <div className="mb-8">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="py-2 px-3 text-left text-xs font-bold uppercase tracking-wider w-[45%] rounded-tl-sm">Désignation</th>
                                <th className="py-2 px-3 text-right text-xs font-bold uppercase tracking-wider w-[15%]">Quantité</th>
                                <th className="py-2 px-3 text-right text-xs font-bold uppercase tracking-wider w-[20%]">Prix Unit. HT</th>
                                <th className="py-2 px-3 text-right text-xs font-bold uppercase tracking-wider w-[20%] rounded-tr-sm">Total HT</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {document.items.map((item, index) => (
                                <tr key={index} className="border-b border-slate-200 last:border-none hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-3">
                                        <p className="font-bold text-slate-800">{item.nom}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Réf: {item.ref}</p>
                                    </td>
                                    <td className="py-3 px-3 text-right font-medium text-slate-700">{item.quantity}</td>
                                    <td className="py-3 px-3 text-right font-medium text-slate-700">{formatCurrency(item.prixVente)}</td>
                                    <td className="py-3 px-3 text-right font-bold text-slate-900">{formatCurrency(item.prixVente * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 4. TOTALS & PAYMENT INFO */}
                <div className="flex justify-end mt-4">
                    <div className="w-5/12">
                        <div className="space-y-2">
                            <div className="flex justify-between py-1 text-sm">
                                <span className="text-slate-500 font-medium">Total HT</span>
                                <span className="font-bold text-slate-800">{formatCurrency(totalHT)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm border-b border-slate-200 pb-2">
                                <span className="text-slate-500 font-medium">TVA ({tvaRate * 100}%)</span>
                                <span className="font-bold text-slate-800">{formatCurrency(totalTVA)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-blue-600 text-white p-3 rounded-sm shadow-sm mt-2">
                                <span className="text-sm font-bold uppercase tracking-wide">Net à Payer TTC</span>
                                <span className="text-xl font-extrabold">{formatCurrency(totalTTC)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. AMOUNT IN WORDS */}
                <div className="mt-8 pt-6 border-t-2 border-slate-100">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Arrêté la présente facture à la somme de :</p>
                    <p className="text-base font-bold text-slate-800 italic capitalize bg-slate-50 p-3 rounded-sm inline-block border border-slate-100">
                        {numberToFrenchWords(totalTTC)}
                    </p>
                </div>
            </div>

            {/* 6. FOOTER */}
            <div className="absolute bottom-0 left-0 right-0 bg-white px-8 py-6 text-center border-t border-slate-200">
                 <p className="text-sm font-bold text-slate-800 mb-2">Merci de votre confiance.</p>
                 <div className="text-[9px] text-slate-500 uppercase tracking-wider leading-relaxed space-y-1">
                    <p>{companyInfo.nom} - {companyInfo.legal}</p>
                    <p>
                        {companyInfo.rc && `RC: ${companyInfo.rc} • `}
                        {companyInfo.patente && `Patente: ${companyInfo.patente} • `}
                        {companyInfo.if_fiscal && `IF: ${companyInfo.if_fiscal} • `}
                        {companyInfo.ice && `ICE: ${companyInfo.ice}`}
                    </p>
                    {companyInfo.rib && (
                        <p className="font-medium text-slate-600 mt-1">RIB: {companyInfo.rib}</p>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default PrintableDocument;
