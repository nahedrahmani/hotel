import { Controller, Get, Param, Body, Post, Put, Delete, UseGuards } from '@nestjs/common';
import { UserService } from './users.service';
import { User } from './user.schema';
import { SyncUserDto } from './dto/create-user.dto';
import { KeycloakGuard } from '../auth/keycloak.guard';

@Controller('api/users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @UseGuards(KeycloakGuard)
    @Post('sync')
    async syncUser(@Body() syncUserDto: SyncUserDto) {
        return this.userService.syncUser(syncUserDto);
    }

    @UseGuards(KeycloakGuard)
    @Post('sync-keycloak')
    async syncKeycloak(@Body() keycloakData: any): Promise<User> {
        return this.userService.createOrUpdateFromKeycloak(keycloakData);
    }

    @UseGuards(KeycloakGuard)
    @Get()
    async findAll(): Promise<User[]> {
        return this.userService.findAll();
    }

    @UseGuards(KeycloakGuard)
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<User | null> {
        return this.userService.findByKeycloakId(id);
    }

    @UseGuards(KeycloakGuard)
    @Put(':id')
    async update(@Param('id') id: string, @Body() updateData: any): Promise<User> {
        return this.userService.update(id, updateData);
    }

    @UseGuards(KeycloakGuard)
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.userService.remove(id);
    }
}
