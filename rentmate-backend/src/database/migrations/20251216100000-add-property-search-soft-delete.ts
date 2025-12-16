import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertySearchSoftDelete20251216100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure status enum includes inactive/deleted
    await queryRunner.query(`
      ALTER TABLE properties
      MODIFY status ENUM('available','rented','pending','inactive','deleted') NOT NULL DEFAULT 'available'
    `);

    // Add searchTextNormalized if missing
    const searchCol = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'properties'
        AND COLUMN_NAME = 'searchTextNormalized'
    `);
    if (searchCol.length === 0) {
      await queryRunner.query(`
        ALTER TABLE properties
        ADD COLUMN searchTextNormalized VARCHAR(300) NOT NULL DEFAULT '' AFTER status
      `);
    }

    // Add deletedAt if missing
    const deletedCol = await queryRunner.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'properties'
        AND COLUMN_NAME = 'deletedAt'
    `);
    if (deletedCol.length === 0) {
      await queryRunner.query(`
        ALTER TABLE properties
        ADD COLUMN deletedAt DATETIME NULL AFTER updatedAt
      `);
    }

    // Backfill normalized search text
    await queryRunner.query(`
      UPDATE properties
      SET searchTextNormalized = LOWER(CONCAT_WS(' ', title, address, city, district, IFNULL(ward,'')))
      WHERE searchTextNormalized IS NULL OR searchTextNormalized = ''
    `);

    // Add index for normalized search if missing
    const indexExists = await queryRunner.query(`
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'properties'
        AND INDEX_NAME = 'IDX_PROPERTIES_SEARCH_NORMALIZED'
      LIMIT 1
    `);
    if (indexExists.length === 0) {
      await queryRunner.query(`
        CREATE INDEX IDX_PROPERTIES_SEARCH_NORMALIZED
        ON properties (searchTextNormalized)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index if exists
    await queryRunner.query(
      `DROP INDEX IF EXISTS IDX_PROPERTIES_SEARCH_NORMALIZED ON properties`,
    );

    // Normalize enum values before shrinking set
    await queryRunner.query(`
      UPDATE properties
      SET status = 'available'
      WHERE status IN ('inactive','deleted')
    `);

    // Revert enum to original set
    await queryRunner.query(`
      ALTER TABLE properties
      MODIFY status ENUM('available','rented','pending') NOT NULL DEFAULT 'available'
    `);
  }
}
