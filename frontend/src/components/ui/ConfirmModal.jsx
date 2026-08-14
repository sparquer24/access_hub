import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

/**
 * Shared confirmation dialog (delete/leave/discard prompts) so pages stop
 * building bespoke overlays for a yes/no decision.
 */
const ConfirmModal = ({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fadeIn">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-100' : 'bg-teal-100'}`}>
          <AlertTriangle className={`w-6 h-6 ${danger ? 'text-red-600' : 'text-teal-600'}`} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        {description && <p className="text-sm text-slate-600 mb-6">{description}</p>}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
