import { IsArray, IsIn, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegenerateDto {
  @ApiProperty({
    description: 'Fields to regenerate',
    enum: ['title', 'description'],
    isArray: true,
    example: ['title', 'description'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['title', 'description'], { each: true })
  fields!: Array<'title' | 'description'>;
}
