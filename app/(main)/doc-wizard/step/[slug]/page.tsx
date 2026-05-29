"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const S01_TripTypeSelect = dynamic(() => import('@/components/trip-doc/pages/S01_TripTypeSelect'), { ssr: false });
const S02_SchoolSearch = dynamic(() => import('@/components/trip-doc/pages/S02_SchoolSearch'), { ssr: false });
const S03_ExcelUpload = dynamic(() => import('@/components/trip-doc/pages/S03_ExcelUpload'), { ssr: false });
const S04_PlaceInfo = dynamic(() => import('@/components/trip-doc/pages/S04_PlaceInfo'), { ssr: false });
const S05_AutoCollect = dynamic(() => import('@/components/trip-doc/pages/S05_AutoCollect'), { ssr: false });
const S06_ManualInput = dynamic(() => import('@/components/trip-doc/pages/S06_ManualInput'), { ssr: false });
const S07_DocumentGenerate = dynamic(() => import('@/components/trip-doc/pages/S07_DocumentGenerate'), { ssr: false });
const S08_Preview = dynamic(() => import('@/components/trip-doc/pages/S08_Preview'), { ssr: false });
const S09_Output = dynamic(() => import('@/components/trip-doc/pages/S09_Output'), { ssr: false });
const S11_Error = dynamic(() => import('@/components/trip-doc/pages/S11_Error'), { ssr: false });

export default function StepPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  switch (slug) {
    case 'type':     return <S01_TripTypeSelect />;
    case 'school':   return <S02_SchoolSearch />;
    case 'excel':    return <S03_ExcelUpload />;
    case 'place':    return <S04_PlaceInfo />;
    case 'collect':  return <S05_AutoCollect />;
    case 'input':    return <S06_ManualInput />;
    case 'generate': return <S07_DocumentGenerate />;
    case 'preview':  return <S08_Preview />;
    case 'output':   return <S09_Output />;
    default:         return <S11_Error />;
  }
}
