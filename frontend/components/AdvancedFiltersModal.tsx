"use client";
import { useState, useEffect, useMemo } from "react";
import { X, Filter, MapPin, Home, Banknote, Check, RotateCcw, Bed, Bath, Hash, DollarSign, Ruler, LayoutDashboard, Building, KeyRound, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = "http://192.168.1.8:8000/api";

// مكون مساعد لتقسيم أقسام الفلترة
const FilterSection = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
    <div className="space-y-4 pt-4 border-t border-gray-100 first:border-t-0 first:pt-0">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon className="w-4 h-4 text-amber-600"/> {title}
        </h3>
        {children}
    </div>
);

// مكون زر الفئة بتصميم أيقوني
const CategoryButton = ({ name, isSelected, onClick, Icon }: { name: string, isSelected: boolean, onClick: () => void, Icon: any }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 border-2 text-center h-20 shadow-sm ${
            isSelected 
                ? "border-amber-600 bg-amber-50 text-slate-900 ring-4 ring-amber-100" 
                : "border-gray-200 text-slate-600 bg-white hover:bg-gray-50 hover:border-amber-400"
        }`}
    >
        <Icon className="w-5 h-5 mb-1"/>
        <span className="text-xs font-bold">{name}</span>
    </button>
);

export default function AdvancedFiltersModal() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);

    // --- Data Sources ---
    const [categories, setCategories] = useState<any[]>([]);
    const [governorates, setGovernorates] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [subdivisions, setSubdivisions] = useState<any[]>([]);
    
    // --- Filter State ---
    const initialFilters = {
        offer_type: searchParams.get('offer_type') || "", category: searchParams.get('category') || "", 
        min_price: searchParams.get('min_price') || "", max_price: searchParams.get('max_price') || "",
        min_area: searchParams.get('min_area') || "", max_area: searchParams.get('max_area') || "", 
        governorate: searchParams.get('governorate') || "", city: searchParams.get('city') || "", 
        major_zone: searchParams.get('major_zone') || "", subdivision: searchParams.get('subdivision') || "", 
        bedrooms: searchParams.get('bedrooms') || "", bathrooms: searchParams.get('bathrooms') || "", 
        floor_number: searchParams.get('floor_number') || "", is_finance_eligible: searchParams.get('is_finance_eligible') === 'true',
        dynamicFeatures: {}
    };

    const [filters, setFilters] = useState<any>(initialFilters);
    const [dynamicFeatureFields, setDynamicFeatureFields] = useState<any[]>([]);

    // 1. Fetch Data on Open and Initialize Filters
    useEffect(() => {
        if (isOpen) {
            const currentFilters: any = { ...initialFilters };
            
            searchParams.forEach((value, key) => {
                if (key.startsWith('feat_')) {
                    const featureId = key.split('_')[1];
                    currentFilters.dynamicFeatures[featureId] = value;
                }
            });
            setFilters(currentFilters);

            const loadData = async () => {
                 try {
                    const [catRes, govRes] = await Promise.all([
                        fetch(`${API_URL}/categories/`),
                        fetch(`${API_URL}/governorates/`)
                    ]);
                    setCategories(await catRes.json());
                    setGovernorates(await govRes.json());
                    
                    const initialCatId = currentFilters.category;
                    if (initialCatId) {
                        const featureRes = await fetch(`${API_URL}/categories/${initialCatId}/features/`);
                        setDynamicFeatureFields(await featureRes.json());
                    }
                    if (currentFilters.governorate) {
                        const cityRes = await fetch(`${API_URL}/cities/?governorate=${currentFilters.governorate}`);
                        setCities(await cityRes.json());
                        if (currentFilters.city) {
                            const zoneRes = await fetch(`${API_URL}/zones/?city=${currentFilters.city}`);
                            setZones(await zoneRes.json());
                            if (currentFilters.major_zone) {
                                const subRes = await fetch(`${API_URL}/subdivisions/?major_zone=${currentFilters.major_zone}`);
                                setSubdivisions(await subRes.json());
                            }
                        }
                    }

                } catch (e) { console.error("Failed to fetch initial data:", e); }
            };
            loadData();
        }
    }, [isOpen]); 

    // 🚨 تعريف الدوال والمتغيرات هنا (Conditional Logic)
    const selectedCatName = useMemo(() => {
        return categories.find((c: any) => c.id == filters.category)?.name || "";
    }, [filters.category, categories]);

    const shouldShowRooms = useMemo(() => {
        return ["شقة", "فيلا", "دوبلكس", "شاليه", "رووف", "منزل", "استوديو"].some(k => selectedCatName.includes(k));
    }, [selectedCatName]);
    
    const shouldHideFloor = useMemo(() => {
        return ["أرض", "عمارة", "مبنى", "محل"].some(k => selectedCatName.includes(k));
    }, [selectedCatName]);

    // --- Handlers (تم تصحيح الأخطاء هنا) ---
    // دالة موحدة لتغيير قيمة الفلتر (سواء كان ثابت أو ديناميكي)
    const handleFeatureChange = (featureName: string, value: string, featureId?: string | number) => {
        const fixedField = featureId ? getFixedFieldName(featureName) : null;

        if (fixedField) {
            // لو كان حقل ثابت (غرف، حمام)، نحدث الـ Root State
            setFilters((prev: any) => ({ ...prev, [fixedField]: value })); // 👈 تم التصحيح هنا
        } else if (featureId) {
            // لو كان حقل ديناميكي، نحدث الـ dynamicFeatures Object
            setFilters((prev: any) => ({ // 👈 تم التصحيح هنا
                ...prev, 
                dynamicFeatures: { 
                    ...prev.dynamicFeatures, 
                    [featureId]: value 
                }
            }));
        }
    };
    
    // دالة مساعدة لتحديد اسم العمود الثابت من اسم الميزة الديناميكية
    const getFixedFieldName = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('غرف')) return 'bedrooms';
        if (lowerName.includes('حمام')) return 'bathrooms';
        if (lowerName.includes('دور')) return 'floor_number';
        return null;
    };
    
    const handleCategoryChange = async (catId: string) => {
        const newFilters = { ...filters, category: catId, bedrooms: "", bathrooms: "", floor_number: "", dynamicFeatures: {} };
        setFilters(newFilters);
        setDynamicFeatureFields([]); 

        if (catId) {
            try {
                const res = await fetch(`${API_URL}/categories/${catId}/features/`);
                setDynamicFeatureFields(await res.json());
            } catch (e) { console.error("Failed to fetch features:", e); }
        }
    };

    const handleGovChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        // 👈 تم التصحيح هنا
        setFilters((prev: any) => ({ ...prev, governorate: val, city: "", major_zone: "", subdivision: "" })); 
        setCities([]); setZones([]); setSubdivisions([]);
        if (val) { const res = await fetch(`${API_URL}/cities/?governorate=${val}`); setCities(await res.json()); } 
    };

    const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        // 👈 تم التصحيح هنا
        setFilters((prev: any) => ({ ...prev, city: val, major_zone: "", subdivision: "" })); 
        setZones([]); setSubdivisions([]);
        if (val) { const res = await fetch(`${API_URL}/zones/?city=${val}`); setZones(await res.json()); } 
    };

    const handleZoneChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        // 👈 تم التصحيح هنا
        setFilters((prev: any) => ({ ...prev, major_zone: val, subdivision: "" })); 
        setSubdivisions([]);
        if (val) { const res = await fetch(`${API_URL}/subdivisions/?major_zone=${val}`); setSubdivisions(await res.json()); }
    };
    
    // 3. Apply Filters Logic
    const applyFilters = () => {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (key !== 'dynamicFeatures' && value && value !== false) {
               params.append(key, value.toString());
            }
            if (key === 'is_finance_eligible' && value === true) {
                params.append(key, 'true');
            }
        });
        
        // إضافة فلاتر المزايا الديناميكية بصيغة (feat_[ID]=Value)
        Object.entries(filters.dynamicFeatures).forEach(([id, value]) => {
            if (value && value !== '0' && value !== "") params.append(`feat_${id}`, value.toString());
        });

        setIsOpen(false);
        router.push(`/?${params.toString()}`);
    };

    // 4. Reset Filters
    const resetFilters = () => {
        setFilters(initialFilters); 
        setDynamicFeatureFields([]);
        router.push('/');
    };
    
    // Icon mapping for category buttons
    const getCategoryIcon = (name: string) => {
        if (name.includes("شقة") || name.includes("استوديو")) return Home;
        if (name.includes("فيلا") || name.includes("منزل") || name.includes("قصر")) return Building;
        if (name.includes("أرض")) return MapPin;
        if (name.includes("مكتب") || name.includes("محل")) return KeyRound;
        return Home;
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="bg-slate-900 h-12 w-12 rounded-xl flex items-center justify-center text-white hover:bg-amber-600 transition shadow-lg"
            >
                <Filter className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex justify-end items-end md:justify-center md:items-center">
                    <div className="bg-white w-full md:w-[700px] h-[85vh] md:max-h-[90vh] rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                        
                        {/* Header */}
                        <div className="bg-slate-900 border-b border-gray-100 p-5 flex justify-between items-center sticky top-0 z-10">
                            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                                <Filter className="w-6 h-6 text-amber-500"/> تصفية متقدمة
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="p-2 bg-amber-500 rounded-full text-slate-900 hover:bg-amber-400 transition"><X className="w-5 h-5"/></button>
                        </div>

                        {/* Body - Scrollable Filters */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            
                            {/* 1. نوع العرض والتمويل */}
                            <FilterSection title="الهدف ونوع الصفقة" icon={Banknote}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex bg-gray-100 p-1 rounded-xl">
                                        {["Sale", "Rent"].map((type) => (
                                            <button 
                                                key={type} 
                                                onClick={() => setFilters({...filters, offer_type: type})}
                                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${filters.offer_type === type ? "bg-slate-900 text-white shadow-md" : "text-slate-700 hover:bg-white"}`}
                                            >
                                                {type === "Sale" ? "للبيع" : "للإيجار"}
                                            </button>
                                        ))}
                                    </div>
                                    <div 
                                        onClick={() => setFilters({...filters, is_finance_eligible: !filters.is_finance_eligible})} 
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${filters.is_finance_eligible ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                    >
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                            <Banknote className="w-5 h-5 text-green-600"/> تمويل عقاري فقط
                                        </div>
                                        {filters.is_finance_eligible && <Check className="w-5 h-5 text-green-600"/>}
                                    </div>
                                </div>
                            </FilterSection>

                            {/* 2. نوع العقار (Category) */}
                            <FilterSection title="تحديد نوع العقار" icon={LayoutDashboard}>
                                <div className="grid grid-cols-4 gap-3">
                                    {categories.map((cat) => (
                                        <CategoryButton 
                                            key={cat.id}
                                            name={cat.name}
                                            isSelected={filters.category == cat.id}
                                            onClick={() => handleCategoryChange(cat.id)}
                                            Icon={getCategoryIcon(cat.name)}
                                        />
                                    ))}
                                </div>
                            </FilterSection>

                            {/* 3. السعر والمساحة - فلاتر ثابتة دائمة */}
                            <FilterSection title="القياسات الأساسية" icon={DollarSign}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">السعر (جنيه)</label>
                                        <div className="flex gap-2">
                                            <input type="number" placeholder="من" className="input-filter" value={filters.min_price} onChange={(e) => setFilters({...filters, min_price: e.target.value})} />
                                            <input type="number" placeholder="إلى" className="input-filter" value={filters.max_price} onChange={(e) => setFilters({...filters, max_price: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">المساحة (م²)</label>
                                        <div className="flex gap-2">
                                            <input type="number" placeholder="من" className="input-filter" value={filters.min_area} onChange={(e) => setFilters({...filters, min_area: e.target.value})} />
                                            <input type="number" placeholder="إلى" className="input-filter" value={filters.max_area} onChange={(e) => setFilters({...filters, max_area: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            </FilterSection>

                            {/* 4. 🔥 الحقول الديناميكية (الآن كل شيء هنا) */}
                            {dynamicFeatureFields.length > 0 && (
                                <FilterSection title="مواصفات العقار المخصصة" icon={Ruler}>
                                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 animate-in fade-in">
                                        
                                        {dynamicFeatureFields.map((field) => {
                                            const fixedFieldName = getFixedFieldName(field.name);
                                            const isFixed = fixedFieldName !== null;
                                            // القيمة اللي هتظهر في الخانة (إما من الحقل الثابت أو من الحقل الديناميكي)
                                            const currentValue = isFixed ? filters[fixedFieldName] : filters.dynamicFeatures[field.id] || "";
                                            
                                            // الأيقونات للحقول الثابتة
                                            const Icon = fixedFieldName === 'bedrooms' ? Bed : fixedFieldName === 'bathrooms' ? Bath : fixedFieldName === 'floor_number' ? Hash : LayoutDashboard;

                                            return (
                                                <div key={field.id}>
                                                    <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                                                        <Icon className="w-4 h-4 text-amber-600"/> {field.name}
                                                    </label>
                                                    {field.input_type === 'bool' ? (
                                                        <select 
                                                            className="input-filter bg-white" 
                                                            value={currentValue} 
                                                            onChange={(e) => handleFeatureChange(field.name, e.target.value, field.id)}
                                                        >
                                                            <option value="">{field.name}؟</option>
                                                            <option value="نعم">نعم</option>
                                                            <option value="لا">لا</option>
                                                        </select>
                                                    ) : (
                                                        <input 
                                                            type={field.input_type === 'number' ? 'number' : 'text'} 
                                                            placeholder={field.name} 
                                                            className="input-filter bg-white" 
                                                            value={currentValue} 
                                                            onChange={(e) => handleFeatureChange(field.name, e.target.value, field.id)}
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </FilterSection>
                            )}
                            
                            {/* 5. الموقع الجغرافي */}
                            <FilterSection title="الموقع الجغرافي" icon={MapPin}>
                                <div className="space-y-3">
                                    <select className="input-filter" onChange={handleGovChange} value={filters.governorate}><option value="">كل المحافظات</option>{governorates.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select className="input-filter" onChange={handleCityChange} value={filters.city} disabled={!filters.governorate}><option value="">كل المدن</option>{cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                                        <select className="input-filter" onChange={handleZoneChange} value={filters.major_zone} disabled={!filters.city}><option value="">كل الأحياء</option>{zones.map((z: any) => <option key={z.id} value={z.id}>{z.name}</option>)}</select>
                                    </div>
                                    <select className="input-filter" onChange={(e) => setFilters({...filters, subdivision: e.target.value})} value={filters.subdivision} disabled={!filters.major_zone}><option value="">كل المجاورت</option>{subdivisions.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                                </div>
                            </FilterSection>

                        </div>

                        {/* Footer Buttons */}
                        <div className="p-5 border-t border-gray-100 flex gap-3 bg-white sticky bottom-0 z-10 shadow-md">
                            <button onClick={resetFilters} className="px-4 py-3 bg-gray-100 text-slate-700 rounded-xl font-bold flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition border border-gray-200"><RotateCcw className="w-4 h-4"/> مسح</button>
                            <button onClick={applyFilters} className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-extrabold hover:bg-amber-700 transition shadow-lg flex items-center justify-center gap-2">
                                <Search className="w-5 h-5"/> تطبيق الفلاتر
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}