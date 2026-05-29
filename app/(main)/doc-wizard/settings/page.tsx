"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const S10_Settings = dynamic(() => import('@/components/trip-doc/pages/S10_Settings'), { ssr: false });

export default function SettingsPage() {
  return <S10_Settings />;
}
