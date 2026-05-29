import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import { ToastProvider } from '@/components/trip-doc/common/Toast';
import { useTripStore } from '@/store/tripStore';
import { registerStudentDataCleanup } from '@/store/studentStore';

const NO_SIDEBAR_PATHS = ['/settings', '/error'];

export default function Layout() {
  const pathname = usePathname();
  const currentStep = useTripStore((s) => s.currentStep);
  const showSidebar = !NO_SIDEBAR_PATHS.includes(pathname);

  useEffect(() => { return registerStudentDataCleanup(); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [pathname]);

  useEffect(() => {
    const stepLabels: Record<string, string> = {
      '/step/type': '1단계 - 유형 선택',
      '/step/excel': '2단계 - 엑셀 업로드',
      '/step/place': '3단계 - 장소 정보',
      '/step/input': '4단계 - 추가 입력',
      '/step/generate': '5단계 - 서류 생성',
      '/step/preview': '6단계 - 미리보기',
      '/step/output': '7단계 - 출력',
      '/settings': '환경 설정',
    };
    const matchingKey = Object.keys(stepLabels).find(key => pathname.endsWith(key)) || pathname;
    document.title = `Trip-Doc | ${stepLabels[matchingKey] ?? 'Trip-Doc'}`;
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
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
