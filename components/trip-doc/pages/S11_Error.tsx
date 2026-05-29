'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/trip-doc/common/Button';

export default function S11_Error() {
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-neutral-500">요청하신 페이지가 존재하지 않거나 접근할 수 없습니다.</p>
        <div className="flex gap-3 justify-center mt-6">
          <Button onClick={() => router.back()} variant="secondary">이전 페이지</Button>
          <Button onClick={() => router.push('/doc-wizard/step/type')}>처음으로</Button>
        </div>
      </div>
    </div>
  );
}
