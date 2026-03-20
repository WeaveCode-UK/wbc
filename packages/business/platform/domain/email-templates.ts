import type { TemplateId } from './email';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const templates: Record<string, Record<TemplateId, EmailTemplate>> = {
  'pt-BR': {
    welcome: {
      subject: 'Bem-vinda ao WBC!',
      html: '<h1>Olá, {{name}}!</h1><p>Sua conta no Wave Beauty Consultant foi criada com sucesso.</p><p>Comece a organizar suas vendas agora mesmo!</p>',
      text: 'Olá, {{name}}! Sua conta no Wave Beauty Consultant foi criada com sucesso. Comece a organizar suas vendas agora mesmo!',
    },
    otp_code: {
      subject: 'Seu código de acesso WBC',
      html: '<h1>Seu código: {{code}}</h1><p>Use este código para acessar o WBC. Ele expira em 5 minutos.</p>',
      text: 'Seu código de acesso WBC: {{code}}. Expira em 5 minutos.',
    },
    sale_confirmation: {
      subject: 'Venda confirmada — WBC',
      html: '<h1>Venda confirmada!</h1><p>Olá, {{consultantName}}. A venda #{{saleId}} no valor de R$ {{total}} foi confirmada.</p>',
      text: 'Venda #{{saleId}} no valor de R$ {{total}} confirmada.',
    },
  },
  en: {
    welcome: {
      subject: 'Welcome to WBC!',
      html: '<h1>Hello, {{name}}!</h1><p>Your Wave Beauty Consultant account has been created.</p><p>Start organizing your sales now!</p>',
      text: 'Hello, {{name}}! Your Wave Beauty Consultant account has been created. Start organizing your sales now!',
    },
    otp_code: {
      subject: 'Your WBC access code',
      html: '<h1>Your code: {{code}}</h1><p>Use this code to access WBC. It expires in 5 minutes.</p>',
      text: 'Your WBC access code: {{code}}. Expires in 5 minutes.',
    },
    sale_confirmation: {
      subject: 'Sale confirmed — WBC',
      html: '<h1>Sale confirmed!</h1><p>Hello, {{consultantName}}. Sale #{{saleId}} for R$ {{total}} has been confirmed.</p>',
      text: 'Sale #{{saleId}} for R$ {{total}} confirmed.',
    },
  },
};

export function getEmailTemplate(templateId: TemplateId, locale: string): EmailTemplate {
  const localeTemplates = templates[locale] ?? templates['pt-BR'];
  if (!localeTemplates) {
    throw new Error(`No templates found for locale: ${locale}`);
  }
  const template = localeTemplates[templateId];
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  return template;
}
