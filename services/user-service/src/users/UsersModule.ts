import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { User, UserSchema } from './user.schema';
import { KeycloakAdminService } from './keycloak-admin.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
    providers: [UserService, KeycloakAdminService],
    controllers: [UserController],
    exports: [UserService],
})
export class UsersModule {}
