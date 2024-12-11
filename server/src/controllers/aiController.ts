import { Request, Response } from 'express';
import { CustomError } from '../middleware/errorHandler';
import axios from 'axios';

interface SearchCriteria {
    title: string[];
    description: string[];
    tags: string[];
}

/**
 * @description Extracts search criteria from a user-provided prompt using the Gemini API.
 * The extracted criteria include titles, descriptions and tags.
 */
export const extractSearchCriteria = async (req: Request, res: Response) => {
    const { prompt } = req.body;
    try {
        // Sending request to Gemini API to extract search criteria
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
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
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        console.log('Response received from Gemini API:', JSON.stringify(response.data, null, 2));

        // Validate the response structure from Gemini API
        const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResponse) {
            throw new CustomError('Unexpected AI response structure.', 500);
        }

        let cleanedResponseText = aiResponse.trim();
        console.log('Initial AI response text:', cleanedResponseText);

        // here we remove code block markers (example, ```json) if they exist because they cause issues
        cleanedResponseText = cleanedResponseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        try {
            // Here we parse the AI response text into a JSON object
            const searchCriteria: SearchCriteria = JSON.parse(cleanedResponseText);

            // Validate the parsed object structure
            if (!Array.isArray(searchCriteria.title) || 
                !Array.isArray(searchCriteria.description) || 
                !Array.isArray(searchCriteria.tags)) {
                throw new Error('Incorrecte search criteria structure !.');
            }
            console.log('Successfully extracted search criteria:', searchCriteria);

            // Send the extracted criteria back to the client
            res.json(searchCriteria);
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            console.error('Original AI response that failed to parse:', cleanedResponseText);
            throw new CustomError('Could not parse AI response into a valid JSON object.', 500);
        }
    } catch (error) {
        console.error('An error occurred in the extractSearchCriteria function:', error);

        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', {
                responseData: error.response?.data,
                statusCode: error.response?.status,
                responseHeaders: error.response?.headers
            });
            throw new CustomError(
                `Failed to communicate with the Gemini API: ${error.message}`, 
                error.response?.status || 500
            );
        }
        const errorMessage = error instanceof CustomError ? error.message : 'An unexpected error occurred while processing the search criteria.';
        const statusCode = error instanceof CustomError ? error.statusCode : 500;
        throw new CustomError(errorMessage, statusCode);
    }
};
