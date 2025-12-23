import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SchemaPatchService implements OnModuleInit {
  private readonly logger = new Logger(SchemaPatchService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.ensureUserStatusColumn();
    await this.ensureVisitsTable();
    await this.ensureReviewPropertyNullable();
  }

  private async ensureUserStatusColumn() {
    try {
      const [{ hasColumn }] = await this.dataSource.query(
        `
        SELECT COUNT(*) AS hasColumn
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'users'
          AND column_name = 'status'
        `,
      );

      if (Number(hasColumn) > 0) {
        return;
      }

      this.logger.log('Applying schema patch: adding users.status column');
      await this.dataSource.query(`
        ALTER TABLE users
        ADD COLUMN status ENUM('active', 'disabled') NOT NULL DEFAULT 'active'
        AFTER role
      `);

      await this.dataSource.query(`
        UPDATE users
        SET status = CASE WHEN isActive = 0 THEN 'disabled' ELSE 'active' END
      `);
    } catch (error) {
      this.logger.error('Failed to ensure users.status column', error as any);
    }
  }

  private async ensureReviewPropertyNullable() {
    try {
      const [column] = await this.dataSource.query(
        `
        SELECT IS_NULLABLE AS isNullable
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'reviews'
          AND column_name = 'propertyId'
        LIMIT 1
      `,
      );

      const isNullable =
        (column?.isNullable ?? column?.IS_NULLABLE ?? '').toString().toUpperCase();
      if (!column || isNullable === 'YES') {
        return;
      }

      this.logger.log(
        'Applying schema patch: allowing NULL for reviews.propertyId (public testimonials)',
      );
      await this.dataSource.query(
        'ALTER TABLE reviews MODIFY COLUMN propertyId INT NULL DEFAULT NULL',
      );
    } catch (error) {
      this.logger.error(
        'Failed to ensure reviews.propertyId is nullable',
        error as any,
      );
    }
  }

  private async ensureVisitsTable() {
    try {
      const rows = await this.dataSource.query(
        "SHOW TABLES LIKE 'visits'",
      );
      const exists = Array.isArray(rows) && rows.length > 0;
      if (exists) {
        return;
      }

      this.logger.log('Applying schema patch: creating visits table');
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS visits (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          path VARCHAR(255) NOT NULL,
          userId INT NULL,
          userRole VARCHAR(20) NULL,
          referrer VARCHAR(255) NULL,
          userAgent VARCHAR(255) NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_visits_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (error) {
      this.logger.error('Failed to ensure visits table', error as any);
    }
  }
}
