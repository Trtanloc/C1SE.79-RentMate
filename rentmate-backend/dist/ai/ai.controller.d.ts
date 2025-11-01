import { Request } from 'express';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    handleChat(chatRequestDto: ChatRequestDto, request: Request): Promise<{
        conversationId: string;
        reply: string;
        source: string;
        context: string;
    }>;
}
