"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const properties_module_1 = require("./properties/properties.module");
const user_entity_1 = require("./users/entities/user.entity");
const property_entity_1 = require("./properties/entities/property.entity");
const contract_entity_1 = require("./contracts/entities/contract.entity");
const transaction_entity_1 = require("./transactions/entities/transaction.entity");
const message_entity_1 = require("./messages/entities/message.entity");
const messages_module_1 = require("./messages/messages.module");
const ai_module_1 = require("./ai/ai.module");
const notification_entity_1 = require("./notifications/entities/notification.entity");
const notifications_module_1 = require("./notifications/notifications.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'mysql',
                    host: configService.get('DB_HOST', 'localhost'),
                    port: configService.get('DB_PORT', 3306),
                    username: configService.get('DB_USER', 'root'),
                    password: configService.get('DB_PASS', '123456'),
                    database: configService.get('DB_NAME', 'rentmate'),
                    entities: [user_entity_1.User, property_entity_1.Property, contract_entity_1.Contract, transaction_entity_1.Transaction, message_entity_1.Message, notification_entity_1.Notification],
                    synchronize: configService.get('DB_SYNCHRONIZE', 'true') === 'true',
                    logging: configService.get('DB_LOGGING', 'false') === 'true',
                }),
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            properties_module_1.PropertiesModule,
            messages_module_1.MessagesModule,
            ai_module_1.AiModule,
            notifications_module_1.NotificationsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map