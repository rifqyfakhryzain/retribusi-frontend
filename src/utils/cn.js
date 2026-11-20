import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utilitas untuk menggabungkan class Tailwind secara fleksibel dan aman dari konflik class.
 * Menggabungkan kekuatan 'clsx' (kondisional) dan 'tailwind-merge' (resolusi konflik Tailwind).
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
