import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * 
 @description get popular tags by their engagement in projects with sum of stars, forks and watchers
 */
export const getPopularTagsByEngagement = async (req: Request, res: Response) => {
    try {
        const { rows } = await pool.query(`
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
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve the tag engagement' });
    }
};
