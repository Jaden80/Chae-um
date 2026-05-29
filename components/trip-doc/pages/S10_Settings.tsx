import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore, type ApiProvider } from '@/store/settingsStore';
import { API_TEST_FUNCTIONS } from '@/utils/apiClient';
import Button from '@/components/trip-doc/common/Button';
import Input  from '@/components/trip-doc/common/Input';
import Badge  from '@/components/trip-doc/common/Badge';
import { useToast } from '@/components/trip-doc/common/Toast';

interface ApiRowProps { provider: ApiProvider; label: string; required: boolean; placeholder: string; description: string; }

function ApiRow({ provider, label, required, placeholder, description }: ApiRowProps) {
  const toast = useToast();
  const { settings, updateApiKey, updateApiStatus, getMaskedKey, getRawKey } = useSettingsStore();
  const config = settings[provider];
  const [editing, setEditing] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [testing, setTesting] = useState(false);

  const handleSave = () => { updateApiKey(provider, tempKey.trim()); setEditing(false); toast.info(`${label} API Key가 저장되었습니다.`); };
  const handleTest = async () => {
    const key = getRawKey(provider);
    if (!key) { toast.warning('API Key를 먼저 입력하세요.'); return; }
    setTesting(true); updateApiStatus(provider, 'testing');
    try {
      const ok = await API_TEST_FUNCTIONS[provider](key);
      updateApiStatus(provider, ok ? 'ok' : 'error', ok ? undefined : '연결 실패');
      toast[ok ? 'success' : 'error'](ok ? `${label} 연결 성공` : `${label} 연결 실패`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '테스트 실패';
      updateApiStatus(provider, 'error', msg); toast.error(msg);
    } finally { setTesting(false); }
  };

  const stBadge = () => {
    const m = { untested:{v:'default' as const,t:'미테스트'}, testing:{v:'info' as const,t:'테스트 중'},
                ok:{v:'success' as const,t:'연결됨'}, error:{v:'danger' as const,t:'오류'} };
    const status = config.key ? config.status : (getRawKey(provider) ? 'ok' : 'untested');
    const { v, t } = m[status]; return <Badge variant={v} dot>{t}</Badge>;
  };

  return (
    <div className="py-4 border-b border-neutral-100 last:border-0">
      <div className="flex items-center gap-2 mb-0.5">
        <p className="text-sm font-semibold">{label}</p>
        {required ? <Badge variant="danger" size="sm">필수</Badge> : <Badge size="sm">권장</Badge>}
        {stBadge()}
      </div>
      <p className="text-xs text-neutral-500 mb-2">{description}</p>
      {editing ? (
        <div className="flex gap-2">
          <Input type="password" value={tempKey} onChange={(e) => setTempKey(e.target.value)}
            placeholder={placeholder} className="flex-1" autoFocus />
          <Button size="sm" onClick={handleSave}>저장</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>취소</Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-neutral-100 px-3 py-1.5 rounded font-mono text-neutral-600">
            {getRawKey(provider) ? getMaskedKey(provider) : '미설정'}
          </code>
          <Button size="sm" variant="secondary" onClick={() => { setTempKey(getRawKey(provider)); setEditing(true); }}>
            {getRawKey(provider) ? '변경' : '입력'}
          </Button>
          <Button size="sm" variant="secondary" onClick={handleTest} loading={testing} disabled={!getRawKey(provider)}>테스트</Button>
        </div>
      )}
      {config.errorMessage && config.status === 'error' && <p className="text-xs text-red-500 mt-1">{config.errorMessage}</p>}
      {config.lastTestedAt && config.status === 'ok' && (
        <p className="text-xs text-neutral-400 mt-1">마지막 테스트: {new Date(config.lastTestedAt).toLocaleString('ko-KR')}</p>
      )}
    </div>
  );
}

export default function S10_Settings() {
  const router = useRouter();
  const toast    = useToast();
  const { settings, updateAppConfig } = useSettingsStore();
  const [cfg, setCfg] = useState({
    schoolYear: settings.schoolYear, outputFormat: settings.outputFormat,
    sessionTimeoutMin: settings.sessionTimeoutMin, autoSaveIntervalSec: settings.autoSaveIntervalSec,
    appAOrigin: settings.appAOrigin,
  });

  const API_ROWS: ApiRowProps[] = [
    { provider:'neis',      label:'NEIS Open API',         required:true,  placeholder:'NEIS API Key 입력',         description:'학교 검색·학급 정보 자동 조회에 사용됩니다.' },
    { provider:'gemini',    label:'Google Gemini API',     required:true,  placeholder:'Gemini API Key (AIza...)',  description:'서류 초안 자동 생성에 사용됩니다.' },
    { provider:'kakao',     label:'카카오 REST API',        required:false, placeholder:'카카오 App Key 입력',        description:'장소 검색·경로·인근 병원 조회에 사용됩니다.' },
    { provider:'weather',   label:'기상청 API (공공데이터포털)', required:false, placeholder:'공공데이터포털 API Key', description:'체험학습 당일 날씨 예보 조회에 사용됩니다.' },
    { provider:'dataGovKr', label:'Data.go.kr 관광 API',   required:false, placeholder:'한국관광공사 API Key',       description:'체험학습 장소 상세 정보 조회에 사용됩니다.' },
  ];

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-xl font-bold">환경 설정</h1><p className="text-sm text-neutral-500 mt-1">API Key 및 앱 기본 설정을 관리합니다.</p></div>
        <Button variant="ghost" size="sm" onClick={() => router.push(-1)}>뒤로</Button>
      </div>

      <div className="card mb-5">
        <h2 className="text-sm font-bold mb-1">API Key 설정</h2>
        <p className="text-xs text-neutral-500 mb-4">API Key는 브라우저 localStorage에 저장됩니다. Cloud Functions Proxy를 통해서만 외부 API에 전달됩니다.</p>
        {API_ROWS.map((row) => <ApiRow key={row.provider} {...row} />)}
      </div>

      <div className="card mb-5 space-y-4">
        <h2 className="text-sm font-bold">앱 기본 설정</h2>
        <Input label="학년도" value={cfg.schoolYear} onChange={(e) => setCfg((p) => ({ ...p, schoolYear: e.target.value }))} hint="NEIS 학급 조회 시 사용됩니다." placeholder="예: 2026" />
        <div>
          <label className="text-sm font-medium text-neutral-700 block mb-1">기본 출력 형식</label>
          <div className="flex gap-2">
            {(['pdf','docx'] as const).map((fmt) => (
              <button key={fmt} onClick={() => setCfg((p) => ({ ...p, outputFormat: fmt }))}
                className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-colors
                  ${cfg.outputFormat === fmt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-neutral-700 border-neutral-300 hover:border-blue-400'}`}>
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <Input label="세션 만료 시간 (분)" type="number" min={10} max={240} value={cfg.sessionTimeoutMin}
          onChange={(e) => setCfg((p) => ({ ...p, sessionTimeoutMin: parseInt(e.target.value) || 60 }))} hint="학생 데이터 자동 삭제 기준 시간" />
        <Input label="App-A 연동 도메인" value={cfg.appAOrigin} onChange={(e) => setCfg((p) => ({ ...p, appAOrigin: e.target.value }))}
          placeholder="https://your-app-a.web.app" hint="App-A에서 장소 정보를 전달받을 도메인 (CORS 허용)" />
        <Button onClick={() => { updateAppConfig(cfg); toast.success('설정이 저장되었습니다.'); }} fullWidth>설정 저장</Button>
      </div>

      <div className="text-center text-xs text-neutral-400 pb-4">Trip-Doc v1.0.0 · Google Anti-Gravity · Firebase Hosting</div>
    </div>
  );
}
