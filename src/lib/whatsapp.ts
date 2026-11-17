import { site } from "@/config/site";

/** A wa.me link to the business number, or null if the number isn't set yet. */
export function whatsappLink(text: string): string | null {
  const n = site.whatsappNumber.replace(/\D/g, "");
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

/** A "share to anyone" WhatsApp link (no number). Never put health details in here except the opt-in share URL. */
export function whatsappShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
