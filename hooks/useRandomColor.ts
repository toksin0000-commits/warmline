'use client';

import { useState, useEffect } from 'react';

// Paleta teplých, příjemných barev
const colorPalette = [
  { bg: '#fdf2f2', text: '#2d3748', accent: '#e53e3e' }, // jemně červená
  { bg: '#f0f9ff', text: '#2d3748', accent: '#3182ce' }, // jemně modrá
  { bg: '#f5f3ff', text: '#2d3748', accent: '#6b46c1' }, // jemně fialová
  { bg: '#f0fdf4', text: '#2d3748', accent: '#38a169' }, // jemně zelená
  { bg: '#fff5f0', text: '#2d3748', accent: '#dd6b20' }, // jemně oranžová
  { bg: '#fff8e7', text: '#2d3748', accent: '#d69e2e' }, // jemně žlutá
  { bg: '#fce7f3', text: '#2d3748', accent: '#d53f8c' }, // jemně růžová
  { bg: '#e6fffa', text: '#2d3748', accent: '#319795' }, // jemně tyrkysová
  { bg: '#faf5ff', text: '#2d3748', accent: '#9f7aea' }, // jemně levandulová
  { bg: '#fff5f5', text: '#2d3748', accent: '#fc8181' }, // jemně korálová
];

export function useRandomColor() {
  const [colors, setColors] = useState({
    bg: '#ffffff',
    text: '#000000',
    accent: '#000000',
  });

  useEffect(() => {
    // Vybereme náhodnou barvu z palety
    const randomIndex = Math.floor(Math.random() * colorPalette.length);
    setColors(colorPalette[randomIndex]);
  }, []);

  return colors;
}