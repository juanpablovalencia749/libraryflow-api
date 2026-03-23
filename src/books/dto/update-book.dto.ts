import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBookDto } from './create-book.dto.js';

export class UpdateBookDto extends PartialType(
  OmitType(CreateBookDto, ['status'] as const),
) {}