import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Reusable Alert Component
 * Desain ringkas berbingkai tipis 1px dengan ikon lucide-react 16px (stroke 1.75).
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
      container: "bg-rose-50 border-rose-200 text-rose-900",
      icon: AlertCircle,
      iconColor: "text-rose-600",
    },
    success: {
      container: "bg-emerald-50 border-emerald-200 text-emerald-900",
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
    },
    warning: {
      container: "bg-amber-50 border-amber-200 text-amber-900",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
    },
    info: {
      container: "bg-slate-50 border-slate-200 text-slate-800",
      icon: Info,
      iconColor: "text-slate-600",
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
        "flex items-start gap-2.5 p-3 rounded-lg border text-xs leading-relaxed transition-all",
        current.container,
        className
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0 mt-0.5 stroke-[1.75]", current.iconColor)} />
      <div className="flex-1">
        {title && <h4 className="font-semibold text-xs mb-0.5">{title}</h4>}
        <div>{content}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 -mr-1 -mt-1 p-1 rounded cursor-pointer"
          aria-label="Tutup pemberitahuan"
        >
          <X className="h-3.5 w-3.5 stroke-[1.75]" />
        </button>
      )}
    </div>
  );
}
