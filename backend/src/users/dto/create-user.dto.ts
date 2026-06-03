import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Carlos' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '1990-05-15', required: false })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiProperty({ example: 'carlos@admin.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'admin', required: false })
  @IsString()
  @IsOptional()
  business?: string;

  @ApiProperty({ example: 'contraseña123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
