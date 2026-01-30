import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/errorHandler';

const prisma = new PrismaClient();

const createVehicleSchema = z.object({
  plate: z.string().min(7).max(8),
  brand: z.string().optional(),
  model: z.string().min(1),
  color: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  type: z.enum(['CARRO', 'MOTO', 'VAN', 'CAMINHAO', 'OUTRO']).optional(),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().email().optional(),
  ownerCpf: z.string().optional(),
  parkingId: z.string().uuid(),
});

export const createVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createVehicleSchema.parse(req.body);
    const parkingId = data.parkingId || req.user?.parkingId;

    if (!parkingId) {
      throw new AppError('Parking ID é obrigatório', 400);
    }

    // Verificar se placa já está estacionada
    const existingVehicle = await prisma.vehicle.findFirst({
      where: {
        plate: data.plate,
        parkingId,
        status: {
          in: ['ESTACIONADO', 'EM_MOVIMENTACAO', 'SOLICITADO_SAIDA'],
        },
      },
    });

    if (existingVehicle) {
      throw new AppError('Veículo já está estacionado', 409);
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        parkingId,
        ownerId: req.user?.id,
      },
      include: {
        spot: true,
        parking: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
};

export const getVehicles = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, parkingId, page = '1', limit = '50' } = req.query;
    const parking = parkingId || req.user?.parkingId;

    if (!parking) {
      throw new AppError('Parking ID é obrigatório', 400);
    }

    const where: any = { parkingId: parking };
    if (status) {
      where.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          spot: true,
          parking: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vehicle.count({ where }),
    ]);

    res.json({
      data: vehicles,
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

export const getVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        spot: true,
        parking: true,
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        checkOuts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!vehicle) {
      throw new AppError('Veículo não encontrado', 404);
    }

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = createVehicleSchema.partial().parse(req.body);

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new AppError('Veículo não encontrado', 404);
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data,
      include: {
        spot: true,
        parking: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteVehicle = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new AppError('Veículo não encontrado', 404);
    }

    await prisma.vehicle.delete({
      where: { id },
    });

    res.json({ message: 'Veículo deletado com sucesso' });
  } catch (error) {
    next(error);
  }
};

export const searchByPlate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { plate } = req.query;

    if (!plate || typeof plate !== 'string') {
      throw new AppError('Placa é obrigatória', 400);
    }

    const parkingId = req.user?.parkingId;
    if (!parkingId) {
      throw new AppError('Parking ID é obrigatório', 400);
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        plate: {
          contains: plate.toUpperCase(),
          mode: 'insensitive',
        },
        parkingId,
      },
      include: {
        spot: true,
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      take: 10,
    });

    res.json(vehicles);
  } catch (error) {
    next(error);
  }
};
