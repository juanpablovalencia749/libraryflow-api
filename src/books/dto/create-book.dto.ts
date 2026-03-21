import { IsString, IsInt, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ example: 'The Great Gatsby' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald' })
  @IsString()
  author!: string;

  @ApiProperty({ example: 1925 })
  @IsInt()
  publicationYear!: number;

  @ApiPropertyOptional({ example: 'AVAILABLE', enum: ['AVAILABLE', 'RESERVED'] })
  @IsOptional()
  @IsIn(['AVAILABLE', 'RESERVED'])
  status?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
