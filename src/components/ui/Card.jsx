import { cn } from "../../utils/cn";

/**
 * Reusable Flat Card Components
 * Sesuai aturan Anti-AI-Slop: Flat border 1px border-slate-200, rounded-lg (8px), no heavy drop shadows.
 */
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-slate-200 overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn("px-5 py-4 border-b border-slate-200 bg-white", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        "text-sm font-semibold text-slate-900 tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn("text-xs text-slate-500 mt-1", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
