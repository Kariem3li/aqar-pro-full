"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import ListingCard from "@/components/ListingCard";
import { 
    User, Heart, Building2, Loader2, 
    MessageCircle, LogOut, Save, BadgeCheck, Briefcase 
} from "lucide-react";
// ✅ التعديل: استيراد الرابط ودالة الصور من ملف الإعدادات
import { API_URL, getFullImageUrl } from "@/lib/config";

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // تحديث الحالة لتشمل client_type
  const [userData, setUserData] = useState<any>({
      first_name: "", last_name: "", phone_number: "", 
      whatsapp_link: "", interests: "", username: "", client_type: "Buyer"
  });
  const [myListings, setMyListings] = useState([]);
  const [savedListings, setSavedListings] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const localUsername = localStorage.getItem("username");

    if (!token) {
      router.push("/login");
      return;
    }

    if(localUsername) setUserData((prev: any) => ({...prev, username: localUsername}));

    const fetchData = async () => {
      try {
        const headers = { 
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json" 
        };

        // ✅ استخدام المتغير المستورد
        const userRes = await fetch(`${API_URL}/auth/profile/`, { headers });
        if (userRes.ok) {
            const data = await userRes.json();
            setUserData(data);
        } else {
            console.error(`فشل جلب البروفايل.`);
        }

        const myRes = await fetch(`${API_URL}/listings/my_listings/`, { headers });
        if (myRes.ok) setMyListings(await myRes.json());

        const favRes = await fetch(`${API_URL}/favorites/`, { headers });
        if (favRes.ok) setSavedListings(await favRes.json());

      } catch (error) {
        console.error("حدث خطأ في الاتصال:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${API_URL}/auth/profile/`, {
            method: "PATCH",
            headers: { 
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                first_name: userData.first_name,
                last_name: userData.last_name,
                phone_number: userData.phone_number,
                whatsapp_link: userData.whatsapp_link,
                interests: userData.interests,
                client_type: userData.client_type // إرسال نوع العميل
            })
        });

        if (res.ok) {
            alert("✅ تم تحديث البيانات بنجاح");
            const updatedData = await res.json();
            setUserData(updatedData);
        }
        else {
            const errorData = await res.json();
            alert(`❌ حدث خطأ: ${JSON.stringify(errorData)}`);
        }
        
    } catch (error) {
        alert("فشل الاتصال بالسيرفر");
    } finally {
        setUpdating(false);
    }
  };

  const handleChange = (e: any) => setUserData({ ...userData, [e.target.name]: e.target.value });

  const handleLogout = () => {
      if(confirm("هل أنت متأكد من تسجيل الخروج؟")) {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          router.push("/login");
      }
  };

  const displayName = (userData.first_name || userData.last_name) 
    ? `${userData.first_name} ${userData.last_name}` 
    : userData.username || "مستخدم";
    
  const firstLetter = userData.first_name 
    ? userData.first_name.charAt(0).toUpperCase() 
    : (userData.username ? userData.username.charAt(0).toUpperCase() : "?");

  // دالة مساعدة لترجمة نوع العميل للعرض في الهيدر
  const getClientTypeLabel = (type: string) => {
      switch(type) {
          case 'Seller': return 'بائع / مالك';
          case 'Investor': return 'مستثمر';
          default: return 'مشتري';
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-brand-light"><Loader2 className="animate-spin w-10 h-10 text-brand-primary"/></div>;

  return (
    <main className="min-h-screen bg-brand-light font-sans pb-28">
      <Navbar />
      
      {/* Header Profile Card */}
      <div className="bg-brand-primary pt-24 pb-20 px-4 rounded-b-[3rem] shadow-2xl relative text-center text-white">
          <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/20 shadow-xl uppercase select-none">
                  {firstLetter}
              </div>
              {/* شارة نوع العميل */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-brand-accent text-brand-primary text-[10px] font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                  {getClientTypeLabel(userData.client_type)}
              </div>
          </div>
          
          <h1 className="text-2xl font-black mt-4">{displayName}</h1>
          <p className="text-brand-goldLight text-sm mt-1 dir-ltr font-mono opacity-80">{userData.phone_number || "رقم الهاتف غير مسجل"}</p>
          
          <div className="flex justify-center gap-4 mt-6">
              <div className="bg-white/10 px-6 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-xl font-bold">{myListings.length}</p>
                  <p className="text-xs opacity-70">إعلان</p>
              </div>
              <div className="bg-white/10 px-6 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <p className="text-xl font-bold">{savedListings.length}</p>
                  <p className="text-xs opacity-70">مفضلة</p>
              </div>
          </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
        
        <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 flex justify-between mb-6">
            {[
                { id: "info", label: "بياناتي", icon: User },
                { id: "listings", label: "إعلاناتي", icon: Building2 },
                { id: "saved", label: "المفضلة", icon: Heart },
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all duration-300 ${
                        activeTab === tab.id 
                        ? "bg-brand-primary text-white shadow-md" 
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
            ))}
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 min-h-[400px]">
            
            {activeTab === "info" && (
                <form onSubmit={handleUpdate} className="space-y-5 animate-in fade-in">
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-blue-500"/> اسم المستخدم</label>
                        <input value={userData.username ?? ""} disabled className="input-field bg-gray-50 text-gray-500 cursor-not-allowed border-dashed" />
                    </div>

                    {/* 👇👇👇 حقل نوع العميل الجديد 👇👇👇 */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block flex items-center gap-1"><Briefcase className="w-3 h-3 text-brand-accent"/> نوع الحساب (الاهتمام)</label>
                        <select 
                            name="client_type" 
                            value={userData.client_type || "Buyer"} 
                            onChange={handleChange} 
                            className="input-field cursor-pointer"
                        >
                            <option value="Buyer">مشتري (أبحث عن عقار)</option>
                            <option value="Seller">بائع (لدي عقار للبيع)</option>
                            <option value="Investor">مستثمر (أبحث عن فرص استثمارية)</option>
                        </select>
                    </div>
                    {/* 👆👆👆 ----------------------- 👆👆👆 */}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">الاسم الأول</label>
                            <input name="first_name" placeholder="الاسم الأول" value={userData.first_name ?? ""} onChange={handleChange} className="input-field" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">الاسم الأخير</label>
                            <input name="last_name" placeholder="اسم العائلة" value={userData.last_name ?? ""} onChange={handleChange} className="input-field" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">رقم الهاتف</label>
                        <input name="phone_number" value={userData.phone_number ?? ""} onChange={handleChange} className="input-field" />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block flex items-center gap-1"><MessageCircle className="w-3 h-3 text-green-600"/> رابط الواتساب</label>
                        <input name="whatsapp_link" placeholder="https://wa.me/201xxxx" value={userData.whatsapp_link ?? ""} onChange={handleChange} className="input-field dir-ltr placeholder:text-right" />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">نبذة أو اهتمامات إضافية</label>
                        <textarea name="interests" rows={3} value={userData.interests ?? ""} onChange={handleChange} className="input-field h-24 py-3 resize-none" placeholder="مثال: أبحث عن شقة في الحي التاسع، أو أرض صناعية..." />
                    </div>

                    <button disabled={updating} className="w-full bg-brand-accent text-brand-primary font-black py-4 rounded-xl hover:bg-amber-600 hover:text-white transition shadow-lg flex items-center justify-center gap-2 mt-4">
                        {updating ? <Loader2 className="animate-spin" /> : <><Save className="w-5 h-5" /> حفظ التعديلات</>}
                    </button>

                    <button type="button" onClick={handleLogout} className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition flex items-center justify-center gap-2 mt-2">
                        <LogOut className="w-4 h-4" /> تسجيل خروج
                    </button>
                </form>
            )}

            {activeTab === "listings" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in">
                    {myListings.length > 0 ? (
                        myListings.map((listing: any) => (
                            <ListingCard 
                                key={listing.id} 
                                id={listing.id}
                                title={listing.title}
                                price={Number(listing.price).toLocaleString()}
                                address={`${listing.city_name || ''}`}
                                // ✅ استخدام الدالة المستوردة
                                image={getFullImageUrl(listing.thumbnail)}
                                offerType={listing.offer_type === 'Sale' ? 'بيع' : 'إيجار'}
                                isFinanceEligible={listing.is_finance_eligible}
                                isSold={listing.status === 'Sold'}
                                is_favorite={listing.is_favorite}
                                features={[]} 
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20">
                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                            <p className="text-gray-400">لا توجد إعلانات مضافة بعد.</p>
                            <a href="/add-property" className="text-brand-accent font-bold mt-2 inline-block">أضف عقارك الأول</a>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "saved" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in">
                    {savedListings.length > 0 ? (
                        savedListings.map((listing: any) => (
                            <ListingCard 
                                key={listing.id} 
                                id={listing.id}
                                title={listing.title}
                                price={Number(listing.price).toLocaleString()}
                                address={`${listing.city_name || ''}`}
                                // ✅ استخدام الدالة المستوردة
                                image={getFullImageUrl(listing.thumbnail)}
                                offerType={listing.offer_type === 'Sale' ? 'بيع' : 'إيجار'}
                                isFinanceEligible={listing.is_finance_eligible}
                                isSold={listing.status === 'Sold'}
                                is_favorite={true} 
                                features={[]}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20">
                            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3"/>
                            <p className="text-gray-400">قائمة المفضلة فارغة.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
      
      <BottomNav />
    </main>
  );
}