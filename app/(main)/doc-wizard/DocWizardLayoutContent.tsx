"use client";

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/trip-doc/layout/Header';
import Sidebar from '@/components/trip-doc/layout/Sidebar';
import { ToastProvider } from '@/components/trip-doc/common/Toast';
import { useTripStore } from '@/store/tripStore';
import { registerStudentDataCleanup } from '@/store/studentStore';

const NO_SIDEBAR_PATHS = ['/doc-wizard/settings', '/doc-wizard/error'];

export default function DocWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname    = usePathname();
  const currentStep = useTripStore((s) => s.currentStep);
  const showSidebar = !NO_SIDEBAR_PATHS.includes(pathname);

  useEffect(() => { return registerStudentDataCleanup(); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [pathname]);

  useEffect(() => {
    const stepLabels: Record<string, string> = {
      '/doc-wizard/step/type': '1단계 - 유형 선택', '/doc-wizard/step/school': '2단계 - 학교 검색',
      '/doc-wizard/step/excel': '3단계 - 엑셀 업로드', '/doc-wizard/step/place': '4단계 - 장소 정보',
      '/doc-wizard/step/collect': '5단계 - 자동 수집', '/doc-wizard/step/input': '6단계 - 추가 입력',
      '/doc-wizard/step/generate': '7단계 - 서류 생성', '/doc-wizard/step/preview': '8단계 - 미리보기',
      '/doc-wizard/step/output': '9단계 - 출력', '/doc-wizard/settings': '환경 설정',
    };
    document.title = `Trip-Doc | ${stepLabels[pathname] ?? 'Trip-Doc'}`;
  }, [pathname, currentStep]);

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-neutral-50">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          {showSidebar && <Sidebar />}
          <main className="flex-1 overflow-y-auto" id="main-content" tabIndex={-1}>
            <a href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50
                focus:px-3 focus:py-1.5 focus:bg-white focus:border focus:rounded focus:text-sm">
              본문으로 바로가기
            </a>
            <div className="max-w-3xl mx-auto px-4 py-6 lg:px-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
