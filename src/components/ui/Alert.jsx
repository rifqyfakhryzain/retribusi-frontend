import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Reusable Alert Component
 * Digunakan untuk menampilkan feedback response (sukses, validasi error 400, unauthorized 401).
 */
export default function Alert({
  variant,
  type,
  title,
  message,
  children,
  onClose,
  className,
}) {
  const configs = {
    error: {
      container: "bg-red-50 border-red-200 text-red-800",
      icon: AlertCircle,
      iconColor: "text-red-500",
    },
    success: {
      container: "bg-green-50 border-green-200 text-green-800",
      icon: CheckCircle2,
      iconColor: "text-green-500",
    },
    warning: {
      container: "bg-amber-50 border-amber-200 text-amber-800",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
    },
    info: {
      container: "bg-blue-50 border-blue-200 text-blue-800",
      icon: Info,
      iconColor: "text-blue-500",
    },
  };

  const alertVariant = variant || type || "error";
  const current = configs[alertVariant] || configs.error;
  const content = children || message;
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-lg border text-sm transition-all animate-in fade-in duration-200",
        current.container,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", current.iconColor)} />
      <div className="flex-1">
        {title && <h4 className="font-semibold mb-0.5">{title}</h4>}
        <div className="text-sm leading-relaxed">{content}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 -mr-1 -mt-1 p-1 rounded-md"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
