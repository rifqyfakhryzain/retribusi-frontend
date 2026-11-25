import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Reusable Modal & Mobile Bottom-Sheet Component
 * Mendukung prop variant="center" | "sheet".
 * Backdrop: bg-slate-900/50, radius 8px (center) atau rounded-t-2xl (sheet on mobile).
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  variant = "center", // "center" | "sheet"
  maxWidth = "max-w-md",
  className,
}) {
  // Cegah scroll pada body saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150",
        variant === "sheet"
          ? "items-end sm:items-center justify-center p-0 sm:p-4"
          : "items-center justify-center p-4"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full bg-white border border-slate-200 shadow-lg transition-transform",
          variant === "sheet"
            ? "rounded-t-2xl sm:rounded-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
            : "rounded-lg p-5 sm:p-6",
          maxWidth,
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        {(title || onClose) && (
          <div className="flex items-start justify-between pb-3.5 mb-4 border-b border-slate-200">
            <div>
              {title && (
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 -mr-1 -mt-1 p-1 rounded cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="h-4 w-4 stroke-[1.75]" />
              </button>
            )}
          </div>
        )}

        {/* Modal Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
