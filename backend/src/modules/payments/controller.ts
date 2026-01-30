import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/errorHandler';

const prisma = new PrismaClient();

const createPaymentSchema = z.object({
  checkOutId: z.string().uuid(),
  method: z.enum(['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'VOUCHER', 'CONVENIO', 'MENSALISTA']),
  amount: z.number().positive(),
});

export const createPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createPaymentSchema.parse(req.body);

    // Buscar check-out
    const checkOut = await prisma.checkOut.findUnique({
      where: { id: data.checkOutId },
      include: { vehicle: true },
    });

    if (!checkOut) {
      throw new AppError('Check-out não encontrado', 404);
    }

    if (checkOut.paymentStatus === 'PAGO') {
      throw new AppError('Check-out já foi pago', 409);
    }

    // Criar pagamento
    const payment = await prisma.payment.create({
      data: {
        checkOutId: data.checkOutId,
        amount: data.amount,
        method: data.method,
        status: data.method === 'PIX' ? 'PROCESSANDO' : 'PENDENTE',
      },
    });

    // Se for PIX, gerar QR Code
    if (data.method === 'PIX') {
      // TODO: Integrar com gateway de pagamento (Mercado Pago, PagSeguro, etc)
      // Por enquanto, apenas criar o registro
    }

    // Atualizar check-out
    await prisma.checkOut.update({
      where: { id: data.checkOutId },
      data: {
        paymentId: payment.id,
        paymentStatus: 'PROCESSANDO',
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50', status, method } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (method) {
      where.method = method;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          checkOut: {
            include: {
              vehicle: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      data: payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        checkOut: {
          include: {
            vehicle: true,
            checkIn: true,
          },
        },
      },
    });

    if (!payment) {
      throw new AppError('Pagamento não encontrado', 404);
    }

    res.json(payment);
  } catch (error) {
    next(error);
  }
};

export const processPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { checkOut: true },
    });

    if (!payment) {
      throw new AppError('Pagamento não encontrado', 404);
    }

    if (payment.status === 'APROVADO') {
      throw new AppError('Pagamento já foi aprovado', 409);
    }

    // TODO: Processar pagamento com gateway
    // Por enquanto, apenas atualizar status

    await prisma.payment.update({
      where: { id },
      data: {
        status: 'APROVADO',
        paidAt: new Date(),
      },
    });

    await prisma.checkOut.update({
      where: { id: payment.checkOutId },
      data: {
        paymentStatus: 'PAGO',
      },
    });

    res.json({ message: 'Pagamento processado com sucesso' });
  } catch (error) {
    next(error);
  }
};

export const cancelPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new AppError('Pagamento não encontrado', 404);
    }

    if (payment.status === 'CANCELADO') {
      throw new AppError('Pagamento já foi cancelado', 409);
    }

    await prisma.payment.update({
      where: { id },
      data: {
        status: 'CANCELADO',
      },
    });

    res.json({ message: 'Pagamento cancelado com sucesso' });
  } catch (error) {
    next(error);
  }
};
