'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
// 👇 1. استيراد الدالة الجديدة والرابط
import { API_URL, getFullImageUrl } from '@/lib/config'; 
import { Loader2 } from 'lucide-react';

export default function CustomPageDetails() {
  const { slug } = useParams();
  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await axios.get(`${API_URL}/pages/${slug}/`);
        setPageData(res.data);
      } catch (error) {
        console.error("Error fetching page:", error);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPage();
  }, [slug]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-primary w-10 h-10"/></div>;
  if (!pageData) return <div className="h-screen flex items-center justify-center pt-20">الصفحة غير موجودة</div>;

  return (
    <main className="min-h-screen bg-white pb-20">
      <Navbar />
      <div className="relative h-[40vh] md:h-[50vh] w-full mt-16">
        {pageData.cover_image && (
          <Image
            // 👇 2. استخدام دالة getFullImageUrl
            src={getFullImageUrl(pageData.cover_image)}
            alt={pageData.title}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute bottom-0 w-full p-6 text-white text-center">
           <h1 className="text-3xl md:text-5xl font-bold mb-2">{pageData.title}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-line text-right" dir="rtl">
          {pageData.body_content}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}