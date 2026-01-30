import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import { AuthRequest } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/errorHandler';
import { logger } from '../../shared/utils/logger';

const prisma = new PrismaClient();

const checkInSchema = z.object({
  vehicleId: z.string().uuid(),
  spotId: z.string().uuid().optional(),
  manobristaId: z.string().uuid().optional(),
  inspectionData: z.any().optional(),
  expectedExitTime: z.string().datetime().optional(),
});

const checkOutSchema = z.object({
  checkInId: z.string().uuid(),
  manobristaId: z.string().uuid().optional(),
  paymentMethod: z.enum(['PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'DINHEIRO', 'VOUCHER', 'CONVENIO', 'MENSALISTA']).optional(),
  exitInspection: z.any().optional(),
});

export const checkIn = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = checkInSchema.parse(req.body);
    const parkingId = req.user?.parkingId;

    if (!parkingId) {
      throw new AppError('Parking ID é obrigatório', 400);
    }

    // Buscar veículo
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      throw new AppError('Veículo não encontrado', 404);
    }

    if (vehicle.status === 'ESTACIONADO') {
      throw new AppError('Veículo já está estacionado', 409);
    }

    // Gerar número do ticket
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Gerar QR Code
    const qrCode = await QRCode.toDataURL(ticketNumber);

    // Atribuir vaga se não fornecida
    let spotId = data.spotId;
    if (!spotId) {
      // Buscar vaga disponível
      const availableSpot = await prisma.parkingSpot.findFirst({
        where: {
          parkingId,
          isOccupied: false,
          isReserved: false,
        },
      });

      if (availableSpot) {
        spotId = availableSpot.id;
      }
    }

    // Criar check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        vehicleId: data.vehicleId,
        parkingId,
        manobristaId: data.manobristaId || req.user?.id,
        spotId,
        ticketNumber,
        qrCode,
        inspectionData: data.inspectionData,
        expectedExitTime: data.expectedExitTime ? new Date(data.expectedExitTime) : null,
      },
      include: {
        vehicle: true,
        spot: true,
        manobrista: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Atualizar veículo
    await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: {
        status: 'ESTACIONADO',
        spotId,
      },
    });

    // Atualizar vaga
    if (spotId) {
      await prisma.parkingSpot.update({
        where: { id: spotId },
        data: {
          isOccupied: true,
          vehicleId: data.vehicleId,
        },
      });
    }

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`parking:${parkingId}`).emit('vehicle:checked-in', checkIn);
    }

    logger.info(`Check-in realizado: ${ticketNumber}`);

    res.status(201).json(checkIn);
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = checkOutSchema.parse(req.body);
    const parkingId = req.user?.parkingId;

    if (!parkingId) {
      throw new AppError('Parking ID é obrigatório', 400);
    }

    // Buscar check-in
    const checkIn = await prisma.checkIn.findUnique({
      where: { id: data.checkInId },
      include: {
        vehicle: true,
        spot: true,
      },
    });

    if (!checkIn) {
      throw new AppError('Check-in não encontrado', 404);
    }

    if (checkIn.checkOut) {
      throw new AppError('Check-out já realizado', 409);
    }

    // Calcular tempo e valor
    const entryTime = new Date(checkIn.entryTime);
    const exitTime = new Date();
    const totalMinutes = Math.floor((exitTime.getTime() - entryTime.getTime()) / 60000);

    // TODO: Implementar cálculo de valor baseado em regras de precificação
    const totalAmount = 0; // Placeholder

    // Criar check-out
    const checkOut = await prisma.checkOut.create({
      data: {
        checkInId: data.checkInId,
        vehicleId: checkIn.vehicleId,
        parkingId,
        manobristaId: data.manobristaId || req.user?.id,
        exitTime,
        totalTime: totalMinutes,
        totalAmount,
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod ? 'PAGO' : 'PENDENTE',
        exitInspection: data.exitInspection,
      },
      include: {
        vehicle: true,
        checkIn: true,
        manobrista: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Atualizar veículo
    await prisma.vehicle.update({
      where: { id: checkIn.vehicleId },
      data: {
        status: 'ENTREGUE',
        spotId: null,
      },
    });

    // Liberar vaga
    if (checkIn.spotId) {
      await prisma.parkingSpot.update({
        where: { id: checkIn.spotId },
        data: {
          isOccupied: false,
          vehicleId: null,
        },
      });
    }

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`parking:${parkingId}`).emit('vehicle:checked-out', checkOut);
    }

    logger.info(`Check-out realizado: ${checkIn.ticketNumber}`);

    res.status(201).json(checkOut);
  } catch (error) {
    next(error);
  }
};

