"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Mail, Lock, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login inputs
  const [email, setEmail] = useState("teacher@safety-pick.kr");
  const [password, setPassword] = useState("password123");

  // Register inputs
  const [regName, setRegName] = useState("");
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolList, setSchoolList] = useState<string[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [searchingSchool, setSearchingSchool] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate Supabase login
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push("/dashboard");
    } catch (err: any) {
      setError("이메일 혹은 비밀번호가 일치하지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSchool = async () => {
    if (!schoolQuery.trim()) return;
    setSearchingSchool(true);
    
    try {
      // Direct integration with NEIS Mock fallback
      await new Promise((resolve) => setTimeout(resolve, 600));
      const mockSchools = [
        `${schoolQuery}초등학교 (세종)`,
        `${schoolQuery}남부초등학교 (세종)`,
        `${schoolQuery}중앙초등학교 (대전)`
      ];
      setSchoolList(mockSchools);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingSchool(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool) {
      setError("소속 학교를 기입 및 검색해 선택해 주십시오.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Mock registration and caching standard schools metadata
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("회원가입이 완료되었습니다! 안전-Pick 대시보드로 이동합니다. 🎉");
      router.push("/dashboard");
    } catch (err: any) {
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-sm space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 border border-blue-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">교사용 안전-Pick</h1>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            인공지능 큐레이터 기반 안전인증 현장체험학습 자동화 플랫폼
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button 
            onClick={() => { setIsRegistering(false); setError(null); }}
            className={`flex-1 py-2.5 rounded-lg transition-all ${!isRegistering ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
          >
            로그인
          </button>
          <button 
            onClick={() => { setIsRegistering(true); setError(null); }}
            className={`flex-1 py-2.5 rounded-lg transition-all ${isRegistering ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
          >
            회원가입 (학교 캐싱)
          </button>
        </div>

        {/* Action Form */}
        {!isRegistering ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block uppercase">이메일 주소</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@safety-pick.kr" 
                  className="pl-10 py-5 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block uppercase">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <Input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="pl-10 py-5 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 font-semibold text-center">{error}</p>}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-2xl shadow-sm flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              로그인 후 계획 수립하기
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block uppercase">교사 실명</label>
              <Input 
                type="text" 
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="예: 홍길동 교사" 
                className="py-5 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block uppercase">소속 학교 검색 (NEIS API 연동)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input 
                    type="text" 
                    value={schoolQuery}
                    onChange={(e) => setSchoolQuery(e.target.value)}
                    placeholder="학교명 입력 (예: 세종)" 
                    className="pl-9 py-5 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-xl"
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={handleSearchSchool}
                  disabled={searchingSchool}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl px-4 shrink-0"
                >
                  {searchingSchool ? <Loader2 className="w-4 h-4 animate-spin" /> : "검색"}
                </Button>
              </div>

              {/* School search result drop selection */}
              {schoolList.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 max-h-32 overflow-y-auto space-y-1 mt-2 text-xs font-bold">
                  {schoolList.map((school, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setSelectedSchool(school); setSchoolList([]); }}
                      className={`p-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors ${selectedSchool === school ? "bg-blue-100 text-blue-700" : "text-slate-600"}`}
                    >
                      🏫 {school}
                    </div>
                  ))}
                </div>
              )}
              {selectedSchool && (
                <div className="text-[10px] text-emerald-600 font-bold mt-1">
                  &bull; 선택된 소속 학교: {selectedSchool}
                </div>
              )}
            </div>

            {error && <p className="text-xs text-red-500 font-semibold text-center">{error}</p>}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-2xl shadow-sm flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "학교 데이터 연동 & 회원가입"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
