// src/components/FavoriteButton.tsx
"use client";
import { useState, useCallback } from 'react';
import { Heart, Loader2 } from 'lucide-react';
// ✅ التعديل: استيراد الرابط من ملف الإعدادات
import { API_URL } from "@/lib/config";

interface FavoriteButtonProps {
  listingId: number;
  isInitialFavorite: boolean; // الحالة الأولية القادمة من الباك إند
}

export default function FavoriteButton({ listingId, isInitialFavorite }: FavoriteButtonProps) {
  // state داخلي لإدارة حالة الزرار
  const [isFavorite, setIsFavorite] = useState(isInitialFavorite);
  const [loading, setLoading] = useState(false);
  
  // نستخدم useCallback لمنع إعادة إنشاء الدالة عند كل render
  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); // منع أي سلوك افتراضي (زي فتح اللينك لو كان الزرار جزء من كارت)
    e.stopPropagation(); // منع انتقال الحدث للكارد الأب

    const token = localStorage.getItem('token');
    if (!token) {
        alert("يجب تسجيل الدخول أولاً لإضافة عقار للمفضلة.");
        return;
    }

    setLoading(true);
    try {
        // ✅ استخدام المتغير المستورد
        const res = await fetch(`${API_URL}/favorites/toggle/`, {
            method: 'POST',
            headers: { 
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ listing_id: listingId })
        });

        if (res.ok) {
            const data = await res.json();
            // تحديث حالة الزرار بناءً على استجابة الباك إند
            setIsFavorite(data.is_favorite); 
        } else if (res.status === 401) {
             alert("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى.");
        } else {
             alert("حدث خطأ أثناء حفظ المفضلة.");
        }
    } catch (error) {
        console.error("Toggle Favorite Error:", error);
        alert("فشل الاتصال بالخادم.");
    } finally {
        setLoading(false);
    }
  }, [listingId]); // يتم إعادة إنشاء الدالة فقط إذا تغير الـ listingId

  const buttonClass = `
    p-2 rounded-full shadow-lg transition-all duration-200 
    ${isFavorite 
        ? 'bg-red-600 text-white hover:bg-red-700' 
        : 'bg-white text-gray-400 hover:text-red-500 hover:bg-gray-100'
    }
  `;

  return (
    <button 
        onClick={handleToggleFavorite} 
        disabled={loading}
        className={buttonClass}
        aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : 'fill-none'}`} />
      )}
    </button>
  );
}