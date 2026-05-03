export function buildWhatsAppUrl(phone?: string | null, message?: string) {
  const digits = phone?.replace(/\D/g, "");
  if (!digits) return null;

  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";

  return `https://wa.me/${normalized}${text}`;
}