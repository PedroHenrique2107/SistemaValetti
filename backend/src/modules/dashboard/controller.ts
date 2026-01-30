import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../shared/middleware/auth';
import { AppError } from '../../shared/middleware/errorHandler';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parkingId = req.user?.parkingId;

    if (!parkingId) {
      throw new AppError('Parking ID é obrigatório', 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalVehicles,
      parkedVehicles,
      todayCheckIns,
      todayCheckOuts,
      todayRevenue,
      availableSpots,
    ] = await Promise.all([
      prisma.vehicle.count({
        where: { parkingId },
      }),
      prisma.vehicle.count({
        where: {
          parkingId,
          status: 'ESTACIONADO',
        },
      }),
      prisma.checkIn.count({
        where: {
          parkingId,
          createdAt: { gte: today },
        },
      }),
      prisma.checkOut.count({
        where: {
          parkingId,
          createdAt: { gte: today },
        },
      }),
      prisma.checkOut.aggregate({
        where: {
          parkingId,
          createdAt: { gte: today },
          paymentStatus: 'PAGO',
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.parkingSpot.count({
        where: {
          parkingId,
          isOccupied: false,
        },
      }),
    ]);

    res.json({
      vehicles: {
        total: totalVehicles,
        parked: parkedVehicles,
        available: availableSpots,
      },
      today: {
        checkIns: todayCheckIns,
        checkOuts: todayCheckOuts,
        revenue: todayRevenue._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const parkingId = req.user?.parkingId;

    if (!parkingId) {
      throw new AppError('Parking ID é obrigatório', 400);
    }

    const start = startDate ? new Date(startDate as string) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const [revenue, byMethod, byDay] = await Promise.all([
      prisma.checkOut.aggregate({
        where: {
          parkingId,
          createdAt: { gte: start, lte: end },
          paymentStatus: 'PAGO',
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
        _avg: {
          totalAmount: true,
        },
      }),
      prisma.checkOut.groupBy({
        by: ['paymentMethod'],
        where: {
          parkingId,
          createdAt: { gte: start, lte: end },
          paymentStatus: 'PAGO',
        },
        _sum: {
          totalAmount: true,
        },
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          SUM(total_amount) as total,
          COUNT(*) as count
        FROM "CheckOut"
        WHERE parking_id = ${parkingId}
          AND created_at >= ${start}
          AND created_at <= ${end}
          AND payment_status = 'PAGO'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    res.json({
      period: {
        start: start,
        end: end,
      },
      summary: {
        total: revenue._sum.totalAmount || 0,
        count: revenue._count,
        average: revenue._avg.totalAmount || 0,
      },
      byMethod,
      byDay,
    });
  } catch (error) {
    next(error);
  }
};

export const getOperationalStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const parkingId = req.user?.parkingId;

    if (!parkingId) {
      throw new AppError('Parking ID é obrigatório', 400);
    }

    const start = startDate ? new Date(startDate as string) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const [checkIns, checkOuts, avgTime, byManobrista] = await Promise.all([
      prisma.checkIn.count({
        where: {
          parkingId,
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.checkOut.count({
        where: {
          parkingId,
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.checkOut.aggregate({
        where: {
          parkingId,
          createdAt: { gte: start, lte: end },
        },
        _avg: {
          totalTime: true,
        },
      }),
      prisma.checkOut.groupBy({
        by: ['manobristaId'],
        where: {
          parkingId,
          createdAt: { gte: start, lte: end },
        },
        _count: true,
        _avg: {
          totalTime: true,
        },
      }),
    ]);

    res.json({
      period: {
        start,
        end,
      },
      checkIns,
      checkOuts,
      averageTime: avgTime._avg.totalTime || 0,
      byManobrista,
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicleStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parkingId = req.user?.parkingId;

    if (!parkingId) {
      throw new AppError('Parking ID é obrigatório', 400);
    }

    const [byStatus, byType, recentVehicles] = await Promise.all([
      prisma.vehicle.groupBy({
        by: ['status'],
        where: { parkingId },
        _count: true,
      }),
      prisma.vehicle.groupBy({
        by: ['type'],
        where: { parkingId },
        _count: true,
      }),
      prisma.vehicle.findMany({
        where: { parkingId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          spot: true,
        },
      }),
    ]);

    res.json({
      byStatus,
      byType,
      recentVehicles,
    });
  } catch (error) {
    next(error);
  }
};
