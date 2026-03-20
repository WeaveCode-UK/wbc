export function generateDeepLink(phone: string, message: string): string {
  // Remove + from phone for wa.me format
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export function personalizeMessage(template: string, clientName: string): string {
  return template.replace(/\{\{nome\}\}/g, clientName);
}

export function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, '');
}
