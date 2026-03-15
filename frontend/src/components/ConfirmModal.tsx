import { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ open, title, description, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-card-lg w-full max-w-sm mx-4 animate-scale-in overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-red-500" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </div>
          <h3 className="text-[16px] font-display font-semibold text-label-primary">
            {title}
          </h3>
          <p className="text-[13px] text-label-tertiary mt-1.5 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex gap-2.5 px-6 pb-6 pt-2">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1 py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center px-5 py-2.5 bg-red-500 text-white font-semibold text-[13px] rounded-xl transition-all duration-200 hover:bg-red-600 active:scale-[0.97]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
