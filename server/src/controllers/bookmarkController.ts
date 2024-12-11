import { Request, Response } from 'express';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';

/**
 @description Create a new bookmark for a project of a specific user
 */

export const createBookmark = async (req: Request, res: Response) => {
    const { clerk_id, project_id } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO bookmarks (clerk_id, project_id) 
             VALUES ($1, $2) 
             ON CONFLICT (clerk_id, project_id) DO NOTHING 
             RETURNING *`,
            [clerk_id, project_id]
        );
        
        res.status(201).json(rows[0] || { message: 'Bookmark already exists' });
    } catch (error) {
        throw new CustomError('Failed to create bookmark', 400);
    }
};

/**
 @description delete a bookmark for a project of a specific user
 */

export const deleteBookmark = async (req: Request, res: Response) => {
    const { clerk_id, project_id } = req.body;
    try {
        await pool.query(
            `DELETE FROM bookmarks 
             WHERE clerk_id = $1 AND project_id = $2`,
            [clerk_id, project_id]
        );
        
        res.status(204).send();
    } catch (error) {
        throw new CustomError('Failed to remove bookmark', 400);
    }
};
/**
 @description get all bookmarks for a specific user
 */
export const getUserBookmarks = async (req: Request, res: Response) => {
    const { clerk_id } = req.params;
    try {
        const { rows } = await pool.query(`
            SELECT p.* 
            FROM bookmarks b
            JOIN projects p ON b.project_id = p.id
            WHERE b.clerk_id = $1
        `, [clerk_id]);
        
        res.json(rows);
    } catch (error) {
        throw new CustomError('Failed to retrieve bookmarks', 500);
    }
};
/**
 @description check if a project is bookmarked for thaa specific user
 */
export const checkProjectBookmark = async (req: Request, res: Response) => {
    const { clerk_id, project_id } = req.query;
    
    try {
        const { rows } = await pool.query(
            `SELECT EXISTS(
                SELECT 1 FROM bookmarks 
                WHERE clerk_id = $1 AND project_id = $2
            )`,
            [clerk_id, project_id]
        );
        
        res.json({ isBookmarked: rows[0].exists });
    } catch (error) {
        throw new CustomError('Failed to check bookmark status', 500);
    }
};

