import { IsString, IsArray, ValidateNested, IsIn, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ description: 'The unique ID of the message' })
  @IsString()
  id!: string;

  @ApiPropertyOptional({ description: 'The ID of the message this replies to' })
  @IsOptional()
  @IsString()
  replyToId?: string;

  @ApiProperty({ description: 'The role of the message sender', enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @ApiProperty({ description: 'The message content' })
  @IsString()
  content!: string;
}

export class PublicChatDto {
  @ApiProperty({ description: 'Chat message history', type: [ChatMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];
}
