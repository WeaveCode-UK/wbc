export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export type TemplateId = 'welcome' | 'otp_code' | 'sale_confirmation';

export interface TemplateVars {
  [key: string]: string | number;
}

export function renderTemplate(template: string, vars: TemplateVars): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return result;
}
