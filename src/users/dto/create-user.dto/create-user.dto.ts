import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty({message: 'The name is required'})
    @ApiProperty({ description: 'Nombre del usuario'})
    name: string;

    @IsString()
    @IsNotEmpty({message: 'The email is required'})
    @ApiProperty({ description: 'email del usuario'})

    email: string;

    @IsString()
    @IsNotEmpty({message: 'the password is required'})
    @ApiProperty({ description: 'contraseña del usuario'})

    password: string;
}
