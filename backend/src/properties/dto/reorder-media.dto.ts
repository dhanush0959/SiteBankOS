import { IsArray, IsString, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MediaOrderItemDto {
  @ApiProperty()
  @IsString()
  id!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  orderIndex!: number;
}

export class ReorderMediaDto {
  @ApiProperty({ type: [MediaOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaOrderItemDto)
  order!: MediaOrderItemDto[];
}
