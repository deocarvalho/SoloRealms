import { ModalProps } from './Modal.types';

/**
 * A reusable modal component that displays a confirmation dialog.
 * 
 * @example
 * ```tsx
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onConfirm={handleConfirm}
 *   title="Confirm Action"
 *   message="Are you sure you want to proceed?"
 * />
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 id="modal-title" className="text-xl font-semibold mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            aria-label="Cancel"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            aria-label="Confirm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 