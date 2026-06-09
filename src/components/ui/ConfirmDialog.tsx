'use client';

import React from 'react';

export type DialogVariant = 'confirm' | 'success' | 'error' | 'info';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Called when the user clicks Confirm (or OK for non-confirm dialogs) */
  onConfirm: () => void;
  /** Called when user clicks Cancel or the backdrop. Not shown for info/success/error dialogs. */
  onCancel?: () => void;
}

const icons: Record<DialogVariant, React.ReactNode> = {
  confirm: (
    <svg className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  success: (
    <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
    </svg>
  ),
};

const iconBg: Record<DialogVariant, string> = {
  confirm: 'bg-rose-50',
  success: 'bg-emerald-50',
  error: 'bg-rose-50',
  info: 'bg-indigo-50',
};

const confirmBtnCls: Record<DialogVariant, string> = {
  confirm: 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500',
  success: 'bg-emerald-600 hover:bg-emerald-500 focus:ring-emerald-500',
  error: 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500',
  info: 'bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500',
};

export function ConfirmDialog({
  open,
  title,
  message,
  variant = 'confirm',
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isActionOnly = variant === 'success' || variant === 'error' || variant === 'info';
  const okLabel = confirmLabel ?? (isActionOnly ? 'OK' : 'Confirm');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={isActionOnly ? onConfirm : onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + Title */}
        <div className="flex items-start gap-4">
          <div className={`shrink-0 flex items-center justify-center h-11 w-11 rounded-full ${iconBg[variant]}`}>
            {icons[variant]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          {!isActionOnly && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer ${confirmBtnCls[variant]}`}
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hook for easy imperative usage ──────────────────────────────────────────
interface DialogState {
  open: boolean;
  title: string;
  message: string;
  variant: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const CLOSED: DialogState = {
  open: false,
  title: '',
  message: '',
  variant: 'info',
  onConfirm: () => {},
  onCancel: () => {},
};

export function useDialog() {
  const [state, setState] = React.useState<DialogState>(CLOSED);

  const close = () => setState(CLOSED);

  /** Ask a yes/no question. Returns a promise resolving to true (confirmed) or false (cancelled). */
  const confirm = (title: string, message: string, confirmLabel = 'Confirm'): Promise<boolean> =>
    new Promise((resolve) => {
      setState({
        open: true,
        title,
        message,
        variant: 'confirm',
        confirmLabel,
        onConfirm: () => { close(); resolve(true); },
        onCancel: () => { close(); resolve(false); },
      });
    });

  /** Show an info/success/error toast-style dialog. Returns a promise resolving when dismissed. */
  const notify = (
    title: string,
    message: string,
    variant: 'success' | 'error' | 'info' = 'info',
  ): Promise<void> =>
    new Promise((resolve) => {
      setState({
        open: true,
        title,
        message,
        variant,
        onConfirm: () => { close(); resolve(); },
        onCancel: () => { close(); resolve(); },
      });
    });

  const dialogProps: ConfirmDialogProps = {
    ...state,
    onCancel: state.onCancel,
  };

  return { dialogProps, confirm, notify };
}
