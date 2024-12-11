"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSearchCriteria = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const axios_1 = __importDefault(require("axios"));
const extractSearchCriteria = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const { prompt } = req.body;
    if (!prompt) {
        throw new errorHandler_1.AppError('Search prompt is required', 400);
    }
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is not set in environment variables');
        throw new errorHandler_1.AppError('API configuration error', 500);
    }
    try {
        console.log('Sending request to Gemini API with prompt:', prompt);
        const response = yield axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            contents: [{
                    parts: [{
                            text: `Extract search criteria from this prompt: "${prompt}"
                        Return ONLY a JSON object with these fields:
                        - title: array of potential title keywords
                        - description: array of descriptive keywords
                        - tags: array of technology tags
                        Example format:
                        {
                            "title": ["portfolio website"],
                            "description": ["simple"],
                            "tags": ["html", "css"]
                        }
                        Return the JSON object directly without any markdown formatting or code blocks.`
                        }]
                }],
            generationConfig: {
                temperature: 0.2,
                topK: 40,
                topP: 0.8,
                maxOutputTokens: 1024,
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Received response from Gemini API:', JSON.stringify(response.data, null, 2));
        if (!((_f = (_e = (_d = (_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text)) {
            console.error('Invalid response structure from Gemini API:', response.data);
            throw new errorHandler_1.AppError('Invalid AI response structure', 500);
        }
        let aiResponseText = response.data.candidates[0].content.parts[0].text.trim();
        console.log('Original AI response text:', aiResponseText);
        // Remove markdown code blocks if present
        aiResponseText = aiResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        console.log('Cleaned AI response text:', aiResponseText);
        try {
            const searchCriteria = JSON.parse(aiResponseText);
            // Validate the parsed object structure
            if (!Array.isArray(searchCriteria.title) ||
                !Array.isArray(searchCriteria.description) ||
                !Array.isArray(searchCriteria.tags)) {
                throw new Error('Invalid search criteria structure');
            }
            console.log('Successfully parsed search criteria:', searchCriteria);
            res.json(searchCriteria);
        }
        catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            console.error('Raw AI response:', aiResponseText);
            throw new errorHandler_1.AppError('Failed to parse AI response', 500);
        }
    }
    catch (error) {
        console.error('Error in extractSearchCriteria:', error);
        if (axios_1.default.isAxiosError(error)) {
            console.error('Axios error details:', {
                response: (_g = error.response) === null || _g === void 0 ? void 0 : _g.data,
                status: (_h = error.response) === null || _h === void 0 ? void 0 : _h.status,
                headers: (_j = error.response) === null || _j === void 0 ? void 0 : _j.headers
            });
            throw new errorHandler_1.AppError(`Failed to communicate with AI service: ${error.message}`, ((_k = error.response) === null || _k === void 0 ? void 0 : _k.status) || 500);
        }
        throw new errorHandler_1.AppError(error instanceof errorHandler_1.AppError ? error.message : 'Failed to process search criteria', error instanceof errorHandler_1.AppError ? error.statusCode : 500);
    }
});
exports.extractSearchCriteria = extractSearchCriteria;
