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
exports.checkProjectBookmark = exports.getUserBookmarks = exports.deleteBookmark = exports.createBookmark = void 0;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
/**
 @description Create a new bookmark for a project of a specific user
 */
const createBookmark = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clerk_id, project_id } = req.body;
    try {
        const { rows } = yield database_1.default.query(`INSERT INTO bookmarks (clerk_id, project_id) 
             VALUES ($1, $2) 
             ON CONFLICT (clerk_id, project_id) DO NOTHING 
             RETURNING *`, [clerk_id, project_id]);
        res.status(201).json(rows[0] || { message: 'Bookmark already exists' });
    }
    catch (error) {
        throw new errorHandler_1.CustomError('Failed to create bookmark', 400);
    }
});
exports.createBookmark = createBookmark;
/**
 @description delete a bookmark for a project of a specific user
 */
const deleteBookmark = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clerk_id, project_id } = req.body;
    try {
        yield database_1.default.query(`DELETE FROM bookmarks 
             WHERE clerk_id = $1 AND project_id = $2`, [clerk_id, project_id]);
        res.status(204).send();
    }
    catch (error) {
        throw new errorHandler_1.CustomError('Failed to remove bookmark', 400);
    }
});
exports.deleteBookmark = deleteBookmark;
/**
 @description get all bookmarks for a specific user
 */
const getUserBookmarks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clerk_id } = req.params;
    try {
        const { rows } = yield database_1.default.query(`
            SELECT p.* 
            FROM bookmarks b
            JOIN projects p ON b.project_id = p.id
            WHERE b.clerk_id = $1
        `, [clerk_id]);
        res.json(rows);
    }
    catch (error) {
        throw new errorHandler_1.CustomError('Failed to retrieve bookmarks', 500);
    }
});
exports.getUserBookmarks = getUserBookmarks;
/**
 @description check if a project is bookmarked for thaa specific user
 */
const checkProjectBookmark = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clerk_id, project_id } = req.query;
    try {
        const { rows } = yield database_1.default.query(`SELECT EXISTS(
                SELECT 1 FROM bookmarks 
                WHERE clerk_id = $1 AND project_id = $2
            )`, [clerk_id, project_id]);
        res.json({ isBookmarked: rows[0].exists });
    }
    catch (error) {
        throw new errorHandler_1.CustomError('Failed to check bookmark status', 500);
    }
});
exports.checkProjectBookmark = checkProjectBookmark;
