import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {EurekaModule} from "./eureka/eureka.module";
import { MongooseModule } from '@nestjs/mongoose';
import * as process from "node:process";
import {UsersModule} from "./users/UsersModule";
import {ConfigModule} from "@nestjs/config";
import {AuthModule} from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI!),
    UsersModule,
    EurekaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
