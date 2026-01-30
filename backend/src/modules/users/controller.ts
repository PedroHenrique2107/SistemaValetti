import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/errorHandler';

const prisma = new PrismaClient();

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(3),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  role: z.enum([
    'SUPER_ADMIN',
    'ADMINISTRADOR',
    'GERENTE_OPERACIONAL',
    'SUPERVISOR',
    'FINANCEIRO',
    'RECEPCIONISTA',
    'MANOBRISTA',
    'MENSALISTA',
    'AUDITOR',
  ]),
  parkingId: z.string().uuid().optional(),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true });

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50', role, status, parkingId } = req.query;
    const parking = parkingId || req.user?.parkingId;

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (status) {
      where.status = status;
    }
    if (parking) {
      where.parkingId = parking;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          parkingId: true,
          parking: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: users,
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

export const getUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Usuários só podem ver seu próprio perfil, exceto admins
    if (id !== req.user?.id && !['ADMINISTRADOR', 'SUPER_ADMIN'].includes(req.user?.role || '')) {
      throw new AppError('Acesso negado', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        cpf: true,
        role: true,
        status: true,
        parkingId: true,
        parking: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email já cadastrado', 409);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        parkingId: data.parkingId || req.user?.parkingId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        parkingId: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    // Verificar permissões
    if (id !== req.user?.id && !['ADMINISTRADOR', 'SUPER_ADMIN'].includes(req.user?.role || '')) {
      throw new AppError('Acesso negado', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Verificar se email já existe (se estiver sendo alterado)
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new AppError('Email já cadastrado', 409);
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        parkingId: true,
        updatedAt: true,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (id === req.user?.id) {
      throw new AppError('Não é possível deletar seu próprio usuário', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ATIVO', 'INATIVO', 'BLOQUEADO'].includes(status)) {
      throw new AppError('Status inválido', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