export const getCheckIns = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50', vehicleId, parkingId } = req.query;
    const parking = parkingId || req.user?.parkingId;

    if (!parking) {
      throw new AppError('Parking ID é obrigatório', 400);
    }

    const where: any = { parkingId: parking };
    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [checkIns, total] = await Promise.all([
      prisma.checkIn.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          vehicle: true,
          spot: true,
          manobrista: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.checkIn.count({ where }),
    ]);

    res.json({
      data: checkIns,
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

export const getCheckOuts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50', vehicleId, parkingId } = req.query;
    const parking = parkingId || req.user?.parkingId;

    if (!parking) {
      throw new AppError('Parking ID é obrigatório', 400);
    }

    const where: any = { parkingId: parking };
    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [checkOuts, total] = await Promise.all([
      prisma.checkOut.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          vehicle: true,
          checkIn: true,
          manobrista: {
            select: {
              id: true,
              name: true,
            },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.checkOut.count({ where }),
    ]);

    res.json({
      data: checkOuts,
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

export const getCheckIn = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const checkIn = await prisma.checkIn.findUnique({
      where: { id },
      include: {
        vehicle: true,
        spot: true,
        manobrista: true,
        checkOut: true,
      },
    });

    if (!checkIn) {
      throw new AppError('Check-in não encontrado', 404);
    }

    res.json(checkIn);
  } catch (error) {
    next(error);
  }
};

export const getCheckOut = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const checkOut = await prisma.checkOut.findUnique({
      where: { id },
      include: {
        vehicle: true,
        checkIn: true,
        manobrista: true,
        payment: true,
      },
    });

    if (!checkOut) {
      throw new AppError('Check-out não encontrado', 404);
    }

    res.json(checkOut);
  } catch (error) {
    next(error);
  }
};

export const requestVehicleExit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { vehicleId } = req.body;

    if (!vehicleId) {
      throw new AppError('Vehicle ID é obrigatório', 400);
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new AppError('Veículo não encontrado', 404);
    }

    if (vehicle.status !== 'ESTACIONADO') {
      throw new AppError('Veículo não está estacionado', 400);
    }

    // Atualizar status
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'SOLICITADO_SAIDA' },
    });

    // Emitir evento via Socket.io
    const io = req.app.get('io');
    if (io && vehicle.parkingId) {
      io.to(`parking:${vehicle.parkingId}`).emit('vehicle:exit-requested', {
        vehicleId,
        vehicle,
      });
    }

    res.json({ message: 'Solicitação de saída registrada' });
  } catch (error) {
    next(error);
  }
};

export const getParkingStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parkingId = req.user?.parkingId;

    if (!parkingId) {
      throw new AppError('Parking ID é obrigatório', 400);
    }

    const [parking, vehicles, spots] = await Promise.all([
      prisma.parking.findUnique({
        where: { id: parkingId },
      }),
      prisma.vehicle.groupBy({
        by: ['status'],
        where: { parkingId },
        _count: true,
      }),
      prisma.parkingSpot.groupBy({
        by: ['isOccupied'],
        where: { parkingId },
        _count: true,
      }),
    ]);

    const statusCounts = vehicles.reduce((acc, v) => {
      acc[v.status] = v._count;
      return acc;
    }, {} as Record<string, number>);

    const occupiedSpots = spots.find(s => s.isOccupied)?._count || 0;
    const availableSpots = spots.find(s => !s.isOccupied)?._count || 0;

    res.json({
      parking: {
        id: parking?.id,
        name: parking?.name,
        totalSpots: parking?.totalSpots || 0,
        activeSpots: parking?.activeSpots || 0,
      },
      vehicles: statusCounts,
      spots: {
        occupied: occupiedSpots,
        available: availableSpots,
        total: occupiedSpots + availableSpots,
      },
    });
  } catch (error) {
    next(error);
  }
};
