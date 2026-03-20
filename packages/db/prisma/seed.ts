import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // eslint-disable-next-line no-console
  console.log('Seeding WBC Platform...');

  // 1. Create system brands
  const brands = await Promise.all([
    prisma.brand.upsert({ where: { id: '00000000-0000-0000-0000-000000000001' }, update: {}, create: { id: '00000000-0000-0000-0000-000000000001', name: 'Mary Kay', isSystem: true } }),
    prisma.brand.upsert({ where: { id: '00000000-0000-0000-0000-000000000002' }, update: {}, create: { id: '00000000-0000-0000-0000-000000000002', name: 'Avon', isSystem: true } }),
    prisma.brand.upsert({ where: { id: '00000000-0000-0000-0000-000000000003' }, update: {}, create: { id: '00000000-0000-0000-0000-000000000003', name: 'Natura', isSystem: true } }),
    prisma.brand.upsert({ where: { id: '00000000-0000-0000-0000-000000000004' }, update: {}, create: { id: '00000000-0000-0000-0000-000000000004', name: 'Jequiti', isSystem: true } }),
    prisma.brand.upsert({ where: { id: '00000000-0000-0000-0000-000000000005' }, update: {}, create: { id: '00000000-0000-0000-0000-000000000005', name: 'Boticário', isSystem: true } }),
  ]);

  // eslint-disable-next-line no-console
  console.log(`Created ${brands.length} system brands`);

  // 2. Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { phone: '+5511999990000' },
    update: {},
    create: {
      name: 'Maria Consultora Demo',
      slug: 'maria-demo',
      phone: '+5511999990000',
      email: 'demo@wbc.com.br',
      plan: 'PRO',
      role: 'CONSULTANT',
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Demo tenant: ${tenant.id}`);

  // 3. Create subscription
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: { tenantId: tenant.id, plan: 'PRO', status: 'ACTIVE', startsAt: new Date() },
  });

  // 4. Create 50 clients
  const clientNames = [
    'Ana Silva', 'Beatriz Santos', 'Carla Oliveira', 'Daniela Costa', 'Eduarda Lima',
    'Fernanda Souza', 'Gabriela Pereira', 'Helena Rodrigues', 'Isabela Almeida', 'Julia Ferreira',
    'Karen Nascimento', 'Larissa Barbosa', 'Marina Ribeiro', 'Natalia Gomes', 'Olivia Martins',
    'Patricia Araujo', 'Quiteria Cardoso', 'Renata Melo', 'Sandra Cavalcanti', 'Tatiana Dias',
    'Ursula Moraes', 'Vanessa Teixeira', 'Wanda Pinto', 'Ximena Castro', 'Yasmin Monteiro',
    'Alice Duarte', 'Bruna Correia', 'Camila Nunes', 'Diana Vieira', 'Elisa Freitas',
    'Fabiana Mendes', 'Gisele Carvalho', 'Heloisa Ramos', 'Irene Azevedo', 'Joana Lopes',
    'Katia Miranda', 'Luana Rocha', 'Marcia Campos', 'Nadia Batista', 'Otilia Moreira',
    'Priscila Fonseca', 'Raquel Andrade', 'Simone Barros', 'Tereza Cunha', 'Valeria Machado',
    'Zelia Sampaio', 'Amanda Nogueira', 'Bianca Pires', 'Cristina Dantas', 'Debora Vasconcelos',
  ];

  const skinTypes = ['OILY', 'DRY', 'COMBINATION', 'NORMAL', 'SENSITIVE'] as const;
  const hairTypes = ['STRAIGHT', 'WAVY', 'CURLY', 'COILY'] as const;
  const classifications = ['A', 'B', 'C'] as const;

  const clients = [];
  for (let i = 0; i < 50; i++) {
    const client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        name: clientNames[i] ?? `Cliente ${i + 1}`,
        phone: `+55119${String(i).padStart(8, '0')}`,
        email: `cliente${i + 1}@demo.com`,
        skinType: skinTypes[i % skinTypes.length],
        hairType: hairTypes[i % hairTypes.length],
        classification: classifications[i < 10 ? 0 : i < 25 ? 1 : 2],
        source: 'MANUAL',
        isActive: true,
      },
    });
    clients.push(client);
  }

  // eslint-disable-next-line no-console
  console.log(`Created ${clients.length} clients`);

  // 5. Create products (30 per brand = 150 total)
  const categories = ['skincare', 'makeup', 'fragrance', 'haircare', 'body'];
  const productNames = ['Creme Hidratante', 'Base Líquida', 'Perfume', 'Shampoo', 'Sabonete',
    'Protetor Solar', 'Batom', 'Colônia', 'Condicionador', 'Loção Corporal',
    'Sérum Facial', 'Pó Compacto', 'Desodorante', 'Máscara Capilar', 'Óleo Corporal',
    'Tônico Facial', 'Rímel', 'Body Splash', 'Leave-in', 'Esfoliante',
    'Máscara Facial', 'Blush', 'Eau de Parfum', 'Creme para Pentear', 'Manteiga Corporal',
    'Água Micelar', 'Sombra', 'Deo Colônia', 'Spray Finalizador', 'Creme para Mãos'];

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
        data: { tenantId: tenant.id, productId: product.id, quantity: Math.floor(Math.random() * 50) + 5, minAlert: 5 },
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
        status: i < 70 ? 'DELIVERED' : i < 85 ? 'CONFIRMED' : 'DRAFT',
        total,
        paymentMethod: ['CASH', 'PIX', 'CREDIT_CARD'][i % 3] as 'CASH' | 'PIX' | 'CREDIT_CARD',
        items: { create: items },
      },
    });

    // Create payment
    if (sale.status !== 'DRAFT') {
      await prisma.payment.create({
        data: {
          saleId: sale.id,
          amount: total,
          dueDate: new Date(),
          status: sale.status === 'DELIVERED' ? 'PAID' : 'PENDING',
          paidAt: sale.status === 'DELIVERED' ? new Date() : null,
        },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log('Created 100 sales with payments');

  // 7. Create 10 expenses
  const expenseDescriptions = [
    'Gasolina', 'Embalagens', 'Material de divulgação', 'Brindes para clientes',
    'Almoço com equipe', 'Impressão de catálogos', 'Uber para entregas',
    'Caixas para envio', 'Internet do mês', 'Papelaria',
  ];

  for (let i = 0; i < 10; i++) {
    await prisma.expense.create({
      data: {
        tenantId: tenant.id,
        description: expenseDescriptions[i] ?? `Despesa ${i + 1}`,
        amount: 20 + Math.random() * 200,
        category: i < 5 ? 'operacional' : 'marketing',
        date: new Date(2026, 2, 1 + i),
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Created 10 expenses');
  // eslint-disable-next-line no-console
  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
