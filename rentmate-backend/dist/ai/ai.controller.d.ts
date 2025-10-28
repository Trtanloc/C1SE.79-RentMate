import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { Request } from 'express';
export declare class AiController {
    private readonly aiService;
    constructor(aiService: AiService);
    handleChat(chatRequestDto: ChatRequestDto, request: Request): Promise<{
        conversationId: string;
        reply: any;
        source: string;
        context: string;
    }>;
}
