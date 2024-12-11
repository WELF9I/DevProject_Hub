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
exports.deleteProjectFromHistory = exports.deleteAllUserHistory = exports.getUserHistory = exports.addHistory = void 0;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
/**
 @description add a new project to a user's history, if the user's history has more than 9 projects, the oldest one will be deleted
 */
const addHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clerk_id, project_id } = req.params;
    try {
        const { rows } = yield database_1.default.query(`
            WITH excess_history AS (
                DELETE FROM history
                WHERE id IN (
                    SELECT id FROM (
                        SELECT id,
                               ROW_NUMBER() OVER (
                                   PARTITION BY clerk_id 
                                   ORDER BY visit_date DESC
                               ) as rank
                        FROM history
                        WHERE clerk_id = $1
                    ) AS ranked
                    WHERE rank > 9
                )
            )
            INSERT INTO history (clerk_id, project_id, visit_date)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            RETURNING *;
        `, [clerk_id, project_id]);
        yield database_1.default.query(`
            DELETE FROM history 
            WHERE id IN (
                SELECT id FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY clerk_id 
                               ORDER BY visit_date DESC
                           ) as rank
                    FROM history
                    WHERE clerk_id = $1
                ) AS ranked
                WHERE rank > 9
            );
        `, [clerk_id]);
        res.status(201).json(rows[0]);
    }
    catch (error) {
        // check if error is due to unique constraint violation
        if (error.code === '23505') {
            // if the project has already been added to the user's history, update the visit_date to override the old one
            const updateResult = yield database_1.default.query(`
                UPDATE history 
                SET visit_date = CURRENT_TIMESTAMP 
                WHERE clerk_id = $1 AND project_id = $2 
                RETURNING *;
            `, [clerk_id, project_id]);
            res.status(200).json(updateResult.rows[0]);
        }
        else {
            throw new errorHandler_1.CustomError('Failed to update project history', 400);
        }
    }
});
exports.addHistory = addHistory;
/**
 @description get all history for a specific user
 */
const getUserHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clerk_id } = req.params;
    try {
        const { rows } = yield database_1.default.query(`
            SELECT p.*, h.visit_date
            FROM history h
            JOIN projects p ON h.project_id = p.id
            WHERE h.clerk_id = $1
            ORDER BY h.visit_date DESC
            LIMIT 9
        `, [clerk_id]);
        res.json(rows);
    }
    catch (error) {
        throw new errorHandler_1.CustomError('Failed to retrieve history of the user', 500);
    }
});
exports.getUserHistory = getUserHistory;
/**
 @description delete all user's history
 */
const deleteAllUserHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clerk_id } = req.params;
    try {
        const { rowCount } = yield database_1.default.query(`
            DELETE FROM history
            WHERE clerk_id = $1
        `, [clerk_id]);
        res.status(200).json({
            message: 'All history projects deleted successfully',
            deletedCount: rowCount
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.CustomError) {
            throw error;
        }
        else {
            throw new errorHandler_1.CustomError('Failed to delete all user history', 500);
        }
    }
});
exports.deleteAllUserHistory = deleteAllUserHistory;
/**
 @description delete a specific project from a user's history
 */
const deleteProjectFromHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clerk_id, project_id } = req.params;
    try {
        const { rowCount } = yield database_1.default.query(`
            DELETE FROM history
            WHERE clerk_id = $1 AND project_id = $2
        `, [clerk_id, project_id]);
        if (rowCount === 0) {
            throw new errorHandler_1.CustomError('This project not found in user history', 404);
        }
        res.status(200).json({ message: 'project deleted from history successfully' });
    }
    catch (error) {
        if (error instanceof errorHandler_1.CustomError) {
            throw error;
        }
        else {
            throw new errorHandler_1.CustomError('Failed to delete project from history', 500);
        }
    }
});
exports.deleteProjectFromHistory = deleteProjectFromHistory;
