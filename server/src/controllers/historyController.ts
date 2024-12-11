import { Request, Response } from 'express';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';


/**
 @description add a new project to a user's history, if the user's history has more than 9 projects, the oldest one will be deleted
 */
export const addHistory = async (req: Request, res: Response) => {
    const { clerk_id, project_id } = req.params;
    
    try {
        const { rows } = await pool.query(`
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

        await pool.query(`
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
    } catch (error) {
        // check if error is due to unique constraint violation
        if ((error as any).code === '23505') {
            // if the project has already been added to the user's history, update the visit_date to override the old one
            const updateResult = await pool.query(`
                UPDATE history 
                SET visit_date = CURRENT_TIMESTAMP 
                WHERE clerk_id = $1 AND project_id = $2 
                RETURNING *;
            `, [clerk_id, project_id]);
            
            res.status(200).json(updateResult.rows[0]);
        } else {
            throw new CustomError('Failed to update project history', 400);
        }
    }
};

/**
 @description get all history for a specific user
 */
export const getUserHistory = async (req: Request, res: Response) => {
    const { clerk_id } = req.params;
    
    try {
        const { rows } = await pool.query(`
            SELECT p.*, h.visit_date
            FROM history h
            JOIN projects p ON h.project_id = p.id
            WHERE h.clerk_id = $1
            ORDER BY h.visit_date DESC
            LIMIT 9
        `, [clerk_id]);
        
        res.json(rows);
    } catch (error) {
        throw new CustomError('Failed to retrieve history of the user', 500);
    }
};

/**
 @description delete all user's history
 */
export const deleteAllUserHistory = async (req: Request, res: Response) => {
    const { clerk_id } = req.params;

    try {
        const { rowCount } = await pool.query(`
            DELETE FROM history
            WHERE clerk_id = $1
        `, [clerk_id]);
        res.status(200).json({ 
            message: 'All history projects deleted successfully',
            deletedCount: rowCount 
        });
    } catch (error) {
        if (error instanceof CustomError) {
            throw error;
        } else {
            throw new CustomError('Failed to delete all user history', 500);
        }
    }
};

/**
 @description delete a specific project from a user's history
 */
export const deleteProjectFromHistory = async (req: Request, res: Response) => {
    const { clerk_id, project_id } = req.params;
    try {
        const { rowCount } = await pool.query(`
            DELETE FROM history
            WHERE clerk_id = $1 AND project_id = $2
        `, [clerk_id, project_id]);

        if (rowCount === 0) {
            throw new CustomError('This project not found in user history', 404);
        }
        res.status(200).json({ message: 'project deleted from history successfully' });
    } catch (error) {
        if (error instanceof CustomError) {
            throw error;
        } else {
            throw new CustomError('Failed to delete project from history', 500);
        }
    }
};