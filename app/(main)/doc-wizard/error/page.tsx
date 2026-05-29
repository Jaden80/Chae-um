"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const S11_Error = dynamic(() => import('@/components/trip-doc/pages/S11_Error'), { ssr: false });

export default function ErrorPage() {
  return <S11_Error />;
}
