"use client";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { Loader2, Trash2, MapPin, Eye, Clock, CheckCircle2, XCircle, Plus, AlertCircle, Edit } from "lucide-react";
import Link from "next/link";
// ✅ التعديل: استيراد الرابط ودالة الصور من ملف الإعدادات
import { API_URL, getFullImageUrl } from "@/lib/config";

export default function MyListings() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  const fetchMyListings = async () => {
    const token = localStorage.getItem('token');
    if (!token) { 
        setLoading(false);
        setIsAuth(false);
        return; 
    }
    
    setIsAuth(true);
    try {
      // ✅ استخدام المتغير المستورد
      const res = await fetch(`${API_URL}/listings/my_listings/`, {
        headers: { "Authorization": `Token ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMyListings(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("تنبيه: سيتم حذف الإعلان نهائياً. هل أنت متأكد؟")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/listings/${id}/`, {
        method: 'DELETE',
        headers: { "Authorization": `Token ${token}` }
      });
      if (res.ok) setListings(listings.filter(item => item.id !== id));
      else alert("حدث خطأ أثناء الحذف");
    } catch (error) { alert("فشل الاتصال بالسيرفر"); }
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'Pending': return <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-amber-100"><Clock className="w-3 h-3"/> قيد المراجعة</span>;
          case 'Available': return <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-green-100"><CheckCircle2 className="w-3 h-3"/> منشور</span>;
          case 'Sold': return <span className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-lg text-[10px] font-bold border border-red-100"><XCircle className="w-3 h-3"/> مباع</span>;
          default: return null;
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-400 w-8 h-8"/></div>;

  // لو مش مسجل دخول
  if (!isAuth) {
      return (
          <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="text-center">
                  <h1 className="text-xl font-bold text-slate-900 mb-2">يجب تسجيل الدخول</h1>
                  <Link href="/login" className="text-amber-600 font-bold underline">اذهب لصفحة الدخول</Link>
              </div>
          </main>
      )
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-28 font-sans">
      <Navbar />

      {/* Header */}
      <div className="bg-slate-900 text-white pt-8 pb-16 px-4 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto flex justify-between items-center mt-6">
            <div>
                <h1 className="text-2xl font-black">إعلاناتي</h1>
                <p className="text-slate-400 text-xs mt-1">إدارة عقاراتك ({listings.length})</p>
            </div>
            <Link href="/add-property" className="bg-amber-500 text-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:bg-amber-400 transition transform hover:scale-105">
                <Plus className="w-6 h-6" />
            </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-20">
        {listings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100 mt-6">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                    <AlertCircle className="w-8 h-8 text-slate-300"/>
                </div>
                <h3 className="font-bold text-slate-800 text-lg">لا توجد إعلانات</h3>
                <p className="text-gray-400 text-sm mt-1 mb-6">لم تقم بإضافة أي عقار حتى الآن.</p>
                <Link href="/add-property" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition">
                    أضف عقارك الأول
                </Link>
            </div>
        ) : (
            <div className="space-y-4">
                {listings.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex gap-3 transition hover:shadow-md group">
                        {/* الصورة */}
                        <div className="w-28 h-28 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative">
                            <img 
                                src={getFullImageUrl(item.thumbnail)} 
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                alt={item.title}
                            />
                            {/* شارة الحالة فوق الصورة */}
                            <div className="absolute top-2 right-2">
                                {item.status === 'Pending' && <span className="w-3 h-3 bg-amber-500 rounded-full block shadow-md border-2 border-white"></span>}
                                {item.status === 'Available' && <span className="w-3 h-3 bg-green-500 rounded-full block shadow-md border-2 border-white"></span>}
                                {item.status === 'Sold' && <span className="w-3 h-3 bg-red-500 rounded-full block shadow-md border-2 border-white"></span>}
                            </div>
                        </div>

                        {/* المحتوى */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{item.title}</h3>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                     {getStatusBadge(item.status)}
                                     <span className="text-[10px] text-gray-400 font-mono">{item.created_at?.split('T')[0]}</span>
                                </div>
                                
                                <div className="text-[10px] text-gray-400 flex items-center gap-1 mb-1">
                                    <MapPin className="w-3 h-3 text-slate-400"/> {item.city_name}
                                </div>
                                <div className="font-black text-slate-900 text-sm">{Number(item.price).toLocaleString()} ج.م</div>
                            </div>

                            {/* الأزرار */}
                            <div className="flex gap-2 mt-2">
                                {/* زرار المعاينة */}
                                <Link href={`/listings/${item.id}`} className="flex-1 bg-slate-50 text-slate-600 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-slate-200 transition">
                                    <Eye className="w-3 h-3"/> معاينة
                                </Link>

                                {/* زرار التعديل */}
                                <Link href={`/edit-property/${item.id}`} className="flex-1 bg-amber-50 text-amber-700 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-amber-100 transition border border-amber-100">
                                    <Edit className="w-3 h-3"/> تعديل
                                </Link>

                                {/* زرار الحذف */}
                                <button onClick={() => handleDelete(item.id)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-red-100 transition">
                                    <Trash2 className="w-3 h-3"/> حذف
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </main>
  );
}