import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PropertiesModule } from './properties/properties.module';
import { User } from './users/entities/user.entity';
import { Property } from './properties/entities/property.entity';
import { Contract } from './contracts/entities/contract.entity';
import { Transaction } from './transactions/entities/transaction.entity';
import { Message } from './messages/entities/message.entity';
import { MessagesModule } from './messages/messages.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USER', 'root'),
        password: configService.get<string>('DB_PASS', '123456'),
        database: configService.get<string>('DB_NAME', 'rentmate'),
        entities: [User, Property, Contract, Transaction, Message],
        synchronize: configService.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        logging: configService.get<string>('DB_LOGGING', 'false') === 'true',
      }),
    }),
    UsersModule,
    AuthModule,
    PropertiesModule,
    MessagesModule,
    AiModule,
  ],
})
export class AppModule {}
