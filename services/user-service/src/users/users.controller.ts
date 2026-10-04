import { Controller, Get, Param, Body, Post, Put, Patch, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UserService } from './users.service';
import { User } from './user.schema';
import { SyncUserDto } from './dto/create-user.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { KeycloakGuard } from '../auth/keycloak.guard';
import { AuthUser } from '../auth/keycloak.strategy';
import { KeycloakAdminService } from './keycloak-admin.service';

type AuthRequest = { user: AuthUser };

const isAdmin = (u: AuthUser) => u.roles.includes('ADMIN');
const isManagement = (u: AuthUser) => u.roles.includes('ADMIN') || u.roles.includes('MANAGER');

/** Owners may act on their own record; anything else on someone else's record is ADMIN only. */
function ownerOrAdmin(u: AuthUser, keycloakId: string) {
    if (u.sub !== keycloakId && !isAdmin(u)) throw new ForbiddenException('Accès refusé');
}

@Controller('api/users')
@UseGuards(KeycloakGuard)
export class UserController {
    constructor(private readonly userService: UserService, private readonly keycloakAdmin: KeycloakAdminService) {}

    @Post('sync')
    async syncUser(@Body() syncUserDto: SyncUserDto, @Req() req: AuthRequest) {
        // A user can only sync their own account
        return this.userService.syncUser({ ...syncUserDto, keycloakId: req.user.sub });
    }

    @Post('sync-keycloak')
    async syncKeycloak(@Req() req: AuthRequest): Promise<User> {
        // Built from the validated token, never from the request body
        return this.userService.createOrUpdateFromKeycloak(req.user);
    }

    /** The current user's account as Keycloak knows it. */
    @Get('me')
    me(@Req() req: AuthRequest) {
        const u = req.user;
        return { id: u.sub, username: u.preferred_username, firstName: u.given_name, lastName: u.family_name, email: u.email, emailVerified: u.email_verified, roles: u.roles };
    }

    /** Edits the current user's name and e-mail from the app's own profile page. */
    @Patch('me')
    async updateMe(@Body() dto: UpdateAccountDto, @Req() req: AuthRequest) {
        const verificationSent = await this.keycloakAdmin.updateAccount(req.user.sub, req.user, dto);
        await this.userService.mirrorAccount(req.user.sub, dto);
        return { ...dto, verificationSent };
    }

    @Get()
    async findAll(@Req() req: AuthRequest): Promise<User[]> {
        if (!isManagement(req.user)) throw new ForbiddenException('Accès refusé');
        return this.userService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Req() req: AuthRequest): Promise<User | null> {
        ownerOrAdmin(req.user, id);
        return this.userService.findByKeycloakId(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateData: Record<string, unknown>, @Req() req: AuthRequest): Promise<User> {
        ownerOrAdmin(req.user, id);
        return this.userService.update(id, updateData);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req: AuthRequest): Promise<void> {
        if (!isAdmin(req.user)) throw new ForbiddenException('Accès refusé');
        return this.userService.remove(id);
    }
}
