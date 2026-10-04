import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Fields a user may change on their own account. */
export class UpdateAccountDto {
    @IsString()
    @IsNotEmpty({ message: 'Le prénom est obligatoire.' })
    @MaxLength(60)
    firstName: string;

    @IsString()
    @IsNotEmpty({ message: 'Le nom est obligatoire.' })
    @MaxLength(60)
    lastName: string;

    @IsEmail({}, { message: 'Adresse e-mail invalide.' })
    email: string;
}
