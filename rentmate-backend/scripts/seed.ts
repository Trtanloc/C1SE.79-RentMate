import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DatabaseSeedService } from '../src/database/database.seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const seeder = app.get(DatabaseSeedService);
    await seeder.run();
  } finally {
    await app.close();
  }
}

bootstrap().catch((error) => {
  Logger.error('Seeding failed', error);
  process.exit(1);
});
