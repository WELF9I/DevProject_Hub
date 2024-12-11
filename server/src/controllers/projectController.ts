import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import axios from 'axios';

interface SearchCriteria {
    title: string[];
    description: string[];
    tags: string[];
}
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 @description get all projects from the database
 */
export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await pool.query(`
            SELECT * FROM projects 
            ORDER BY created_at DESC
        `);
        const rows = result.rows;
        if (!res.headersSent) {
            res.status(200).json(rows);
        }
    } catch (error) {
        if (!res.headersSent) {
            next(new CustomError(
                (error as Error).message === 'Database query timeout' 
                    ? 'Database query timeout' 
                    : 'Failed to get projects',
                    500
            ));
        }
    }
};

/**
 @description get top 3 projects by engagement (sum of stars,forks,watchers)
 */

export const getTopProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await pool.query(`
            SELECT * FROM projects 
            ORDER BY (forks + stars + watchers) DESC 
            LIMIT 3
        `);

        const topProjects = result.rows;

        if (!res.headersSent) {
            res.status(200).json(topProjects);
        }
    } catch (error) {
        next(new CustomError(
            error instanceof Error ? error.message : 'Failed to get top projects',
            500
        ));
    }
};

/**
@description create a new project(s),and support insert multiple projects at the same time
 */

export const createProject = async (req: Request, res: Response) => {
    const projects = Array.isArray(req.body) ? req.body : [req.body];

    try {
        const createdProjects = [];
        for (const project of projects) {
            const { title, description, stars, forks, watchers, tags, link } = project;

            const { rows } = await pool.query(`
                INSERT INTO projects 
                (title, description, stars, forks, watchers, tags, link)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [title, description, stars, forks, watchers, tags, link]);

            createdProjects.push(rows[0]);
        }
        res.status(201).json(createdProjects);
    } catch (error) {
        throw new CustomError('Failed to create projects', 400);
    }
};

/**
 * @description Handles searching for projects based on title, description, and tags.
 * The system assigns different scores to the search criteria for better results.
 */
export const searchProjects = async (req: Request, res: Response, next: NextFunction) => {
    const { title: titleKeywords, description: descriptionKeywords, tags }: SearchCriteria = req.body;

    try {
        const queryValues: any[] = []; // values passed into the sql query
        let parameterIndex = 1; // used to track the position of parameters in the sql query
        const filterConditions: string[] = []; // stores the WHERE conditions
        let relevanceFactors: string[] = []; // tracks how relevance is calculated

        // ** Tag Filtering and Scoring **
        if (tags?.length > 0) {
            const tagPlaceholders: string[] = [];
            
            for (let i = 0; i < tags.length; i++) {
                const currentTag = tags[i];
                queryValues.push(currentTag.toUpperCase());
                queryValues.push(currentTag.toLowerCase());
                tagPlaceholders.push(`$${parameterIndex++}`);
                tagPlaceholders.push(`$${parameterIndex++}`);
                relevanceFactors.push(
                    `CASE WHEN $${parameterIndex - 2}= ANY(tags) OR $${parameterIndex - 1} =ANY(tags) THEN 5 ELSE 0 END`
                );
            }

            const tagConditions = [];
            for (let i = 0; i < tags.length; i++) {
                const start = i * 2;
                tagConditions.push(`(${tagPlaceholders[start]} = ANY(tags) OR ${tagPlaceholders[start + 1]} = ANY(tags))`);
            }

            filterConditions.push(`(${tagConditions.join(' AND ')})`);
        }

        // ** title Scoring **
        if (titleKeywords?.length > 0) {
            const titleSearchConditions = [];
            
            for (let i = 0; i < titleKeywords.length; i++) {
                const currentKeyword = titleKeywords[i];
                queryValues.push(`%${currentKeyword.toLowerCase()}%`);
                
                const relevanceLogic = `CASE WHEN LOWER(title) LIKE $${parameterIndex++} THEN 3 ELSE 0 END`;
                relevanceFactors.push(relevanceLogic);
                titleSearchConditions.push(`LOWER(title) LIKE $${parameterIndex - 1}`);
            }

            filterConditions.push(`(${titleSearchConditions.join(' OR ')})`);
        }

        // ** description Scoring **
        if (descriptionKeywords?.length > 0) {
            const descSearchConditions = [];
            
            for (let i = 0; i < descriptionKeywords.length; i++) {
                const currentKeyword = descriptionKeywords[i];
                queryValues.push(`%${currentKeyword.toLowerCase()}%`);
                
                const descRelevance = `CASE WHEN LOWER(description) LIKE $${parameterIndex++} THEN 1 ELSE 0 END`;
                relevanceFactors.push(descRelevance);
                descSearchConditions.push(`LOWER(description) LIKE $${parameterIndex - 1}`);
            }

            filterConditions.push(`(${descSearchConditions.join(' OR ')})`);
        }

        // ** relevance Score calculation **
        const relevanceCalculation = relevanceFactors.length > 0
            ? relevanceFactors.join(' + ')
            : '0';

        // ** final WHERE clause **
        const whereClause = filterConditions.length > 0
            ? `WHERE ${filterConditions.join(' AND ')}`
            : '';

        // ** final sql query **
        const finalQuery = `
            WITH scored_projects AS (
                SELECT *,
                    ${relevanceCalculation} as relevance_score
                FROM projects
                ${whereClause}
            )
            SELECT *
            FROM scored_projects
            WHERE relevance_score > 0
            ORDER BY 
                relevance_score DESC,
                stars DESC,
                created_at DESC
            LIMIT 50;
        `;
        console.log('SQL Query to Execute:', finalQuery);
        console.log('Query Values:', queryValues);
        const queryResult = await pool.query(finalQuery, queryValues);
        console.log(`Number of Projects Found: ${queryResult.rows.length}`);
        res.status(200).json(queryResult.rows);
    } catch (error) {
        next(new CustomError(
            error instanceof Error ? error.message : 'Error occurred while searching projects',
            500
        ));
    }
};

/**
 @description update projects engagement(for stars, forks and watchers) using Github api,this function is used by the admin(s) to update the engagement data
 *could be once a day for example
 */

export const updateProjectsEngagement = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { rows: projects } = await pool.query('SELECT * FROM projects');

        for (const project of projects) {
            const { title, link } = project;
            // extracting repo name and repo owner
            const repoOwner = link.split('github.com/')[1]?.split('/')[0];
            const repoName = link.split('github.com/')[1]?.split('/')[1]?.replace('.git', '');

            if (repoOwner && repoName) {
                try {
                    // Fetch the repo details from GitHub API
                    const response = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}`, {
                        headers: {
                            'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        }
                    });

                    const { stargazers_count, forks_count, watchers_count } = response.data;
                    await pool.query(`
                        UPDATE projects
                        SET stars = $1, forks = $2, watchers = $3
                        WHERE title = $4
                    `, [stargazers_count, forks_count, watchers_count, title]);

                    console.log(`Updated engagement data for project: ${title}`);
                } catch (githubError) {
                    console.error(`Failed to update engagement data for ${title}:`, (githubError as Error).message);
                }
            } else {
                console.error(`Invalid GitHub URL for project: ${title}`);
            }
        }

        res.status(200).json({ message: 'Projects engagement updated successfully' });
    } catch (error) {
        console.error('Error updating projects engagement:', error);
        next(new CustomError(
            error instanceof Error ? error.message : 'Failed to update project engagement',
            500
        ));
    }
};

