import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThanOrEqual } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { User } from '../users/entities/user.entity';
import { Contract } from '../contracts/entities/contract.entity';
import { PropertyStatus } from '../common/enums/property-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { ContractStatus } from '../common/enums/contract-status.enum';
import {
  PropertyType,
  propertyTypeLabels,
} from '../common/enums/property-type.enum';
import { Transaction } from '../transactions/entities/transaction.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
  ) {}

  async getOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalListings,
      activeListings,
      landlordCount,
      tenantCount,
      newListingsThisMonth,
    ] = await Promise.all([
      this.propertyRepository.count(),
      this.propertyRepository.count({
        where: { status: PropertyStatus.Available },
      }),
      this.userRepository.count({ where: { role: UserRole.Landlord } }),
      this.userRepository.count({ where: { role: UserRole.Tenant } }),
      this.propertyRepository.count({
        where: {
          createdAt: MoreThanOrEqual(startOfMonth),
        },
      }),
    ]);

    const contractsSigned = await this.contractRepository.count({
      where: {
        status: In([
          ContractStatus.Signed,
          ContractStatus.Active,
          ContractStatus.Completed,
        ]),
      },
    });

    const averagePriceRaw = await this.propertyRepository
      .createQueryBuilder('property')
      .select('COALESCE(AVG(property.price), 0)', 'avg')
      .getRawOne<{ avg: string }>();

    const averagePrice = Number(averagePriceRaw?.avg ?? 0);

    const occupancyRate =
      totalListings === 0
        ? 0
        : Number(
            (
              ((totalListings - activeListings) / totalListings) *
              100
            ).toFixed(1),
          );

    return {
      totalListings,
      activeListings,
      landlordCount,
      tenantCount,
      contractsSigned,
      averagePrice,
      newListingsThisMonth,
      occupancyRate,
    };
  }

  async getDashboard() {
    const [
      overview,
      revenueByMonth,
      usersByRole,
      listingsByCity,
      adminCharts,
    ] =
      await Promise.all([
        this.getOverview(),
        this.getRevenueByMonth(),
        this.getUsersByRole(),
        this.getListingsByCity(),
        this.getAdminCharts(),
      ]);

    return {
      overview,
      revenueByMonth,
      usersByRole,
      listingsByCity,
      adminCharts,
    };
  }

  async getAdminCharts() {
    const [
      activeListingsTrend,
      landlordTrend,
      occupancyRateTrend,
    ] = await Promise.all([
      this.getActiveListingsTrend(),
      this.getLandlordTrend(),
      this.getOccupancyRateTrend(),
    ]);

    return {
      activeListingsTrend,
      landlordTrend,
      occupancyRateTrend,
    };
  }

  async getCategoryHighlights() {
    const rows = await this.propertyRepository
      .createQueryBuilder('property')
      .select('property.type', 'type')
      .addSelect('COUNT(property.id)', 'count')
      .addSelect('AVG(property.price)', 'avgPrice')
      .groupBy('property.type')
      .getRawMany<{ type: PropertyType; count: string; avgPrice: string }>();

    const gradients: Record<PropertyType, string> = {
      [PropertyType.Apartment]: 'from-[#0072BC] via-[#5DE0E6] to-[#001F3F]',
      [PropertyType.Condo]: 'from-[#FFD400] via-[#FF8C00] to-[#FFB703]',
      [PropertyType.House]: 'from-[#7ED321] via-[#00B894] to-[#0F766E]',
      [PropertyType.Studio]: 'from-[#6366F1] via-[#A855F7] to-[#7C3AED]',
      [PropertyType.Office]: 'from-[#F97316] via-[#FB7185] to-[#E11D48]',
    };

    const descriptions: Record<PropertyType, string> = {
      [PropertyType.Apartment]:
        'Urban apartments with security and on-site amenities.',
      [PropertyType.Condo]:
        'Premium serviced condos tailored for long-stay renters.',
      [PropertyType.House]:
        'Standalone houses with private space for families or groups.',
      [PropertyType.Studio]:
        'Compact studios with turnkey interiors for busy professionals.',
      [PropertyType.Office]:
        'Flexible office footprints ready for teams and startups.',
    };

    return Object.values(PropertyType).map((type) => {
      const row = rows.find((entry) => entry.type === type);
      const count = Number(row?.count ?? 0);
      const averagePrice = Number(row?.avgPrice ?? 0);
      return {
        type,
        label: propertyTypeLabels[type],
        description: descriptions[type],
        gradient: gradients[type],
        count,
        averagePrice,
      };
    });
  }

  private async getRevenueByMonth() {
    const rows = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select("DATE_FORMAT(transaction.createdAt, '%Y-%m-01')", 'month')
      .addSelect('SUM(transaction.amount)', 'total')
      .where('transaction.status IN (:...statuses)', {
        statuses: ['completed', 'processing'],
      })
      .groupBy("DATE_FORMAT(transaction.createdAt, '%Y-%m-01')")
      .orderBy('month', 'DESC')
      .limit(6)
      .getRawMany<{ month: string; total: string }>();
    return rows.map((row: any) => ({
      month: row.month,
      total: Number(row.total ?? 0),
    }));
  }

  private async getUsersByRole() {
    const rows = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(user.id)', 'count')
      .groupBy('user.role')
      .getRawMany<{ role: UserRole; count: string }>();
    return rows.map((row) => ({
      role: row.role,
      count: Number(row.count ?? 0),
    }));
  }

  private async getListingsByCity() {
    const rows = await this.propertyRepository
      .createQueryBuilder('property')
      .select('property.city', 'city')
      .addSelect('COUNT(property.id)', 'count')
      .groupBy('property.city')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany<{ city: string; count: string }>();
    return rows.map((row) => ({
      city: row.city,
      count: Number(row.count ?? 0),
    }));
  }

  private async getActiveListingsTrend() {
    const rows = await this.propertyRepository
      .createQueryBuilder('property')
      .select("DATE_FORMAT(property.createdAt, '%Y-%m-01')", 'month')
      .addSelect('COUNT(property.id)', 'count')
      .where('property.status = :status', {
        status: PropertyStatus.Available,
      })
      .groupBy("DATE_FORMAT(property.createdAt, '%Y-%m-01')")
      .orderBy('month', 'DESC')
      .limit(6)
      .getRawMany<{ month: string; count: string }>();

    return rows
      .map((row) => ({
        month: row.month,
        count: Number(row.count ?? 0),
      }))
      .reverse();
  }

  private async getLandlordTrend() {
    const rows = await this.userRepository
      .createQueryBuilder('user')
      .select("DATE_FORMAT(user.createdAt, '%Y-%m-01')", 'month')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.role = :role', { role: UserRole.Landlord })
      .groupBy("DATE_FORMAT(user.createdAt, '%Y-%m-01')")
      .orderBy('month', 'DESC')
      .limit(6)
      .getRawMany<{ month: string; count: string }>();

    return rows
      .map((row) => ({
        month: row.month,
        count: Number(row.count ?? 0),
      }))
      .reverse();
  }

  private async getOccupancyRateTrend() {
    const rows = await this.propertyRepository
      .createQueryBuilder('property')
      .select("DATE_FORMAT(property.createdAt, '%Y-%m-01')", 'month')
      .addSelect('COUNT(property.id)', 'total')
      .addSelect(
        "SUM(CASE WHEN property.status = :rented THEN 1 ELSE 0 END)",
        'rented',
      )
      .groupBy("DATE_FORMAT(property.createdAt, '%Y-%m-01')")
      .orderBy('month', 'DESC')
      .limit(6)
      .setParameters({ rented: PropertyStatus.Rented })
      .getRawMany<{ month: string; total: string; rented: string }>();

    return rows
      .map((row) => {
        const total = Number(row.total ?? 0);
        const rented = Number(row.rented ?? 0);
        const rate =
          total === 0 ? 0 : Number(((rented / total) * 100).toFixed(1));
        return {
          month: row.month,
          rate,
          total,
          rented,
        };
      })
      .reverse();
  }
}
