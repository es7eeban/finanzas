import { PrismaClient, CategoryType, AccountType, Currency, GoalStatus, DebtType, DebtStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando semilla de datos (Seed)...');

  // 1. Categorías Globales Predeterminadas
  const defaultCategories = [
    // Ingresos
    { name: 'Sueldo', type: CategoryType.INCOME, icon: 'briefcase', color: '#10B981' },
    { name: 'Honorarios / Freelance', type: CategoryType.INCOME, icon: 'laptop', color: '#059669' },
    { name: 'Inversiones', type: CategoryType.INCOME, icon: 'trending-up', color: '#047857' },
    { name: 'Ventas', type: CategoryType.INCOME, icon: 'shopping-bag', color: '#34D399' },
    { name: 'Otros Ingresos', type: CategoryType.INCOME, icon: 'plus-circle', color: '#6EE7B7' },
    // Egresos
    { name: 'Alimentación', type: CategoryType.EXPENSE, icon: 'utensils', color: '#F43F5E' },
    { name: 'Supermercado', type: CategoryType.EXPENSE, icon: 'shopping-cart', color: '#E11D48' },
    { name: 'Transporte', type: CategoryType.EXPENSE, icon: 'car', color: '#FB923C' },
    { name: 'Vivienda & Servicios', type: CategoryType.EXPENSE, icon: 'home', color: '#8B5CF6' },
    { name: 'Salud & Bienestar', type: CategoryType.EXPENSE, icon: 'activity', color: '#EC4899' },
    { name: 'Ocio & Salidas', type: CategoryType.EXPENSE, icon: 'film', color: '#F59E0B' },
    { name: 'Educación', type: CategoryType.EXPENSE, icon: 'book-open', color: '#3B82F6' },
    { name: 'Ahorro & Metas', type: CategoryType.EXPENSE, icon: 'target', color: '#14B8A6' },
    { name: 'Deudas & Préstamos', type: CategoryType.EXPENSE, icon: 'credit-card', color: '#64748B' },
  ];

  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, userId: null },
    });
    if (!existing) {
      await prisma.category.create({ data: cat });
    }
  }
  console.log(`✅ ${defaultCategories.length} categorías del sistema verificadas/creadas.`);

  // 2. Usuario de Prueba
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@finanzas.com' },
    update: {},
    create: {
      email: 'demo@finanzas.com',
      fullName: 'Usuario Demo',
      passwordHash,
      baseCurrency: Currency.CLP,
    },
  });
  console.log(`👤 Usuario Demo preparado: ${demoUser.email} / Password123!`);

  // 3. Cuentas de Prueba para el Usuario
  const existingAccounts = await prisma.account.count({ where: { userId: demoUser.id } });
  if (existingAccounts === 0) {
    const checkingAcc = await prisma.account.create({
      data: {
        userId: demoUser.id,
        name: 'Cuenta Corriente Banco Chile',
        type: AccountType.CHECKING,
        currency: Currency.CLP,
        balance: 1850000.0,
        color: '#2563EB',
        icon: 'credit-card',
      },
    });

    const usdAcc = await prisma.account.create({
      data: {
        userId: demoUser.id,
        name: 'Cuenta Dólares (USD)',
        type: AccountType.CHECKING,
        currency: Currency.USD,
        balance: 1450.5,
        color: '#4F46E5',
        icon: 'dollar-sign',
      },
    });

    const savingsAcc = await prisma.account.create({
      data: {
        userId: demoUser.id,
        name: 'Bolsillo Ahorro Banco Estado',
        type: AccountType.SAVINGS,
        currency: Currency.CLP,
        balance: 650000.0,
        color: '#10B981',
        icon: 'piggy-bank',
      },
    });

    await prisma.account.create({
      data: {
        userId: demoUser.id,
        name: 'Tarjeta Visa Signature',
        type: AccountType.CREDIT_CARD,
        currency: Currency.CLP,
        balance: -320000.0,
        creditLimit: 2500000.0,
        billingCloseDay: 20,
        paymentDueDay: 5,
        color: '#DC2626',
        icon: 'credit-card',
      },
    });

    await prisma.account.create({
      data: {
        userId: demoUser.id,
        name: 'Efectivo Billetera',
        type: AccountType.CASH,
        currency: Currency.CLP,
        balance: 45000.0,
        color: '#16A34A',
        icon: 'wallet',
      },
    });
    console.log('💳 Cuentas iniciales (CLP y USD) creadas.');

    // 4. Meta de Ahorro inicial (Viaje a Brasil)
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + 1);

    await prisma.savingGoal.create({
      data: {
        userId: demoUser.id,
        targetAccountId: savingsAcc.id,
        name: 'Viaje a Brasil',
        targetAmount: 2000000.0,
        currentAmount: 650000.0,
        targetDate,
        color: '#0D9488',
        icon: 'palmtree',
        status: GoalStatus.ACTIVE,
      },
    });
    console.log('🌴 Meta de Ahorro inicial "Viaje a Brasil" creada.');

    // 5. Deuda P2P de prueba
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    await prisma.debtLoan.create({
      data: {
        userId: demoUser.id,
        contactName: 'Carlos Morales',
        type: DebtType.LENT,
        totalAmount: 100000.0,
        pendingAmount: 50000.0,
        dueDate,
        status: DebtStatus.PARTIALLY_PAID,
        notes: 'Préstamo para repuesto de auto. Pagó primera mitad en efectivo.',
      },
    });
    console.log('🤝 Préstamo P2P de prueba registrado.');
  }

  console.log('✨ Seed completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
