import type { NextConfig } from "next";

let withPWA: any = (config: any) => config;

try {
  withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
  });
} catch (e) {
  console.log('⚠️ next-pwa not loaded');
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.104', 'localhost'],
  // ✅ Přidáme prázdnou turbopack konfiguraci
  turbopack: {},
};

export default withPWA(nextConfig);