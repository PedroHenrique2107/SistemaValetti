import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar estacionamento de exemplo
  const parking = await prisma.parking.upsert({
    where: { cnpj: '12345678000190' },
    update: {},
    create: {
      name: 'Estacionamento Centro',
      cnpj: '12345678000190',
      address: 'Rua Exemplo, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234567',
      phone: '+5511999999999',
      email: 'contato@estacionamento.com.br',
      totalSpots: 100,
      activeSpots: 100,
      settings: {
        operatingHours: {
          open: '06:00',
          close: '22:00',
        },
        pricing: {
          default: {
            first20min: 5.00,
            firstHour: 20.00,
            additionalHour: 10.00,
          },
        },
      },
    },
  });

  console.log('✅ Estacionamento criado:', parking.name);

  // Criar usuário Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@valetti.com.br' },
    update: {},
    create: {
      email: 'admin@valetti.com.br',
      password: hashedPassword,
      name: 'Administrador',
      role: 'SUPER_ADMIN',
      parkingId: parking.id,
      status: 'ATIVO',
    },
  });

  console.log('✅ Super Admin criado:', superAdmin.email);

  // Criar usuário Administrador
  const admin = await prisma.user.upsert({
    where: { email: 'gerente@valetti.com.br' },
    update: {},
    create: {
      email: 'gerente@valetti.com.br',
      password: hashedPassword,
      name: 'Gerente Geral',
      role: 'ADMINISTRADOR',
      parkingId: parking.id,
      status: 'ATIVO',
    },
  });

  console.log('✅ Administrador criado:', admin.email);

  // Criar manobristas
  const manobristas = await Promise.all([
    prisma.user.upsert({
      where: { email: 'manobrista1@valetti.com.br' },
      update: {},
      create: {
        email: 'manobrista1@valetti.com.br',
        password: hashedPassword,
        name: 'João Silva',
        phone: '+5511988888888',
        role: 'MANOBRISTA',
        parkingId: parking.id,
        status: 'ATIVO',
      },
    }),
    prisma.user.upsert({
      where: { email: 'manobrista2@valetti.com.br' },
      update: {},
      create: {
        email: 'manobrista2@valetti.com.br',
        password: hashedPassword,
        name: 'Maria Santos',
        phone: '+5511977777777',
        role: 'MANOBRISTA',
        parkingId: parking.id,
        status: 'ATIVO',
      },
    }),
  ]);

  console.log('✅ Manobristas criados:', manobristas.length);

  // Criar recepcionista
  const recepcionista = await prisma.user.upsert({
    where: { email: 'recepcionista@valetti.com.br' },
    update: {},
    create: {
      email: 'recepcionista@valetti.com.br',
      password: hashedPassword,
      name: 'Ana Costa',
      phone: '+5511966666666',
      role: 'RECEPCIONISTA',
      parkingId: parking.id,
      status: 'ATIVO',
    },
  });

  console.log('✅ Recepcionista criado:', recepcionista.email);

  // Criar vagas de exemplo
  const spots = [];
  const sections = ['TER', 'SUB', 'BAR'];
  
  for (let i = 0; i < 30; i++) {
    const section = sections[Math.floor(i / 10)];
    const number = (i % 10) + 1;
    const code = `${section}-${number.toString().padStart(2, '0')}`;

    const spot = await prisma.parkingSpot.create({
      data: {
        parkingId: parking.id,
        code,
        section,
        floor: section === 'SUB' ? -1 : section === 'TER' ? 0 : 1,
        isReserved: false,
        isOccupied: false,
      },
    });

    spots.push(spot);
  }

  console.log('✅ Vagas criadas:', spots.length);

  // Criar regras de precificação
  const pricingRules = await Promise.all([
    prisma.pricingRule.create({
      data: {
        parkingId: parking.id,
        name: 'Avulso',
        type: 'HOURLY',
        config: {
          first20min: 5.00,
          firstHour: 20.00,
          additionalHour: 10.00,
        },
        isActive: true,
      },
    }),
    prisma.pricingRule.create({
      data: {
        parkingId: parking.id,
        name: 'Mensalista',
        type: 'FIXED',
        config: {
          monthlyAmount: 380.00,
        },
        isActive: true,
      },
    }),
    prisma.pricingRule.create({
      data: {
        parkingId: parking.id,
        name: 'Diária',
        type: 'FIXED',
        config: {
          dailyAmount: 50.00,
        },
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Regras de precificação criadas:', pricingRules.length);

  console.log('🎉 Seed concluído com sucesso!');
  console.log('\n📝 Credenciais de acesso:');
  console.log('   Super Admin: admin@valetti.com.br / admin123');
  console.log('   Administrador: gerente@valetti.com.br / admin123');
  console.log('   Manobrista 1: manobrista1@valetti.com.br / admin123');
  console.log('   Manobrista 2: manobrista2@valetti.com.br / admin123');
  console.log('   Recepcionista: recepcionista@valetti.com.br / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
