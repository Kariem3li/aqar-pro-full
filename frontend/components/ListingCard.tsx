// src/components/ListingCard.tsx (الكود المصحح)
"use client";
import { Heart, MapPin, Phone, MessageCircle, BadgeCheck, Ruler, CheckCircle2 } from "lucide-react";
// 🚨 لم يعد هناك حاجة لـ useState في هذا المكون
// import { useState } from "react"; 
import FavoriteButton from './FavoriteButton'; 

interface ListingProps {
    id: number; // 👈 إضافة الـ ID ضرورية لعمل زر المفضلة
    title: string;
    price: string;
    address: string;
    image: string;
    offerType: "بيع" | "إيجار";
    isFinanceEligible: boolean;
    isSold: boolean;
    features: { label: string; value: string }[];
    is_favorite: boolean; // 👈 استقبال حالة المفضلة
}

export default function ListingCard({ 
    id, title, price, address, image, offerType, isFinanceEligible, isSold, features, is_favorite 
}: ListingProps) {
    // 🚨 تم حذف: const [isFavorite, setIsFavorite] = useState(false);

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full relative group hover:shadow-xl transition duration-300">
            
            {/* طبقة "تم البيع" */}
            {isSold && (
                <div className="absolute inset-0 z-20 bg-gray-900/60 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-red-600 text-white px-8 py-2 rounded-full font-bold text-lg shadow-2xl transform -rotate-12 border-4 border-white">
                        🚫 تم البيع
                    </div>
                </div>
            )}

            {/* صورة العقار */}
            <div className="h-56 bg-gray-200 relative overflow-hidden">
                <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt={title} />
                
                {/* بادج الحالة */}
                <span className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg text-white ${
                    offerType === 'بيع' 
                    ? 'bg-slate-900' 
                    : 'bg-orange-600' 
                }`}>
                    {offerType}
                </span>

                {/* 🎯 زر المفضلة الديناميكي 🎯 */}
                <div className="absolute top-4 left-4 z-10">
                    <FavoriteButton 
                        listingId={id} 
                        isInitialFavorite={is_favorite} 
                    />
                </div>

                {/* 2. بادج التمويل (تعديل: نقل المكان لأسفل اليمين) */}
                {isFinanceEligible && (
                    <span className="absolute bottom-4 right-4 bg-green-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" /> تمويل عقاري
                    </span>
                )}
            </div>

            {/* التفاصيل */}
            <div className="p-5 flex-1 flex flex-col">
                {/* السعر */}
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-black text-slate-900 whitespace-nowrap">{price} <span className="text-xs font-normal text-gray-400">ج.م</span></h3>
                </div>
                
                {/* العنوان */}
                <h3 className="text-base font-bold text-gray-800 line-clamp-1 mb-1">{title}</h3>
                <div className="flex items-start text-gray-500 text-xs mb-4 min-h-[2.5em]">
                    <MapPin className="w-3 h-3 ml-1 mt-0.5 shrink-0" /> 
                    <span className="line-clamp-2">{address}</span>
                </div>
                
                {/* شريط المزايا الديناميكي */}
                <div className="flex flex-wrap gap-2 mb-5 border-t border-b border-gray-50 py-3 mt-auto">
                    {features.map((feat, index) => (
                        <div key={index} className="flex items-center gap-1 text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap border border-gray-100">
                            {feat.label.includes("مساحة") ? <Ruler className="w-3 h-3 text-amber-500"/> : <CheckCircle2 className="w-3 h-3 text-amber-600"/>}
                            {feat.value === "نعم" ? feat.label : feat.value}
                        </div>
                    ))}
                </div>
                
                {/* أزرار التواصل */}
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        disabled={isSold} 
                        className="group/btn flex items-center justify-center gap-2 bg-white text-[#25D366] border border-[#25D366] py-3 rounded-xl font-bold text-sm hover:bg-[#25D366] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MessageCircle className="w-4 h-4 transition-colors group-hover/btn:text-white" /> 
                        واتساب
                    </button>

                    <button 
                        disabled={isSold} 
                        className="group/btn flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-600 py-3 rounded-xl font-bold text-sm hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Phone className="w-4 h-4 transition-colors group-hover/btn:text-white" /> 
                        اتصال
                    </button>
                </div>
            </div>
        </div>
    );
}