import type { EmailPort } from '../ports/email-port';
import type { TemplateId, TemplateVars } from '../domain/email';
import { renderTemplate } from '../domain/email';
import { getEmailTemplate } from '../domain/email-templates';

export interface SendTemplateEmailInput {
  to: string;
  templateId: TemplateId;
  locale: string;
  vars: TemplateVars;
}

export async function sendTemplateEmail(
  input: SendTemplateEmailInput,
  emailPort: EmailPort,
): Promise<{ success: boolean; messageId?: string }> {
  const template = getEmailTemplate(input.templateId, input.locale);

  const html = renderTemplate(template.html, input.vars);
  const text = renderTemplate(template.text, input.vars);
  const subject = renderTemplate(template.subject, input.vars);

  return emailPort.send({
    to: input.to,
    subject,
    html,
    text,
  });
}
