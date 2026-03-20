import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEMPLATE_CATEGORIES = [
  'POST_SALE_2D', 'POST_SALE_2W', 'POST_SALE_2M', 'RESTOCK', 'BIRTHDAY',
  'BILLING', 'WELCOME', 'REACTIVATION', 'CASHBACK_EXPIRING', 'PROFESSION_DAY',
] as const;

const TEMPLATES_PT_BR: Record<string, string[]> = {
  POST_SALE_2D: [
    'Oi {{nome}}! Tudo bem? Já recebeu seus produtos? Espero que esteja amando!',
    'Olá {{nome}}! Passando para saber se está gostando dos produtos. Qualquer dúvida, estou aqui!',
    '{{nome}}, como foi a experiência com os produtos? Adoraria saber sua opinião!',
    'Oi {{nome}}! Já testou tudo? Me conta o que achou!',
    'Olá {{nome}}! Espero que esteja curtindo suas comprinhas. Qualquer coisa, me chama!',
  ],
  POST_SALE_2W: [
    '{{nome}}, já faz duas semanas! Como está sendo o uso dos produtos?',
    'Oi {{nome}}! Passando para saber se os produtos estão fazendo diferença na sua rotina.',
    '{{nome}}, tudo bem? Queria saber como está seu skincare com os novos produtos!',
    'Olá {{nome}}! Duas semanas já! Me conta como está a sua experiência.',
    '{{nome}}, espero que esteja amando os resultados! Estou aqui para qualquer dúvida.',
  ],
  POST_SALE_2M: [
    '{{nome}}, dois meses já! Está na hora de repor algum produto?',
    'Oi {{nome}}! Como andam os produtos? Já precisa de reposição?',
    '{{nome}}, passando para lembrar que estou aqui para quando precisar repor!',
    'Olá {{nome}}! Dois meses voaram! Precisa de alguma coisa nova?',
    '{{nome}}, tudo bem? Já está quase na hora de renovar seus favoritos!',
  ],
  RESTOCK: [
    '{{nome}}, vi que seu produto favorito pode estar acabando. Quer que eu separe?',
    'Oi {{nome}}! Hora de repor? Tenho novidades que você vai amar!',
    '{{nome}}, já está na hora de renovar seus produtos? Me avisa!',
    'Olá {{nome}}! Seus produtos devem estar acabando. Vamos repor?',
    '{{nome}}, passando para lembrar da reposição. Posso te ajudar?',
  ],
  BIRTHDAY: [
    'Feliz aniversário, {{nome}}! Tenho um presente especial para você!',
    '{{nome}}, parabéns pelo seu dia! Que tal um mimo especial?',
    'Feliz aniversário, {{nome}}! Preparei algo especial para comemorar!',
    '{{nome}}, muitas felicidades! Tenho uma surpresa para você!',
    'Parabéns, {{nome}}! Seu dia merece ser especial. Tenho algo para você!',
  ],
  BILLING: [
    '{{nome}}, lembrete gentil: você tem um pagamento pendente. Posso ajudar?',
    'Oi {{nome}}! Passando para lembrar do pagamento. Qualquer dúvida, me chama!',
    '{{nome}}, tudo bem? Só lembrando do pagamento pendente.',
    'Olá {{nome}}! Seu pagamento está se aproximando do vencimento.',
    '{{nome}}, lembrete amigável sobre o pagamento. Estou aqui para ajudar!',
  ],
  WELCOME: [
    'Bem-vinda, {{nome}}! Estou muito feliz em te ter como cliente!',
    'Oi {{nome}}! Seja muito bem-vinda! Estou aqui para te ajudar sempre.',
    '{{nome}}, que alegria ter você aqui! Vamos cuidar da sua beleza juntas!',
    'Olá {{nome}}! Bem-vinda! Preparei algumas dicas especiais para você.',
    '{{nome}}, seja bem-vinda! Estou à disposição para o que precisar.',
  ],
  REACTIVATION: [
    '{{nome}}, sentimos sua falta! Temos novidades incríveis para você.',
    'Oi {{nome}}! Faz tempo que não nos vemos. Que tal dar uma olhada nas novidades?',
    '{{nome}}, estamos com saudades! Tenho promoções especiais para você.',
    'Olá {{nome}}! Muita coisa nova por aqui. Vem ver!',
    '{{nome}}, faz tempo! Tenho produtos novos que combinam com você.',
  ],
  CASHBACK_EXPIRING: [
    '{{nome}}, seu cashback está expirando! Use antes que acabe.',
    'Oi {{nome}}! Não perca seu cashback — use agora!',
    '{{nome}}, lembrete: seu cashback expira em breve. Aproveite!',
    'Olá {{nome}}! Seu cashback está quase vencendo. Que tal usar?',
    '{{nome}}, corra! Seu cashback expira em poucos dias.',
  ],
  PROFESSION_DAY: [
    'Feliz dia do(a) {{nome}}! Parabéns pela sua profissão!',
    '{{nome}}, hoje é seu dia! Parabéns pela sua dedicação.',
    'Felicitações, {{nome}}! Que orgulho da sua profissão!',
    '{{nome}}, parabéns pelo seu dia profissional! Você merece!',
    'Oi {{nome}}! Feliz dia! Tenho algo especial para comemorar.',
  ],
};

export async function seedCommunicationTemplates() {
  // eslint-disable-next-line no-console
  console.log('Seeding communication templates...');

  for (const category of TEMPLATE_CATEGORIES) {
    const texts = TEMPLATES_PT_BR[category];
    if (!texts) continue;

    for (let variant = 1; variant <= 5; variant++) {
      const text = texts[variant - 1];
      if (!text) continue;

      await prisma.messageTemplate.upsert({
        where: { id: `system-${category}-${variant}` },
        update: { text },
        create: {
          id: `system-${category}-${variant}`,
          name: `${category} - Variação ${variant}`,
          category: category as 'POST_SALE_2D',
          text,
          variant,
          isSystem: true,
          locale: 'pt-BR',
        },
      });
    }
  }

  // Quick replies padrão
  const defaultQuickReplies = [
    { label: 'Obrigada', text: 'Obrigada pela preferência! Volte sempre.' },
    { label: 'Disponível', text: 'Sim, está disponível! Quer que eu separe para você?' },
    { label: 'Preço', text: 'Vou verificar o preço e te respondo rapidinho!' },
    { label: 'Entrega', text: 'A entrega pode ser combinada. Qual o melhor dia para você?' },
    { label: 'Promoção', text: 'Temos promoções especiais essa semana! Quer saber mais?' },
  ];

  // eslint-disable-next-line no-console
  console.log(`Seeded ${TEMPLATE_CATEGORIES.length * 5} templates`);
  // eslint-disable-next-line no-console
  console.log(`${defaultQuickReplies.length} quick reply suggestions available`);
}
