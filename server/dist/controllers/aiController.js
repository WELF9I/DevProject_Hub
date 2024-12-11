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
/**
 * @description Extracts search criteria from a user-provided prompt using the Gemini API.
 * The extracted criteria include titles, descriptions and tags.
 */
const extractSearchCriteria = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const { prompt } = req.body;
    try {
        // Sending request to Gemini API to extract search criteria
        const response = yield axios_1.default.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            contents: [{
                    parts: [{
                            text: `Extract search criteria from this prompt: "${prompt}". 
                               Return a JSON object with the following fields only:
                               - title: an array of potential title keywords
                               - description: an array of descriptive keywords
                               - tags: an array of relevant technology tags
                               Example format:
                               {
                                   "title": ["portfolio website"],
                                   "description": ["simple"],
                                   "tags": ["html", "css"]
                               }`
                        }]
                }],
            generationConfig: {
                temperature: 0.2,
                topK: 40,
                topP: 0.8,
                maxOutputTokens: 1024,
            }
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Response received from Gemini API:', JSON.stringify(response.data, null, 2));
        // Validate the response structure from Gemini API
        const aiResponse = (_f = (_e = (_d = (_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.parts) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.text;
        if (!aiResponse) {
            throw new errorHandler_1.CustomError('Unexpected AI response structure.', 500);
        }
        let cleanedResponseText = aiResponse.trim();
        console.log('Initial AI response text:', cleanedResponseText);
        // here we remove code block markers (example, ```json) if they exist because they cause issues
        cleanedResponseText = cleanedResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        try {
            // Here we parse the AI response text into a JSON object
            const searchCriteria = JSON.parse(cleanedResponseText);
            // Validate the parsed object structure
            if (!Array.isArray(searchCriteria.title) ||
                !Array.isArray(searchCriteria.description) ||
                !Array.isArray(searchCriteria.tags)) {
                throw new Error('Incorrecte search criteria structure !.');
            }
            console.log('Successfully extracted search criteria:', searchCriteria);
            // Send the extracted criteria back to the client
            res.json(searchCriteria);
        }
        catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            console.error('Original AI response that failed to parse:', cleanedResponseText);
            throw new errorHandler_1.CustomError('Could not parse AI response into a valid JSON object.', 500);
        }
    }
    catch (error) {
        console.error('An error occurred in the extractSearchCriteria function:', error);
        if (axios_1.default.isAxiosError(error)) {
            console.error('Axios error details:', {
                responseData: (_g = error.response) === null || _g === void 0 ? void 0 : _g.data,
                statusCode: (_h = error.response) === null || _h === void 0 ? void 0 : _h.status,
                responseHeaders: (_j = error.response) === null || _j === void 0 ? void 0 : _j.headers
            });
            throw new errorHandler_1.CustomError(`Failed to communicate with the Gemini API: ${error.message}`, ((_k = error.response) === null || _k === void 0 ? void 0 : _k.status) || 500);
        }
        const errorMessage = error instanceof errorHandler_1.CustomError ? error.message : 'An unexpected error occurred while processing the search criteria.';
        const statusCode = error instanceof errorHandler_1.CustomError ? error.statusCode : 500;
        throw new errorHandler_1.CustomError(errorMessage, statusCode);
    }
});
exports.extractSearchCriteria = extractSearchCriteria;
