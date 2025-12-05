"use client";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import ListingCard from "@/components/ListingCard";
import AdvancedFiltersModal from "@/components/AdvancedFiltersModal";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation"; 

// 👇👇👇 تم إضافة استدعاء السلايدر هنا 👇👇👇
// ملحوظة: لو ظهر خطأ في المسار، جرب تستخدم @/components/HeroSlider
import HeroSlider from '../components/HeroSlider'; 

// ⚠️ غير الرقم ده بـ IP جهازك
const API_URL = "http://192.168.1.8:8000/api"; 
const SERVER_URL = "http://192.168.1.8:8000";

export default function Home() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        if (!params.get('status')) {
             params.append('status', 'Available');
        }
        
        const queryString = params.toString();
        const url = `${API_URL}/listings/?${queryString}`;
        
        // 🛑 إضافة الهيدر عشان الباك إند يعرف مين اليوزر ويحسب is_favorite صح
        const headers: any = { "Content-Type": "application/json" };
        const token = localStorage.getItem('token');
        if (token) headers["Authorization"] = `Token ${token}`;

        const res = await fetch(url, { headers }); // 👈 مررنا الهيدر هنا
        const data = await res.json();
        
        const results = Array.isArray(data.results) ? data.results : data.results || data; 
        setListings(results);

      } catch (error) {
        console.error("Error fetching listings:", error);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListings();
  }, [searchParams]);

  const prepareCardData = (item: any) => {
      const addressParts = [
          item.subdivision_name, 
          item.major_zone_name,  
          item.city_name         
      ].filter(Boolean);
      const fullAddress = addressParts.join("، ");

      let featuresList = [
          { label: "المساحة", value: `${item.area_sqm} م²` }
      ];

      if (item.dynamic_features && item.dynamic_features.length > 0) {
          const extraFeats = item.dynamic_features.map((f: any) => ({
              label: f.feature_name,
              value: f.value
          }));
          featuresList = [...featuresList, ...extraFeats];
      }

      if (item.bedrooms) featuresList.push({ label: "غرف", value: `${item.bedrooms} غرف` });
      if (item.bathrooms) featuresList.push({ label: "حمام", value: `${item.bathrooms} حمام` });

      return {
          address: fullAddress || "عنوان غير محدد",
          features: featuresList.slice(0, 4) 
      };
  };

  // دالة مساعدة لضبط رابط الصورة
  const getImageUrl = (path: string) => {
    if (!path) return "https://via.placeholder.com/400x300?text=No+Image"; 
    if (path.startsWith("http")) return path;
    return `${SERVER_URL}${path}`;
  };

  return (
    <main className="min-h-screen bg-brand-light pb-32">
      <Navbar />
      
      {/* 👇👇👇 السلايدر السينمائي (VIP) تم وضعه هنا 👇👇👇 */}
      {/* هيظهر فقط لو فيه بيانات، ولو مفيش هيختفي ولا كأنه موجود */}
      <div className="mb-0">
         <HeroSlider />
      </div>

      {/* Hero Section & Search Header - تم تحديث الألوان للهوية الجديدة */}
      {/* قمت بإزالة rounded-t-none لضمان التناسق إذا لم يظهر السلايدر */}
      <div className="bg-brand-primary pt-28 pb-20 px-4 rounded-b-[3rem] shadow-2xl relative overflow-hidden text-center">
        {/* دوائر خلفية جمالية */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-5">
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
            استثمارك الآمن يبدأ مع <br/> <span className="text-brand-accent inline-block mt-2">رواسي العقارية</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-lg mx-auto leading-relaxed font-light">
            نقدم لك نخبة من الفرص الاستثمارية في المدن الجديدة. أراضٍ، مصانع، ووحدات سكنية تلبي طموحك.
          </p>
          
          {/* شريط البحث السريع (يفتح الفلتر) */}
          <div className="flex items-center justify-center mt-10">
             <div className="bg-white p-2 pr-5 rounded-full flex items-center gap-3 w-full max-w-md shadow-2xl transform hover:scale-[1.02] transition duration-300 ring-4 ring-white/10">
                <Search className="text-brand-secondary w-5 h-5" />
                <span className="flex-1 text-right text-gray-400 text-sm font-medium cursor-pointer" onClick={() => document.getElementById('filter-btn')?.click()}>ابحث عن عقارك...</span>
                <AdvancedFiltersModal /> {/* زر الفلتر هنا */}
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
         {/* شريط إحصائيات سريع (اختياري) */}
         <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex justify-around items-center text-center">
            <div>
               <p className="text-brand-accent font-black text-xl">+{listings.length}</p>
               <p className="text-xs text-gray-500 font-bold">عقار متاح</p>
            </div>
            <div className="w-px h-8 bg-gray-100"></div>
            <div>
               <p className="text-brand-primary font-black text-xl">24/7</p>
               <p className="text-xs text-gray-500 font-bold">دعم فني</p>
            </div>
         </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-black text-brand-primary border-r-4 border-brand-accent pr-3">
                {searchParams.toString() && searchParams.toString() !== 'status=Available' ? "نتائج البحث" : "أحدث الفرص"}
            </h2>
          </div>

          {loading && (
             <div className="flex justify-center items-center h-48">
                 <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
             </div>
          )}

          {!loading && listings.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 bg-white p-8 rounded-3xl shadow-sm border border-gray-200 text-center">
                  <div className="w-16 h-16 bg-brand-light rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-brand-accent" />
                  </div>
                  <p className="text-xl font-bold text-brand-primary">لا توجد عقارات مطابقة</p>
                  <p className="text-sm text-gray-500 mt-2">جرب تغيير الفلاتر أو البحث في منطقة مختلفة.</p>
              </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {listings.map((item: any) => {
                const { address, features } = prepareCardData(item);
                
                return (
                    <Link href={`/listings/${item.id}`} key={item.id} className="block h-full transform hover:-translate-y-1 transition duration-300">
                        <ListingCard 
                            key={item.id}
                            id={item.id}
                            is_favorite={item.is_favorite || false}
                            
                            title={item.title}
                            address={address}
                            price={Number(item.price).toLocaleString()}
                            image={getImageUrl(item.thumbnail)}
                            offerType={item.offer_type === 'Sale' ? 'بيع' : 'إيجار'}
                            isFinanceEligible={item.is_finance_eligible}
                            isSold={item.status === 'Sold'}
                            features={features}
                        />
                    </Link>
                );
            })}
          </div>
      </section>

      <BottomNav />
    </main>
  );
}