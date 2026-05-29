import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import React from 'react';

interface Props {
  isOpen: boolean; onClose: () => void; title: string;
  children: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode; closeOnOverlay?: boolean;
}

const SIZE_MAP = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' } as const;

export default function Modal({ isOpen, onClose, title, children,
  size = 'md', footer, closeOnOverlay = true }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault(); (e.shiftKey ? last : first)?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-black/50"
        onClick={closeOnOverlay ? onClose : undefined} aria-hidden="true" />
      <div ref={dialogRef}
        className={`relative w-full bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh] animate-fade-in ${SIZE_MAP[size]}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h3 id="modal-title" className="text-base font-semibold text-neutral-900">{title}</h3>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100"
            aria-label="닫기">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-neutral-200 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

interface ConfirmModalProps {
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string;
  confirmLabel?: string; cancelLabel?: string; danger?: boolean;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message,
  confirmLabel = '확인', cancelLabel = '취소', danger = false }: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="secondary" size="sm" onClick={onClose}>{cancelLabel}</Button>
        <Button variant={danger ? 'danger' : 'primary'} size="sm"
          onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </>}>
      <p className="text-sm text-neutral-600">{message}</p>
    </Modal>
  );
}
