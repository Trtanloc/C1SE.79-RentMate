"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const reflector = app.get(core_1.Reflector);
    const configService = app.get(config_1.ConfigService);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalInterceptors(new common_1.ClassSerializerInterceptor(reflector));
    app.enableCors({
        origin: configService.get('CORS_ORIGIN') || true,
        credentials: true,
    });
    const port = configService.get('PORT') || 3000;
    await app.listen(port);
    console.log(`RentMate API is running on http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map