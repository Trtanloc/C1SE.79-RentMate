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
const serve_static_1 = require("@nestjs/serve-static");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const path_1 = require("path");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const properties_module_1 = require("./properties/properties.module");
const user_entity_1 = require("./users/entities/user.entity");
const property_entity_1 = require("./properties/entities/property.entity");
const property_photo_entity_1 = require("./properties/entities/property-photo.entity");
const property_amenity_entity_1 = require("./properties/entities/property-amenity.entity");
const contract_entity_1 = require("./contracts/entities/contract.entity");
const transaction_entity_1 = require("./transactions/entities/transaction.entity");
const message_entity_1 = require("./messages/entities/message.entity");
const messages_module_1 = require("./messages/messages.module");
const ai_module_1 = require("./ai/ai.module");
const notification_entity_1 = require("./notifications/entities/notification.entity");
const notifications_module_1 = require("./notifications/notifications.module");
const stats_module_1 = require("./stats/stats.module");
const contracts_module_1 = require("./contracts/contracts.module");
const transactions_module_1 = require("./transactions/transactions.module");
const testimonials_module_1 = require("./testimonials/testimonials.module");
const testimonial_entity_1 = require("./testimonials/entities/testimonial.entity");
const database_module_1 = require("./database/database.module");
const verification_codes_module_1 = require("./verification-codes/verification-codes.module");
const verification_code_entity_1 = require("./verification-codes/entities/verification-code.entity");
const mailer_module_1 = require("./mail/mailer.module");
const landlord_application_entity_1 = require("./landlord-applications/entities/landlord-application.entity");
const landlord_applications_module_1 = require("./landlord-applications/landlord-applications.module");
const metadata_module_1 = require("./metadata/metadata.module");
const favorite_entity_1 = require("./favorites/entities/favorite.entity");
const favorites_module_1 = require("./favorites/favorites.module");
const password_reset_entity_1 = require("./password-resets/entities/password-reset.entity");
const password_resets_module_1 = require("./password-resets/password-resets.module");
const review_entity_1 = require("./reviews/entities/review.entity");
const reviews_module_1 = require("./reviews/reviews.module");
const conversation_entity_1 = require("./conversations/entities/conversation.entity");
const conversations_module_1 = require("./conversations/conversations.module");
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
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const isProd = configService.get('NODE_ENV', 'development') === 'production';
                    return {
                        type: 'mysql',
                        host: configService.get('DB_HOST', 'localhost'),
                        port: configService.get('DB_PORT', 3306),
                        username: configService.get('DB_USER', 'root'),
                        password: configService.get('DB_PASS', '123456'),
                        database: configService.get('DB_NAME', 'rentmate'),
                        entities: [
                            user_entity_1.User,
                            property_entity_1.Property,
                            property_photo_entity_1.PropertyPhoto,
                            property_amenity_entity_1.PropertyAmenity,
                            contract_entity_1.Contract,
                            transaction_entity_1.Transaction,
                            message_entity_1.Message,
                            notification_entity_1.Notification,
                            testimonial_entity_1.Testimonial,
                            landlord_application_entity_1.LandlordApplication,
                            verification_code_entity_1.VerificationCode,
                            favorite_entity_1.Favorite,
                            password_reset_entity_1.PasswordReset,
                            review_entity_1.Review,
                            conversation_entity_1.Conversation,
                        ],
                        synchronize: configService.get('DB_SYNCHRONIZE', isProd ? 'false' : 'true') === 'true',
                        dropSchema: configService.get('DB_DROP_SCHEMA', 'false') === 'true',
                        logging: configService.get('DB_LOGGING', 'false') === 'true',
                    };
                },
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            properties_module_1.PropertiesModule,
            messages_module_1.MessagesModule,
            ai_module_1.AiModule,
            notifications_module_1.NotificationsModule,
            stats_module_1.StatsModule,
            contracts_module_1.ContractsModule,
            transactions_module_1.TransactionsModule,
            testimonials_module_1.TestimonialsModule,
            database_module_1.DatabaseModule,
            verification_codes_module_1.VerificationCodesModule,
            mailer_module_1.MailerModule,
            landlord_applications_module_1.LandlordApplicationsModule,
            metadata_module_1.MetadataModule,
            favorites_module_1.FavoritesModule,
            password_resets_module_1.PasswordResetsModule,
            reviews_module_1.ReviewsModule,
            conversations_module_1.ConversationsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map