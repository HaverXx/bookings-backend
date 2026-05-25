import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'María López' })
  @IsString()
  name: string;

  @ApiProperty({ example: '600 123 456' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'maria@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  businessId: number;
}