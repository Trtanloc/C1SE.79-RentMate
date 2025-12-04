import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  const rawOrigins = configService.get<string>('CORS_ORIGIN');
  const allowlist = rawOrigins
    ? rawOrigins
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : ['http://localhost:5173'];

  app.enableCors({
    origin: allowlist,
    credentials: true,
  });

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  console.log(`RentMate API is running on http://localhost:${port}/api`);
}

bootstrap();
