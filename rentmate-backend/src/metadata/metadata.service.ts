import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../properties/entities/property.entity';
import { PropertyStatus } from '../common/enums/property-status.enum';
import { PropertyType, propertyTypeLabels } from '../common/enums/property-type.enum';
import { NotificationType } from '../common/enums/notification-type.enum';
import { LandlordApplicationStatus } from '../common/enums/landlord-application-status.enum';

type LabeledValue<T extends string> = {
  value: T;
  label: string;
};

@Injectable()
export class MetadataService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepository: Repository<Property>,
  ) {}

  async getFilters() {
    const [cities, districts, countries, rawTypes] = await Promise.all([
      this.getDistinctStringColumn('city'),
      this.getDistinctStringColumn('district'),
      this.getDistinctStringColumn('country'),
      this.getDistinctStringColumn('type'),
    ]);

    return {
      propertyTypes: this.buildPropertyTypes(rawTypes),
      propertyStatuses: this.buildPropertyStatuses(),
      notificationTypes: this.buildNotificationTypes(),
      landlordApplicationStatuses: this.buildLandlordApplicationStatuses(),
      cities,
      districts,
      countries,
    };
  }

  private async getDistinctStringColumn(column: keyof Property): Promise<string[]> {
    const rows = await this.propertyRepository
      .createQueryBuilder('property')
      .select(`DISTINCT property.${column}`, 'value')
      .where(`property.${column} IS NOT NULL`)
      .andWhere(`property.${column} != ''`)
      .orderBy(`property.${column}`, 'ASC')
      .getRawMany<{ value: string }>();

    return rows.map((row) => row.value);
  }

  private buildPropertyTypes(existingTypes: string[]): LabeledValue<string>[] {
    const knownTypes = Object.values(PropertyType);
    const knownTypeSet = new Set<string>(knownTypes);

    const normalizedExisting = existingTypes.map((value) => value.toLowerCase());
    const typesFromData = new Set<string>(normalizedExisting);

    const known = knownTypes.map((type) => ({
      value: type,
      label: propertyTypeLabels[type] ?? type,
      active: typesFromData.has(type),
    }));

    const unknown = existingTypes
      .filter((type) => !knownTypeSet.has(type))
      .map((type) => ({ value: type, label: type, active: true }));

    return [...known, ...unknown];
  }

  private buildPropertyStatuses(): LabeledValue<PropertyStatus>[] {
    const labels: Record<PropertyStatus, string> = {
      [PropertyStatus.Available]: 'Available',
      [PropertyStatus.Rented]: 'Rented',
      [PropertyStatus.Pending]: 'Pending Approval',
    };

    return Object.values(PropertyStatus).map((value) => ({
      value,
      label: labels[value],
    }));
  }

  private buildNotificationTypes(): LabeledValue<NotificationType>[] {
    const labels: Record<NotificationType, string> = {
      [NotificationType.Transaction]: 'Transaction',
      [NotificationType.Contract]: 'Contract',
      [NotificationType.Reminder]: 'Reminder',
      [NotificationType.System]: 'System',
    };

    return Object.values(NotificationType).map((value) => ({
      value,
      label: labels[value],
    }));
  }

  private buildLandlordApplicationStatuses(): LabeledValue<LandlordApplicationStatus>[] {
    const labels: Record<LandlordApplicationStatus, string> = {
      [LandlordApplicationStatus.Pending]: 'Pending Review',
      [LandlordApplicationStatus.Approved]: 'Approved',
      [LandlordApplicationStatus.Rejected]: 'Rejected',
    };

    return Object.values(LandlordApplicationStatus).map((value) => ({
      value,
      label: labels[value],
    }));
  }
}
