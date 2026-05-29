"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/trip-doc/common/Toast';

export default function MyPageContent() {
  const { principal, vPrincipal, admin, teachers, setStaffManual } = useSchoolStore();
  const toast = useToast();

  const [localPrincipal, setLocalPrincipal] = useState(principal || { id: 'p-1', name: '', position: '교장', phone: '' });
  const [localVPrincipal, setLocalVPrincipal] = useState(vPrincipal || { id: 'vp-1', name: '', position: '교감', phone: '' });
  const [localAdmin, setLocalAdmin] = useState(admin || { id: 'a-1', name: '', position: '행정실장', phone: '' });
  const [localTeachers, setLocalTeachers] = useState(teachers.length > 0 ? teachers : [{ id: 't-1', name: '', position: '담임교사', grade: '', classNm: '', phone: '', role: '인솔교사' }]);

  useEffect(() => {
    if (principal) setLocalPrincipal(principal);
    if (vPrincipal) setLocalVPrincipal(vPrincipal);
    if (admin) setLocalAdmin(admin);
    if (teachers.length > 0) setLocalTeachers(teachers);
  }, [principal, vPrincipal, admin, teachers]);

  const handleSave = () => {
    setStaffManual({
      principal: localPrincipal,
      vPrincipal: localVPrincipal,
      admin: localAdmin,
      teachers: localTeachers,
    });
    toast.success('교직원 정보가 마이페이지에 저장되었습니다.');
  };

  const addTeacher = () => {
    setLocalTeachers([...localTeachers, { id: `t-${Date.now()}`, name: '', position: '담임교사', grade: '', classNm: '', phone: '', role: '인솔교사' }]);
  };

  const removeTeacher = (id: string) => {
    setLocalTeachers(localTeachers.filter(t => t.id !== id));
  };

  const updateTeacher = (id: string, field: string, value: string) => {
    setLocalTeachers(localTeachers.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fade-in font-sans">
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          🧑‍🏫 마이페이지 (기본 정보 설정)
        </h1>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
          저장하기
        </Button>
      </div>

      <div className="space-y-6 bg-white p-6 border rounded-xl shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 border-b pb-2">학교 관리자 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">교장 선생님 성명</label>
            <Input value={localPrincipal.name} onChange={(e) => setLocalPrincipal({ ...localPrincipal, name: e.target.value })} placeholder="홍길동" />
            <Input value={localPrincipal.phone || ''} onChange={(e) => setLocalPrincipal({ ...localPrincipal, phone: e.target.value })} placeholder="연락처" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">교감 선생님 성명</label>
            <Input value={localVPrincipal.name} onChange={(e) => setLocalVPrincipal({ ...localVPrincipal, name: e.target.value })} placeholder="이몽룡" />
            <Input value={localVPrincipal.phone || ''} onChange={(e) => setLocalVPrincipal({ ...localVPrincipal, phone: e.target.value })} placeholder="연락처" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">행정실장 성명</label>
            <Input value={localAdmin.name} onChange={(e) => setLocalAdmin({ ...localAdmin, name: e.target.value })} placeholder="성춘향" />
            <Input value={localAdmin.phone || ''} onChange={(e) => setLocalAdmin({ ...localAdmin, phone: e.target.value })} placeholder="연락처" />
          </div>
        </div>
      </div>

      <div className="space-y-6 bg-white p-6 border rounded-xl shadow-sm">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-lg font-bold text-slate-800">나의 학급 및 인솔 교사 정보</h2>
          <Button variant="outline" onClick={addTeacher} size="sm">교사 추가 +</Button>
        </div>
        
        {localTeachers.map((teacher, idx) => (
          <div key={teacher.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end border p-4 rounded-lg bg-slate-50 relative">
            {localTeachers.length > 1 && (
              <button onClick={() => removeTeacher(teacher.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm font-bold">X</button>
            )}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">교사명</label>
              <Input value={teacher.name} onChange={(e) => updateTeacher(teacher.id, 'name', e.target.value)} placeholder="이름" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">학년/반</label>
              <div className="flex gap-2">
                <Input value={teacher.grade || ''} onChange={(e) => updateTeacher(teacher.id, 'grade', e.target.value)} placeholder="학년" />
                <Input value={teacher.classNm || ''} onChange={(e) => updateTeacher(teacher.id, 'classNm', e.target.value)} placeholder="반" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">직위/역할</label>
              <Input value={teacher.position || ''} onChange={(e) => updateTeacher(teacher.id, 'position', e.target.value)} placeholder="담임교사" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">인솔역할</label>
              <Input value={teacher.role || ''} onChange={(e) => updateTeacher(teacher.id, 'role', e.target.value)} placeholder="인솔교사" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">연락처</label>
              <Input value={teacher.phone} onChange={(e) => updateTeacher(teacher.id, 'phone', e.target.value)} placeholder="010-0000-0000" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
