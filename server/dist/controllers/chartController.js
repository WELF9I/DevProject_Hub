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
exports.getPopularTagsByEngagement = void 0;
const database_1 = __importDefault(require("../config/database"));
const getPopularTagsByEngagement = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { rows } = yield database_1.default.query(`
            SELECT 
                unnest(tags) AS name,
                SUM(
                    COALESCE(stars, 0) + 
                    COALESCE(forks, 0) + 
                    COALESCE(watchers, 0)
                ) AS value
            FROM projects
            GROUP BY name
            ORDER BY value DESC
            LIMIT 5
        `);
        res.json(rows);
    }
    catch (error) {
        console.error('Error in getPopularTagsByEngagement:', error);
        res.status(500).json({ message: 'Failed to retrieve tag engagement' });
    }
});
exports.getPopularTagsByEngagement = getPopularTagsByEngagement;
