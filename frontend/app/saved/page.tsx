"use client";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { Loader2, Heart, MapPin, DollarSign, AlertCircle, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// ✅ التعديل: استيراد الرابط ودالة الصور من ملف الإعدادات
import { API_URL, getFullImageUrl } from "@/lib/config";

export default function SavedListings() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Favorites
  const fetchFavorites = async () => {
    const token = localStorage.getItem('token');
    if (!token) { 
        setLoading(false);
        router.push('/login'); 
        return; 
    }

    try {
      // ✅ استخدام المتغير المستورد
      const res = await fetch(`${API_URL}/favorites/`, {
        headers: { "Authorization": `Token ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);
  
  // 2. Handle Removal (Toggle)
  const handleRemoveFavorite = async (listingId: number) => {
    if (!confirm("هل أنت متأكد من إزالة هذا الإعلان من المفضلة؟")) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/favorites/toggle/`, {
        method: 'POST',
        headers: { 
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({ listing_id: listingId })
      });

      if (res.ok) {
        setListings(listings.filter(item => item.id !== listingId));
      } else {
        alert("فشل الإزالة.");
      }
    } catch (error) {
      alert("فشل الاتصال.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-400 w-8 h-8"/></div>;

  return (
    <main className="min-h-screen bg-slate-50 pb-28 font-sans">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-slate-900 text-white pt-24 pb-16 px-4 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                <Heart className="w-8 h-8 text-amber-500 fill-amber-500"/> المفضلة
            </h1>
            <p className="text-slate-400 text-sm">الإعلانات التي أعجبتك ({listings.length})</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-20">
        
        {listings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl shadow-xl border border-gray-100 mt-6">
                <Heart className="w-10 h-10 text-red-400 mx-auto mb-4" fill="#fca5a5"/>
                <h3 className="font-bold text-slate-800 text-lg">لا توجد إعلانات محفوظة</h3>
                <p className="text-gray-500 text-sm mt-2">ابدأ تصفح العقارات وأضف ما يعجبك.</p>
                <Link href="/" className="text-amber-600 font-bold mt-4 inline-block underline">العودة للرئيسية</Link>
            </div>
        ) : (
            <div className="space-y-4 mt-6">
                {listings.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-md flex gap-4 transition hover:shadow-lg group">
                        
                        {/* الصورة */}
                        <Link href={`/listings/${item.id}`} className="w-28 h-28 bg-gray-200 rounded-xl overflow-hidden shrink-0 relative">
                            <img 
                                src={getFullImageUrl(item.thumbnail)} 
                                className="w-full h-full object-cover"
                                alt={item.title}
                            />
                        </Link>

                        {/* التفاصيل */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                                <h3 className="font-bold text-slate-800 text-base line-clamp-1">{item.title}</h3>
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <MapPin className="w-3 h-3"/> 
                                    {item.city_name}، {item.major_zone_name}
                                </div>
                                <div className="font-black text-slate-900 mt-2 text-lg flex items-baseline gap-1">
                                    {Number(item.price).toLocaleString()} <span className="text-sm font-bold text-gray-400">ج.م</span>
                                </div>
                            </div>

                            {/* الأزرار */}
                            <div className="flex gap-2 mt-3 border-t border-gray-50 pt-2">
                                <Link href={`/listings/${item.id}`} className="flex-1 bg-slate-50 text-slate-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-100 transition">
                                    <Eye className="w-3 h-3"/> معاينة
                                </Link>
                                <button 
                                    onClick={() => handleRemoveFavorite(item.id)}
                                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-red-100 transition"
                                >
                                    <Trash2 className="w-3 h-3"/> إزالة
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}