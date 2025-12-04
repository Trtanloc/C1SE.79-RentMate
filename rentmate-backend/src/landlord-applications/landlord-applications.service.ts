import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LandlordApplication } from './entities/landlord-application.entity';
import { CreateLandlordApplicationDto } from './dto/create-landlord-application.dto';
import { LandlordApplicationStatus } from '../common/enums/landlord-application-status.enum';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/enums/user-role.enum';
import { UpdateLandlordApplicationStatusDto } from './dto/update-landlord-application-status.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../common/enums/notification-type.enum';

@Injectable()
export class LandlordApplicationsService {
  constructor(
    @InjectRepository(LandlordApplication)
    private readonly applicationsRepository: Repository<LandlordApplication>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    userId: number,
    dto: CreateLandlordApplicationDto,
  ): Promise<LandlordApplication> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === UserRole.Landlord) {
      throw new BadRequestException(
        'You are already a landlord on RentMate.',
      );
    }

    const existingPending = await this.applicationsRepository.findOne({
      where: { userId, status: LandlordApplicationStatus.Pending },
    });
    if (existingPending) {
      throw new BadRequestException(
        'You already have a pending application. Please wait for review.',
      );
    }

    const application = this.applicationsRepository.create({
      ...dto,
      userId,
      status: LandlordApplicationStatus.Pending,
    });
    return this.applicationsRepository.save(application);
  }

  findMine(userId: number): Promise<LandlordApplication | null> {
    return this.applicationsRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  findAll(
    status?: LandlordApplicationStatus,
  ): Promise<LandlordApplication[]> {
    return this.applicationsRepository.find({
      where: status ? { status } : {},
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(
    id: number,
    reviewerId: number,
    dto: UpdateLandlordApplicationStatusDto,
  ): Promise<LandlordApplication> {
    const application = await this.applicationsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status === dto.status) {
      application.adminNotes = dto.adminNotes;
      application.reviewedByUserId = reviewerId;
      application.reviewedAt = new Date();
      return this.applicationsRepository.save(application);
    }

    application.status = dto.status;
    application.adminNotes = dto.adminNotes;
    application.reviewedByUserId = reviewerId;
    application.reviewedAt = new Date();

    const saved = await this.applicationsRepository.save(application);

    if (dto.status === LandlordApplicationStatus.Approved) {
      await this.usersService.update(application.userId, {
        role: UserRole.Landlord,
      });
      await this.sendNotification(
        application.userId,
        'Landlord application approved',
        'Congratulations! Your landlord application has been approved. You can now publish properties on RentMate.',
      );
    } else if (dto.status === LandlordApplicationStatus.Rejected) {
      await this.sendNotification(
        application.userId,
        'Landlord application update',
        dto.adminNotes ||
          'We are sorry to inform you that your landlord application was not approved at this time.',
      );
    }

    return saved;
  }

  private async sendNotification(userId: number, title: string, message: string) {
    await this.notificationsService.create({
      userId,
      title,
      message,
      type: NotificationType.System,
    });
  }
}

