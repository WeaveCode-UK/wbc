import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// ACH-044 seguranca: refuse to seed in production. The demo data includes a
// fixed password ("Teste@123") and well-known UUIDs — running against a
// production DB would either silently overwrite real records or stamp a
// known-credentials account into the live workspace. The bypass exists so
// genuine internal automation can opt in explicitly.
function assertSafeEnvironment(): void {
  const env = process.env.NODE_ENV ?? "development";
  if (env === "production" && process.env.WBC_ALLOW_PROD_SEED !== "1") {
    throw new Error(
      "Refusing to run prisma seed in NODE_ENV=production. Set WBC_ALLOW_PROD_SEED=1 to override (and only do so when you know what you are doing).",
    );
  }
}

async function main() {
  assertSafeEnvironment();
  // eslint-disable-next-line no-console
  console.log("Seeding WBC Platform...");

  // 1. Create system brands
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { id: "00000000-0000-0000-0000-000000000001" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Mary Kay",
        isSystem: true,
      },
    }),
    prisma.brand.upsert({
      where: { id: "00000000-0000-0000-0000-000000000002" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000002",
        name: "Avon",
        isSystem: true,
      },
    }),
    prisma.brand.upsert({
      where: { id: "00000000-0000-0000-0000-000000000003" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000003",
        name: "Natura",
        isSystem: true,
      },
    }),
    prisma.brand.upsert({
      where: { id: "00000000-0000-0000-0000-000000000004" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000004",
        name: "Jequiti",
        isSystem: true,
      },
    }),
    prisma.brand.upsert({
      where: { id: "00000000-0000-0000-0000-000000000005" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000005",
        name: "Boticário",
        isSystem: true,
      },
    }),
  ]);

  // eslint-disable-next-line no-console
  console.log(`Created ${brands.length} system brands`);

  // 2. Create demo tenant (Auth 2.0 — no phone/email/role/plan on Tenant)
  const tenant = await prisma.tenant.upsert({
    where: { slug: "renata-cosmeticos" },
    update: {},
    create: {
      name: "Renata Cosméticos",
      slug: "renata-cosmeticos",
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Demo tenant: ${tenant.id}`);

  // 2b. Create Auth 2.0 Accounts
  const adminAccount = await prisma.account.upsert({
    where: { email: "admin@weavecode.co.uk" },
    update: {},
    create: {
      email: "admin@weavecode.co.uk",
      name: "Robson Admin",
      passwordHash: null, // usa OAuth
      emailVerified: new Date(),
    },
  });

  const consultantPasswordHash = await bcrypt.hash("Teste@123", 12);
  const consultantAccount = await prisma.account.upsert({
    where: { email: "renata@teste.com" },
    update: {},
    create: {
      email: "renata@teste.com",
      name: "Renata Silva",
      passwordHash: consultantPasswordHash,
      emailVerified: new Date(),
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    `Created accounts: admin=${adminAccount.id}, consultant=${consultantAccount.id}`,
  );

  // 2c. Create TenantMembers
  await prisma.tenantMember.upsert({
    where: {
      accountId_tenantId: {
        accountId: consultantAccount.id,
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      accountId: consultantAccount.id,
      tenantId: tenant.id,
      role: "ADMIN",
      phone: "11999990000",
      displayName: "Renata Silva",
    },
  });

  await prisma.tenantMember.upsert({
    where: {
      accountId_tenantId: { accountId: adminAccount.id, tenantId: tenant.id },
    },
    update: {},
    create: {
      accountId: adminAccount.id,
      tenantId: tenant.id,
      role: "ADMIN",
    },
  });

  // eslint-disable-next-line no-console
  console.log("Created tenant members");

  // 2d. Create sample Invite
  await prisma.invite.create({
    data: {
      tenantId: tenant.id,
      email: "convidada@teste.com",
      role: "CONSULTANT",
      invitedBy: adminAccount.id,
      token: randomUUID(),
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // eslint-disable-next-line no-console
  console.log("Created sample invite");

  // 3. Create subscription
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      plan: "PRO",
      status: "ACTIVE",
      startsAt: new Date(),
    },
  });

  // 4. Create 50 clients
  const clientNames = [
    "Ana Silva",
    "Beatriz Santos",
    "Carla Oliveira",
    "Daniela Costa",
    "Eduarda Lima",
    "Fernanda Souza",
    "Gabriela Pereira",
    "Helena Rodrigues",
    "Isabela Almeida",
    "Julia Ferreira",
    "Karen Nascimento",
    "Larissa Barbosa",
    "Marina Ribeiro",
    "Natalia Gomes",
    "Olivia Martins",
    "Patricia Araujo",
    "Quiteria Cardoso",
    "Renata Melo",
    "Sandra Cavalcanti",
    "Tatiana Dias",
    "Ursula Moraes",
    "Vanessa Teixeira",
    "Wanda Pinto",
    "Ximena Castro",
    "Yasmin Monteiro",
    "Alice Duarte",
    "Bruna Correia",
    "Camila Nunes",
    "Diana Vieira",
    "Elisa Freitas",
    "Fabiana Mendes",
    "Gisele Carvalho",
    "Heloisa Ramos",
    "Irene Azevedo",
    "Joana Lopes",
    "Katia Miranda",
    "Luana Rocha",
    "Marcia Campos",
    "Nadia Batista",
    "Otilia Moreira",
    "Priscila Fonseca",
    "Raquel Andrade",
    "Simone Barros",
    "Tereza Cunha",
    "Valeria Machado",
    "Zelia Sampaio",
    "Amanda Nogueira",
    "Bianca Pires",
    "Cristina Dantas",
    "Debora Vasconcelos",
  ];

  const skinTypes = [
    "OILY",
    "DRY",
    "COMBINATION",
    "NORMAL",
    "SENSITIVE",
  ] as const;
  const hairTypes = ["STRAIGHT", "WAVY", "CURLY", "COILY"] as const;
  const classifications = ["A", "B", "C"] as const;

  const clients = [];
  for (let i = 0; i < 50; i++) {
    const client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        name: clientNames[i] ?? `Cliente ${i + 1}`,
        phone: `+55119${String(i).padStart(8, "0")}`,
        email: `cliente${i + 1}@demo.com`,
        skinType: skinTypes[i % skinTypes.length],
        hairType: hairTypes[i % hairTypes.length],
        classification: classifications[i < 10 ? 0 : i < 25 ? 1 : 2],
        source: "MANUAL",
        isActive: true,
      },
    });
    clients.push(client);
  }

  // eslint-disable-next-line no-console
  console.log(`Created ${clients.length} clients`);

  // 5. Create products (30 per brand = 150 total)
  const categories = ["skincare", "makeup", "fragrance", "haircare", "body"];
  const productNames = [
    "Creme Hidratante",
    "Base Líquida",
    "Perfume",
    "Shampoo",
    "Sabonete",
    "Protetor Solar",
    "Batom",
    "Colônia",
    "Condicionador",
    "Loção Corporal",
    "Sérum Facial",
    "Pó Compacto",
    "Desodorante",
    "Máscara Capilar",
    "Óleo Corporal",
    "Tônico Facial",
    "Rímel",
    "Body Splash",
    "Leave-in",
    "Esfoliante",
    "Máscara Facial",
    "Blush",
    "Eau de Parfum",
    "Creme para Pentear",
    "Manteiga Corporal",
    "Água Micelar",
    "Sombra",
    "Deo Colônia",
    "Spray Finalizador",
    "Creme para Mãos",
  ];

  const products = [];
  for (const brand of brands) {
    for (let i = 0; i < 30; i++) {
      const price = 30 + Math.random() * 200;
      const product = await prisma.product.create({
        data: {
          tenantId: tenant.id,
          brandId: brand.id,
          name: `${productNames[i % productNames.length]} ${brand.name}`,
          price: Math.round(price * 100) / 100,
          costPrice: Math.round(price * 0.6 * 100) / 100,
          category: categories[i % categories.length],
          isActive: true,
        },
      });
      products.push(product);

      // Create stock
      await prisma.stock.create({
        data: {
          tenantId: tenant.id,
          productId: product.id,
          quantity: Math.floor(Math.random() * 50) + 5,
          minAlert: 5,
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Created ${products.length} products with stock`);

  // 6. Create 100 sales
  for (let i = 0; i < 100; i++) {
    const client = clients[i % clients.length];
    if (!client) continue;
    const numItems = 1 + Math.floor(Math.random() * 3);
    const items = [];
    let total = 0;

    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      if (!product) continue;
      const quantity = 1 + Math.floor(Math.random() * 3);
      const unitPrice = Number(product.price);
      const subtotal = quantity * unitPrice;
      total += subtotal;
      items.push({ productId: product.id, quantity, unitPrice, subtotal });
    }

    const sale = await prisma.sale.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        status: i < 70 ? "DELIVERED" : i < 85 ? "CONFIRMED" : "DRAFT",
        total,
        paymentMethod: ["CASH", "PIX", "CREDIT_CARD"][i % 3] as
          | "CASH"
          | "PIX"
          | "CREDIT_CARD",
        items: { create: items },
      },
    });

    // Create payment
    if (sale.status !== "DRAFT") {
      await prisma.payment.create({
        data: {
          saleId: sale.id,
          amount: total,
          dueDate: new Date(),
          status: sale.status === "DELIVERED" ? "PAID" : "PENDING",
          paidAt: sale.status === "DELIVERED" ? new Date() : null,
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log("Created 100 sales with payments");

  // 7. Create 10 expenses
  const expenseDescriptions = [
    "Gasolina",
    "Embalagens",
    "Material de divulgação",
    "Brindes para clientes",
    "Almoço com equipe",
    "Impressão de catálogos",
    "Uber para entregas",
    "Caixas para envio",
    "Internet do mês",
    "Papelaria",
  ];

  for (let i = 0; i < 10; i++) {
    await prisma.expense.create({
      data: {
        tenantId: tenant.id,
        description: expenseDescriptions[i] ?? `Despesa ${i + 1}`,
        amount: 20 + Math.random() * 200,
        category: i < 5 ? "operacional" : "marketing",
        date: new Date(2026, 2, 1 + i),
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log("Created 10 expenses");

  // F11.E12: 50 system message templates (10 categories × 5 variations).
  // tenantId=null marks them as system templates so every tenant sees
  // them in the picker. The seed leaves them in place across resets.
  const TEMPLATE_VARIANTS: Record<string, { name: string; texts: string[] }> = {
    RESTOCK: {
      name: "Reposição",
      texts: [
        "Oi {{nome}}! Que tal repor o {{produto}}? 💜",
        "{{nome}}, seu {{produto}} já deve estar acabando — quer que eu separe um novo?",
        "Olá {{nome}}, percebi que faz tempo do último {{produto}}. Posso reservar?",
        "Hey {{nome}}! Hora de garantir mais {{produto}} antes que acabe? ✨",
        "{{nome}}, novidade: {{produto}} disponível. Já te separo? 💄",
      ],
    },
    BIRTHDAY: {
      name: "Aniversário",
      texts: [
        "Feliz aniversário, {{nome}}! 🎉🎂",
        "{{nome}}, seu dia chegou! Que esse ano traga muito brilho ✨",
        "Parabéns, {{nome}}! 🎁 Tenho um mimo separado pra você.",
        "Feliz aniversário, querida {{nome}}! Beijo no coração 💜",
        "Hoje é o dia da {{nome}}! Te desejo um ano maravilhoso 🥂",
      ],
    },
    PROFESSION_DAY: {
      name: "Dia da profissão",
      texts: [
        "Hoje é o seu dia, {{nome}}! Parabéns pela profissão 💜",
        "Feliz dia, {{nome}}! Sua dedicação inspira ✨",
        "{{nome}}, parabéns pelo dia da sua profissão! 🎉",
        "Hoje é o dia de quem faz a diferença — feliz dia, {{nome}}!",
        "{{nome}}, um beijo carinhoso no seu dia profissional 💄",
      ],
    },
    PROMOTION: {
      name: "Promoção",
      texts: [
        "{{nome}}, promoção exclusiva pra você esta semana 🔥",
        "Não perde, {{nome}}: até {{desconto}}% off em {{produto}}!",
        "{{nome}}, lançamento + condição especial só pra clientes VIP ✨",
        "Combo {{nome}}: {{produto}} com brinde até sexta 🎁",
        "{{nome}}, garantiu desconto de {{desconto}}% — vagas limitadas!",
      ],
    },
    POST_SALE_2D: {
      name: "Pós-venda 2 dias",
      texts: [
        "Oi {{nome}}, recebeu o {{produto}}? Tá amando? 💜",
        "{{nome}}, sua compra chegou bem? Me conta as primeiras impressões!",
        "Olá {{nome}}! Como está sendo a experiência com {{produto}}?",
        "{{nome}}, tudo certo com a entrega? Ficou tudo do seu jeito?",
        "Hey {{nome}}, o {{produto}} já tá fazendo sucesso aí? ✨",
      ],
    },
    POST_SALE_2W: {
      name: "Pós-venda 2 semanas",
      texts: [
        "{{nome}}, depois de duas semanas — como tá indo o {{produto}}?",
        "Oi {{nome}}, já viu resultado do {{produto}}? 💜",
        "{{nome}}, tudo bem? O {{produto}} virou rotina ou ainda tá conhecendo?",
        "Como tá a sensação do {{produto}} duas semanas depois, {{nome}}?",
        "{{nome}}, alguma dúvida sobre o uso do {{produto}}? Posso ajudar.",
      ],
    },
    POST_SALE_2M: {
      name: "Pós-venda 2 meses",
      texts: [
        "{{nome}}, dois meses se passaram — quer renovar o {{produto}}?",
        "Oi {{nome}}, vamos repor seu {{produto}} preferido? 💜",
        "{{nome}}, hora de se cuidar de novo. Posso separar mais {{produto}}?",
        "{{nome}}, o {{produto}} já era — bora renovar? ✨",
        "Olá {{nome}}, faz dois meses do seu {{produto}}. Continuo seu cuidado?",
      ],
    },
    BILLING: {
      name: "Cobrança",
      texts: [
        "Oi {{nome}}, lembrete da parcela que vence dia {{vencimento}} 💜",
        "{{nome}}, sua parcela de {{valor}} vence essa semana — posso te enviar o PIX?",
        "Olá {{nome}}, posso já te mandar o boleto da parcela? Vence em breve.",
        "{{nome}}, pagamento de {{valor}} pendente. Quer combinar uma data?",
        "Oi {{nome}}, tudo bem? Passando pra te lembrar do pagamento de {{valor}} 🌸",
      ],
    },
    WELCOME: {
      name: "Boas-vindas",
      texts: [
        "Bem-vinda, {{nome}}! Conta comigo no que precisar 💜",
        "Oi {{nome}}! Que bom ter você como cliente ✨",
        "{{nome}}, seja muito bem-vinda! Estou aqui pra te ajudar.",
        "{{nome}}, é um prazer te receber! Vamos cuidar de você 💄",
        "Olá {{nome}}, obrigada por confiar em mim. Estamos juntas! 🌸",
      ],
    },
    REACTIVATION: {
      name: "Reativação",
      texts: [
        "{{nome}}, faz um tempinho! 💜 Tem alguma novidade que você quer experimentar?",
        "Oi {{nome}}, que saudade! Posso te apresentar os lançamentos?",
        "{{nome}}, deixa eu te mimar com uma novidade especial 🌸",
        "Olá {{nome}}! Estou pensando em você. Tudo bem?",
        "{{nome}}, voltou a precisar de algo? Estou aqui ✨",
      ],
    },
  };

  let templateCount = 0;
  for (const [category, group] of Object.entries(TEMPLATE_VARIANTS)) {
    for (let v = 0; v < group.texts.length; v++) {
      await prisma.messageTemplate.create({
        data: {
          tenantId: null,
          name: `${group.name} ${v + 1}`,
          category: category as
            | "RESTOCK"
            | "BIRTHDAY"
            | "PROFESSION_DAY"
            | "PROMOTION"
            | "POST_SALE_2D"
            | "POST_SALE_2W"
            | "POST_SALE_2M"
            | "BILLING"
            | "WELCOME"
            | "REACTIVATION",
          text: group.texts[v]!,
          variant: v + 1,
          isSystem: true,
        },
      });
      templateCount++;
    }
  }
  // eslint-disable-next-line no-console
  console.log(`Created ${templateCount} system message templates`);

  // eslint-disable-next-line no-console
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
