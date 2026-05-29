"use client";

import dynamic from 'next/dynamic';
import React from 'react';

const DocWizardLayoutContent = dynamic(
  () => import('./DocWizardLayoutContent'),
  { ssr: false }
);

export default function DocWizardLayout({ children }: { children: React.ReactNode }) {
  return <DocWizardLayoutContent>{children}</DocWizardLayoutContent>;
}
