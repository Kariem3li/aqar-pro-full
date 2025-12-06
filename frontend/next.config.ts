import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["192.168.1.8:3000", "localhost:3000"],
    },
  },

  images: {
    // 👇👇 ده مفتاح الحل دلوقتي 👇👇
    // بنقوله: "يا نكست، اعرض الصور زي ما هي من غير ما تحاول تعالجها"
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'kariem.pythonanywhere.com', // غير ده باسم موقعك        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      }
    ],
  },
};

export default nextConfig;