import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { Document } from 'mongoose';
import { Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
    USER = 'USER',
    PROPRIETAIRE = 'PROPRIETAIRE',
    ADMIN = 'ADMIN',
    ARTISANT = 'ARTISANT',
    HOTEL_MANAGEMENT = 'HOTEL_MANAGEMENT',
    CAR_SERVICE_MANAGEMENT = 'CAR_SERVICE_MANAGEMENT',
}

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    username: string;

    @Prop({ required: true })
    firstName: string;

    @Prop({ required: true })
    lastName: string;

    @Prop({ required: true, unique: true, lowercase: true })
    email: string;

    @Prop({ enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Prop()
    num_tel?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: Types.ObjectId, ref: 'MaisonHote' })
    maisonHoteId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Hotel' })
    hotelId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Artisan' })
    artisanId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'CarService' })
    carServiceId?: Types.ObjectId;

    @Prop({ unique: true, required: true })
    keycloakId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);