import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './user.schema';
import { SyncUserDto } from './dto/create-user.dto';

type SafeUpdateFields = Partial<Pick<User, 'username' | 'firstName' | 'lastName' | 'email' | 'num_tel' | 'isActive'>>;

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

    async syncUser(syncUserDto: SyncUserDto): Promise<User> {
        let user = await this.userModel.findOne({
            $or: [{ keycloakId: syncUserDto.keycloakId }, { email: syncUserDto.email }],
        });

        if (!user) {
            // Role is never accepted from the caller — always start as USER.
            // Elevation to higher roles must go through Keycloak admin.
            const { role: _ignored, ...profileFields } = syncUserDto;
            user = new this.userModel({ ...profileFields, role: UserRole.USER });
        } else {
            user.keycloakId = syncUserDto.keycloakId;
            user.username = syncUserDto.username;
            user.firstName = syncUserDto.firstName;
            user.lastName = syncUserDto.lastName;
            user.email = syncUserDto.email;
            // Role is never updated via sync — use a dedicated admin endpoint.
        }

        return user.save();
    }

    async createOrUpdateFromKeycloak(data: { sub: string; preferred_username?: string; given_name?: string; family_name?: string; email?: string }): Promise<User> {
        const update = {
            username: data.preferred_username,
            firstName: data.given_name,
            lastName: data.family_name,
            email: data.email,
            keycloakId: data.sub,
            // Role is not accepted from caller — Keycloak is the source of truth for roles.
            role: UserRole.USER,
        };

        const user = await this.userModel.findOneAndUpdate(
            { keycloakId: data.sub },
            update,
            { new: true, upsert: true },
        ).exec();

        if (!user) {
            throw new NotFoundException('Failed to create or update user');
        }

        return user;
    }

    async findByKeycloakId(keycloakId: string): Promise<User | null> {
        const user = await this.userModel.findOne({ keycloakId }).exec();
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findAll(): Promise<User[]> {
        return this.userModel.find().exec();
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userModel.findById(id).exec();
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async update(keycloakId: string, updateData: Record<string, unknown>): Promise<User> {
        // Copy only editable fields: the body must never set role, keycloakId or links to other records
        const allowed: (keyof SafeUpdateFields)[] = ['firstName', 'lastName', 'num_tel'];
        const safe = Object.fromEntries(Object.entries(updateData).filter(([k]) => (allowed as string[]).includes(k)));
        const updated = await this.userModel.findOneAndUpdate({ keycloakId }, safe, { new: true }).exec();
        if (!updated) throw new NotFoundException('User not found');
        return updated;
    }

    /** Keeps the local copy in step after the account was changed in Keycloak. */
    async mirrorAccount(keycloakId: string, account: { firstName: string; lastName: string; email: string }): Promise<void> {
        await this.userModel.updateOne({ keycloakId }, account).exec();
    }

    async remove(keycloakId: string): Promise<void> {
        const deleted = await this.userModel.findOneAndDelete({ keycloakId }).exec();
        if (!deleted) throw new NotFoundException('User not found');
    }
}
