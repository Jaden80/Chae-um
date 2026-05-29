"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

interface SchoolInfoProps {
  schoolName: string;
  address: string;
  grade: string;
  teacherName: string;
}

const STORAGE_KEY = "safety_pick_teacher_profile";

export function SchoolInfoCard({ schoolName, address, grade, teacherName }: SchoolInfoProps) {
  // Read from localStorage — show actual (unmasked) values for the logged-in teacher
  const [displaySchool, setDisplaySchool] = useState(schoolName);
  const [displayAddress, setDisplayAddress] = useState(address);
  const [displayGrade, setDisplayGrade] = useState(grade);
  const [displayTeacher, setDisplayTeacher] = useState(teacherName);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.schoolName)  setDisplaySchool(p.schoolName);
        if (p.schoolAddress) setDisplayAddress(p.schoolAddress);
        if (p.grade) setDisplayGrade(`${p.grade}학년`);
        if (p.teacherName) setDisplayTeacher(p.teacherName);
      }
    } catch {}

    // Also listen for real-time profile changes from TeacherProfileButton
    const handler = (e: any) => {
      const p = e.detail;
      if (p.schoolName)  setDisplaySchool(p.schoolName);
      if (p.schoolAddress) setDisplayAddress(p.schoolAddress);
      if (p.grade) setDisplayGrade(`${p.grade}학년`);
      if (p.teacherName) setDisplayTeacher(p.teacherName);
    };
    window.addEventListener("teacherProfileChanged", handler);
    return () => window.removeEventListener("teacherProfileChanged", handler);
  }, []);

  return (
    <Card className="bg-white/80 backdrop-blur-md shadow-sm border-slate-200">
      <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-500" />
            {displaySchool}
            <span className="text-sm font-medium text-slate-500">
              ({displayAddress})
            </span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            담당: {displayTeacher} 선생님 · {displayGrade}
          </p>
        </div>
        <div className="flex gap-2">
          {/* 배지 같은 정보 표시 가능 */}
        </div>
      </CardContent>
    </Card>
  );
}
