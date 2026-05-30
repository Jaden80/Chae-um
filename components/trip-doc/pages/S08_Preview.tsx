import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import { useDocumentStore, DOCUMENT_META_LIST } from '@/store/documentStore';
import { useTripStore } from '@/store/tripStore';
import type { DocumentId } from '@/types';
import Button from '@/components/trip-doc/common/Button';
import Badge from '@/components/trip-doc/common/Badge';
import { useToast } from '@/components/trip-doc/common/Toast';

export default function S08_Preview() {
  const router = useRouter();
  const toast    = useToast();

  // 서류 상태 (documentStore)
  const { documents, selectedIds, toggleSelect, selectAll, deselectAll, updateSection } = useDocumentStore();
  // 단계 이동 (tripStore)
  const { tripType, completeStep, setCurrentStep } = useTripStore();

  const [activeId, setActiveId] = useState<DocumentId | null>(null);
  const [editingSection, setEditingSection] = useState<{ docId: DocumentId; idx: number; value: string } | null>(null);

  const applicableDocs = DOCUMENT_META_LIST
    .filter((m) => tripType && m.applicableTypes.includes(tripType))
    .filter((m) => documents[m.id]?.status === 'done');

  const activeDoc = activeId ? documents[activeId] : null;

  const handleSectionSave = () => {
    if (!editingSection) return;
    updateSection(editingSection.docId, editingSection.idx, editingSection.value);
    setEditingSection(null); toast.success('내용이 수정되었습니다.');
  };

  const handleNext = () => {
    if (selectedIds.length === 0) { toast.warning('출력할 서류를 하나 이상 선택하세요.'); return; }
    completeStep(8); setCurrentStep(9); router.push('/doc-wizard/step/output');
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">STEP 6 / 7</span>
        <h1 className="text-xl font-bold text-neutral-900 mt-2">미리보기 · 편집</h1>
        <p className="text-sm text-neutral-500 mt-1">생성된 서류를 검토하고 필요한 항목을 직접 수정할 수 있습니다.</p>
      </div>

      <div className="flex gap-4">
        <div className="w-52 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-neutral-500">서류 ({applicableDocs.length}종)</p>
            <div className="flex gap-1">
              <button onClick={selectAll}   className="text-xs text-blue-600 hover:underline">전체선택</button>
              <span className="text-neutral-300">|</span>
              <button onClick={deselectAll} className="text-xs text-neutral-500 hover:underline">해제</button>
            </div>
          </div>
          <ul className="space-y-1">
            {applicableDocs.map((meta) => {
              const isSelected = selectedIds.includes(meta.id);
              const isActive   = activeId === meta.id;
              const doc        = documents[meta.id];
              return (
                <li key={meta.id}>
                  <div className={`flex items-start gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors
                    ${isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-neutral-50'}`}
                    onClick={() => setActiveId(meta.id)}>
                    <input type="checkbox" checked={isSelected}
                      onChange={(e) => { e.stopPropagation(); toggleSelect(meta.id); }}
                      className="mt-0.5 shrink-0 accent-blue-600" />
                    <div className="min-w-0">
                      <p className={`text-xs font-medium leading-tight truncate ${isActive ? 'text-blue-600' : 'text-neutral-700'}`}>
                        {meta.title}
                      </p>
                      {doc?.editedAt && <p className="text-xs text-amber-500 mt-0.5">수정됨</p>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 pt-3 border-t border-neutral-200">
            <p className="text-xs text-neutral-500">{selectedIds.length}종 선택됨</p>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {activeDoc ? (
            <div className="card">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200">
                <h2 className="text-base font-bold">{activeDoc.content?.title ?? activeDoc.meta.title}</h2>
                {activeDoc.editedAt && <Badge variant="warning" size="sm">수정됨</Badge>}
              </div>
              <div className="space-y-5">
                {activeDoc.content?.sections.map((section, idx) => (
                  <div key={idx}>
                    {section.heading && (
                      <h3 className="text-sm font-bold text-blue-600 mb-2 pb-1 border-b border-blue-100">{section.heading}</h3>
                    )}
                    {section.tableData && section.tableData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <tbody>
                            {section.tableData.map((row, ri) => (
                              <tr key={ri} className={ri === 0 ? 'bg-neutral-100' : 'border-b border-neutral-100'}>
                                {row.map((cell, ci) => (
                                  <td key={ci} className={`px-2 py-1.5 border border-neutral-200 ${ri === 0 ? 'font-semibold text-neutral-600' : 'text-neutral-700'}`}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      editingSection?.docId === activeDoc.id && editingSection.idx === idx ? (
                        <div>
                          <textarea value={editingSection.value}
                            onChange={(e) => setEditingSection((p) => p ? { ...p, value: e.target.value } : p)}
                            rows={Math.max(4, editingSection.value.split('\n').length + 1)}
                            className="input-base resize-y text-xs font-mono" autoFocus />
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={handleSectionSave}>저장</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingSection(null)}>취소</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative">
                          <div className="prose prose-sm max-w-none text-neutral-700 leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {section.body}
                            </ReactMarkdown>
                          </div>
                          <button onClick={() => setEditingSection({ docId: activeDoc.id, idx, value: section.body })}
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-blue-600 bg-white border border-blue-200 px-2 py-0.5 rounded shadow-sm">
                            수정
                          </button>
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card flex items-center justify-center h-48 text-neutral-400">
              <p className="text-sm">왼쪽에서 서류를 선택하세요</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="secondary" onClick={() => router.push('/doc-wizard/step/generate')}>이전</Button>
        <Button onClick={handleNext} disabled={selectedIds.length === 0}
          iconRight={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}>
          출력
        </Button>
      </div>
    </div>
  );
}
