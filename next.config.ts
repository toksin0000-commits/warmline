import type { NextConfig } from "next";

// Dynamický import bez typů
const withPWA = require('next-pwa');

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.104', 'localhost'],
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);