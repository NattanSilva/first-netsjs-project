import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'dotenv/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGES_HOST,
      port: parseInt(process.env.POSTGES_PORT),
      username: process.env.POSTGES_USERNAME,
      password: process.env.POSTGES_PASSWORSD,
      database: process.env.POSTGES_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      logging: true,
      synchronize: true,
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
