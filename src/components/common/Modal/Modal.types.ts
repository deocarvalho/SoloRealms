export interface ModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Function to call when the modal should close */
  onClose: () => void;
  /** Function to call when the confirm button is clicked */
  onConfirm: () => void;
  /** The title displayed at the top of the modal */
  title: string;
  /** The main message content of the modal */
  message: string;
  /** Optional text for the confirm button (defaults to 'Confirm') */
  confirmText?: string;
  /** Optional text for the cancel button (defaults to 'Cancel') */
  cancelText?: string;
} 