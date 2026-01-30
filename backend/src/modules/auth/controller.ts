import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/errorHandler';
import { logger } from '../../shared/utils/logger';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  phone: z.string().optional(),
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
  ]).optional(),
  parkingId: z.string().uuid().optional(),
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
      include: { parking: true },
    });

    if (!user) {
      throw new AppError('Email ou senha inválidos', 401);
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Email ou senha inválidos', 401);
    }

    // Verificar status
    if (user.status !== 'ATIVO') {
      throw new AppError('Usuário inativo ou bloqueado', 403);
    }

    // Gerar tokens
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT secrets não configurados');
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        parkingId: user.parkingId,
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      jwtRefreshSecret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    // Salvar sessão
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        refreshToken,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        expiresAt,
      },
    });

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(`User logged in: ${user.email}`);

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        parkingId: user.parkingId,
        parking: user.parking ? {
          id: user.parking.id,
          name: user.parking.name,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

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
        email: data.email,
        password: hashedPassword,
        name: data.name,
        phone: data.phone,
        role: data.role || 'MANOBRISTA',
        parkingId: data.parkingId,
      },
      include: { parking: true },
    });

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      throw new AppError('Refresh token não fornecido', 401);
    }

    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET não configurado');
    }

    const decoded = jwt.verify(token, jwtRefreshSecret) as { id: string };

    // Buscar sessão
    const session = await prisma.session.findUnique({
      where: { refreshToken: token },
      include: { user: true },
    });

    if (!session || session.user.status !== 'ATIVO') {
      throw new AppError('Sessão inválida', 401);
    }

    // Gerar novo token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET não configurado');
    }

    const newToken = jwt.sign(
      {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        parkingId: session.user.parkingId,
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Atualizar sessão
    await prisma.session.update({
      where: { id: session.id },
      data: { token: newToken },
    });

    res.json({ token: newToken });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.substring(7);

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    logger.info(`User logged out: ${req.user?.email}`);

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('Não autenticado', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { parking: true },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      parkingId: user.parkingId,
      parking: user.parking ? {
        id: user.parking.id,
        name: user.parking.name,
      } : null,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};
