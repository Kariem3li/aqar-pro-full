'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Pagination, Navigation } from 'swiper/modules';
import axios from 'axios';
import { Slider } from '../types';

// 👇 1. استيراد الدالة الجديدة والرابط من الكونفيج
import { API_URL, getFullImageUrl } from '@/lib/config'; 

import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const HeroSlider = () => {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);

  // (تم حذف دالة getImageUrl المحلية لأننا هنستخدم اللي في الكونفيج)

  useEffect(() => {
    const fetchSliders = async () => {
      try {
        const res = await axios.get(`${API_URL}/sliders/`);
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setSliders(data);
      } catch (error) {
        console.error("Slider Error:", error);
        setSliders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSliders();
  }, []);

  if (!loading && (!sliders || sliders.length === 0)) return null;

  return (
    <div className="relative w-full py-6 bg-gray-50 dir-rtl"> 
      <Swiper
        modules={[Autoplay, EffectCoverflow, Pagination, Navigation]}
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        loop={sliders.length > 2} 
        slidesPerView={1.2} 
        breakpoints={{
          640: { slidesPerView: 1.5 },
          1024: { slidesPerView: 2.5 },
        }}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 2.5,
          slideShadows: true,
        }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        className="w-full h-[320px] md:h-[500px]" 
      >
        {sliders.map((slide) => (
          <SwiperSlide key={slide.id} className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-white">
            <div className="relative w-full h-full">
              <Image
                // 👇 2. استخدام الدالة الجاهزة هنا
                src={getFullImageUrl(slide.image)}
                alt={slide.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-20">
                {slide.subtitle && (
                  <span className="inline-block py-1 px-3 mb-3 rounded-full bg-yellow-500 text-white text-xs font-bold shadow-md">
                    {slide.subtitle}
                  </span>
                )}
                <h2 className="text-2xl md:text-4xl font-black text-white mb-6 drop-shadow-lg max-w-2xl leading-tight">
                  {slide.title}
                </h2>
                
                <Link 
                    href={slide.target_link ? slide.target_link : '#'} 
                    target={slide.open_in_new_tab ? '_blank' : '_self'}
                    className="swiper-no-swiping relative z-50 px-8 py-3 bg-white text-brand-primary text-sm md:text-base font-bold rounded-full hover:bg-brand-accent hover:text-white transition-all shadow-lg"
                  >
                    {slide.button_text}
                  </Link>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HeroSlider;