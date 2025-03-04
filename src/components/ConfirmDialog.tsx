import { useTheme } from "../contexts/ThemeContext";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
}: ConfirmDialogProps) => {
  const { darkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 p-4">
      <div
        className={`w-full max-w-md rounded-xl shadow-lg ${
          darkMode ? "bg-gray-800" : "bg-white"
        } overflow-hidden p-6`}
      >
        <h3
          className={`text-xl font-semibold mb-2 ${
            type === "danger"
              ? "text-red-500"
              : type === "warning"
              ? "text-amber-500"
              : "text-blue-500"
          }`}
        >
          {title}
        </h3>
        <p className={`mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          {message}
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-lg ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            } transition-all duration-200 hover:cursor-pointer font-medium`}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:cursor-pointer ${
              type === "danger"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : type === "warning"
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
