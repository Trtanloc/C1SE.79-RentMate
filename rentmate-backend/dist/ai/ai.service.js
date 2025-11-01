"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const property_entity_1 = require("../properties/entities/property.entity");
const contract_entity_1 = require("../contracts/entities/contract.entity");
const transaction_entity_1 = require("../transactions/entities/transaction.entity");
const messages_service_1 = require("../messages/messages.service");
const message_sender_enum_1 = require("../common/enums/message-sender.enum");
const property_status_enum_1 = require("../common/enums/property-status.enum");
let AiService = AiService_1 = class AiService {
    constructor(configService, propertyRepository, contractRepository, transactionRepository, messagesService) {
        var _a;
        this.configService = configService;
        this.propertyRepository = propertyRepository;
        this.contractRepository = contractRepository;
        this.transactionRepository = transactionRepository;
        this.messagesService = messagesService;
        this.logger = new common_1.Logger(AiService_1.name);
        this.geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        const defaultModel = 'models/gemini-2.5-flash';
        this.geminiModel =
            (_a = this.configService.get('GEMINI_MODEL')) !== null && _a !== void 0 ? _a : defaultModel;
    }
    async handleChat(user, chatRequestDto) {
        var _a;
        const trimmedMessage = chatRequestDto.message.trim();
        const conversationId = this.buildConversationId(user.id);
        await this.messagesService.logMessage({
            conversationId,
            senderId: user.id,
            senderType: message_sender_enum_1.MessageSender.Tenant,
            content: trimmedMessage,
            mode: 'assistant',
        });
        const contextResult = await this.buildDatabaseContext(trimmedMessage, user.id);
        const prompt = this.buildPrompt(trimmedMessage, user.fullName, contextResult === null || contextResult === void 0 ? void 0 : contextResult.context);
        const reply = await this.requestGemini(prompt);
        await this.messagesService.logMessage({
            conversationId,
            senderType: message_sender_enum_1.MessageSender.Assistant,
            content: reply,
            mode: 'assistant',
        });
        return {
            conversationId,
            reply,
            source: contextResult ? contextResult.source : 'gemini',
            context: (_a = contextResult === null || contextResult === void 0 ? void 0 : contextResult.context) !== null && _a !== void 0 ? _a : null,
        };
    }
    buildConversationId(senderId) {
        return `tenant-${senderId}`;
    }
    buildPrompt(message, tenantName, context) {
        const persona = 'Bạn là "RentMate Virtual Assistant" – giúp người thuê nhà tra cứu thông tin, hỏi về hợp đồng, thanh toán và gợi ý bất động sản phù hợp. Giữ giọng điệu thân thiện, súc tích, ưu tiên tiếng Việt và chỉ chuyển sang tiếng Anh khi người dùng hỏi bằng tiếng Anh.';
        const contextBlock = context
            ? `Dữ liệu nội bộ cần ưu tiên trả lời:\n${context}`
            : 'Không có dữ liệu nội bộ phù hợp, hãy dựa vào kiến thức chung của bạn.';
        return `${persona}
Tên người thuê: ${tenantName !== null && tenantName !== void 0 ? tenantName : 'Khách'}.
${contextBlock}

Câu hỏi của người dùng:
${message}

Hãy trả lời với tối đa 2-3 đoạn ngắn cùng danh sách gạch đầu dòng khi hữu ích.`;
    }
    async requestGemini(prompt) {
        var _a, _b, _c, _d, _e, _f;
        const apiKey = this.configService.get('GEMINI_API_KEY');
        if (!apiKey) {
            this.logger.error('Missing GEMINI_API_KEY – returning fallback answer.');
            return 'RentMate chưa được cấu hình khóa Gemini. Vui lòng liên hệ quản trị viên.';
        }
        try {
            const endpoint = `${this.geminiBaseUrl}/${this.geminiModel}:generateContent`;
            const response = await axios_1.default.post(`${endpoint}?key=${apiKey}`, {
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }],
                    },
                ],
            }, { headers: { 'Content-Type': 'application/json' } });
            const candidate = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0];
            const reply = (_d = (_c = candidate === null || candidate === void 0 ? void 0 : candidate.content) === null || _c === void 0 ? void 0 : _c.parts) === null || _d === void 0 ? void 0 : _d.map((part) => part.text).join('\n').trim();
            if (!reply) {
                return 'Trợ lý AI tạm thời chưa có câu trả lời, vui lòng thử lại sau.';
            }
            return reply;
        }
        catch (error) {
            this.logger.error('Gemini API error', (_f = (_e = error === null || error === void 0 ? void 0 : error.response) === null || _e === void 0 ? void 0 : _e.data) !== null && _f !== void 0 ? _f : error.message);
            return 'Gemini đang bận, vui lòng thử lại trong ít phút nữa.';
        }
    }
    async buildDatabaseContext(message, tenantId) {
        const sections = [];
        const propertyRecommendations = await this.gatherPropertyRecommendations(message);
        if (propertyRecommendations) {
            sections.push(propertyRecommendations);
        }
        const contractStatus = await this.lookupLatestContractStatus(message, tenantId);
        if (contractStatus) {
            sections.push(contractStatus);
        }
        const transactionInfo = await this.lookupLatestTransaction(message, tenantId);
        if (transactionInfo) {
            sections.push(transactionInfo);
        }
        if (!sections.length) {
            return null;
        }
        return {
            source: 'database+gemini',
            context: sections.join('\n\n'),
        };
    }
    async gatherPropertyRecommendations(message) {
        const normalized = message.toLowerCase();
        const mentionsProperty = /(căn hộ|chung cư|apartment|nhà thuê|thuê nhà|property|bất động sản)/.test(normalized);
        const mentionsPrice = /(giá|price|bao nhiêu|dưới|tầm|khoảng|budget)/.test(normalized);
        const maxBudget = this.extractBudget(message);
        const city = this.extractCity(message);
        if (!mentionsProperty && !mentionsPrice && !maxBudget && !city) {
            return null;
        }
        const query = this.propertyRepository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.owner', 'owner')
            .where('property.status = :status', {
            status: property_status_enum_1.PropertyStatus.Available,
        });
        if (maxBudget) {
            query.andWhere('property.price <= :maxBudget', { maxBudget });
        }
        if (city) {
            query.andWhere('(property.address LIKE :city OR property.title LIKE :city)', { city: `%${city}%` });
        }
        const properties = await query
            .orderBy('property.price', 'ASC')
            .limit(3)
            .getMany();
        if (!properties.length) {
            return `Không có bất động sản phù hợp với điều kiện ${city ? `tại ${city}` : ''} ${maxBudget ? `và ngân sách ${this.formatCurrency(maxBudget)}` : ''}.`;
        }
        const lines = properties.map((property) => {
            var _a, _b;
            const ownerName = (_b = (_a = property.owner) === null || _a === void 0 ? void 0 : _a.fullName) !== null && _b !== void 0 ? _b : 'Chưa cập nhật';
            return `• ${property.title} (${property.address}) – ${this.formatCurrency(Number(property.price))}/tháng, chủ nhà: ${ownerName}`;
        });
        return `Gợi ý bất động sản từ cơ sở dữ liệu:\n${lines.join('\n')}`;
    }
    async lookupLatestContractStatus(message, tenantId) {
        var _a, _b, _c, _d, _e, _f;
        const normalized = message.toLowerCase();
        if (!/(hợp đồng|contract|ký kết|đã ký)/.test(normalized)) {
            return null;
        }
        const ownerName = this.extractOwnerName(message);
        const query = this.contractRepository
            .createQueryBuilder('contract')
            .leftJoinAndSelect('contract.owner', 'owner')
            .leftJoinAndSelect('contract.property', 'property')
            .where('contract.tenantId = :tenantId', { tenantId })
            .orderBy('contract.updatedAt', 'DESC');
        if (ownerName) {
            query.andWhere('owner.fullName LIKE :ownerName', {
                ownerName: `%${ownerName}%`,
            });
        }
        const contract = await query.getOne();
        if (!contract) {
            return `Không tìm thấy hợp đồng nào của người thuê #${tenantId}${ownerName ? ` với chủ nhà ${ownerName}` : ''}.`;
        }
        const signedAt = contract.signedAt
            ? new Date(contract.signedAt).toLocaleString('vi-VN')
            : 'Chưa ký';
        return `Hợp đồng gần nhất:
- Số hợp đồng: ${contract.contractNumber}
- Chủ nhà: ${(_b = (_a = contract.owner) === null || _a === void 0 ? void 0 : _a.fullName) !== null && _b !== void 0 ? _b : 'Chưa cập nhật'}
- Bất động sản: ${(_d = (_c = contract.property) === null || _c === void 0 ? void 0 : _c.title) !== null && _d !== void 0 ? _d : 'Không rõ'}
- Thời hạn: ${(_e = contract.startDate) !== null && _e !== void 0 ? _e : 'N/A'} → ${(_f = contract.endDate) !== null && _f !== void 0 ? _f : 'N/A'}
- Trạng thái: ${contract.status}
- Ngày ký: ${signedAt}`;
    }
    async lookupLatestTransaction(message, tenantId) {
        var _a, _b, _c, _d, _e;
        const normalized = message.toLowerCase();
        if (!/(giao dịch|transaction|thanh toán|payment|chuyển khoản)/.test(normalized)) {
            return null;
        }
        const transaction = await this.transactionRepository
            .createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.contract', 'contract')
            .leftJoinAndSelect('contract.property', 'property')
            .leftJoin('contract.tenant', 'tenant')
            .where('tenant.id = :tenantId', { tenantId })
            .orderBy('transaction.createdAt', 'DESC')
            .getOne();
        if (!transaction) {
            return `Chưa ghi nhận giao dịch nào cho người thuê #${tenantId}.`;
        }
        const paidAt = transaction.paidAt
            ? new Date(transaction.paidAt).toLocaleString('vi-VN')
            : 'Chưa thanh toán';
        return `Thanh toán gần nhất:
- Hợp đồng: ${(_b = (_a = transaction.contract) === null || _a === void 0 ? void 0 : _a.contractNumber) !== null && _b !== void 0 ? _b : '#'}
- Bất động sản: ${(_e = (_d = (_c = transaction.contract) === null || _c === void 0 ? void 0 : _c.property) === null || _d === void 0 ? void 0 : _d.title) !== null && _e !== void 0 ? _e : 'Không rõ'}
- Số tiền: ${this.formatCurrency(Number(transaction.amount))}
- Trạng thái: ${transaction.status}
- Ngày thanh toán: ${paidAt}`;
    }
    extractBudget(message) {
        var _a;
        const budgetRegex = /(?:giá|dưới|under|tối đa|max|budget|khoảng)\D*(\d+(?:[.,]\d+)?)(?:\s*)(triệu|tr|million|tỷ|ty|nghìn|ngàn|k)?/i;
        const match = message.match(budgetRegex);
        if (!match) {
            return undefined;
        }
        const value = parseFloat(match[1].replace(',', '.'));
        const unit = (_a = match[2]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        if (!unit || unit === 'vnd') {
            return value;
        }
        if (unit.includes('triệu') || unit === 'tr' || unit === 'million') {
            return value * 1000000;
        }
        if (unit.includes('tỷ') || unit === 'ty') {
            return value * 1000000000;
        }
        if (unit.includes('nghìn') || unit.includes('ngàn') || unit === 'k') {
            return value * 1000;
        }
        return value;
    }
    extractCity(message) {
        const cityRegex = /(?:ở|tai|tại|in)\s+([\p{L}\s]+?)(?=[\.,!?]|$)/iu;
        const match = message.match(cityRegex);
        if (!match) {
            return undefined;
        }
        return match[1].trim();
    }
    extractOwnerName(message) {
        const ownerRegex = /chủ nhà\s+([\p{L}\s]+?)(?=[\?,\.]|$)/iu;
        const match = message.match(ownerRegex);
        if (match) {
            return match[1].trim();
        }
        const genericRegex = /với\s+ông\s+([\p{L}\s]+?)(?=[\?,\.]|$)/iu;
        const secondary = message.match(genericRegex);
        return secondary ? secondary[1].trim() : undefined;
    }
    formatCurrency(value) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0,
        }).format(value);
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(property_entity_1.Property)),
    __param(2, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __param(3, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        messages_service_1.MessagesService])
], AiService);
//# sourceMappingURL=ai.service.js.map