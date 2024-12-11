import { Request, Response, NextFunction } from 'express';
import pool from '../config/database';
import { CustomError } from '../middleware/errorHandler';
import axios from 'axios';
import { performance } from 'perf_hooks';

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
 @description WEIGHTS: importance factors for different match types in the search algorithm
 */
const WEIGHTS = {
    // Highest priority: Exact or close title matches
    // example: If searching for "expense tracker", a project titled "Expense Tracker App" gets a high score
    TITLE_MATCH: 10,

    // High priority: Matching project tags
    // example: If searching for a "react" project, projects tagged with "react" are favored
    TAG_MATCH: 8,

    // Medium priority: Matches in the project description
    // example: If "budget" is in the search query, projects with "budget" in the description get a boost
    DESCRIPTION_MATCH: 5,

    // Minimum score: Ensures all projects have at least some relevance
    // helps in cases where no strong matches are found but we still want to return something
    FALLBACK_SCORE: 1
};

/**
 * @description Handles searching for projects based on title, description, and tags.
 * The system assigns different scores to the search criteria for better results.
 */
export const searchProjects = async (req: Request, res: Response, next: NextFunction) => {
    const startTime = performance.now();
    const { title: titleKeywords, description: descriptionKeywords, tags }: SearchCriteria = req.body;
    try {
        const queryValues: any[] = [];
        let parameterIndex = 1;
        const filterConditions: string[] = [];
        let relevanceFactors: string[] = [];
        // title matching
        if (titleKeywords?.length > 0) {
            titleKeywords.forEach(keyword => {
                queryValues.push(`%${keyword.toLowerCase()}%`);
                filterConditions.push(`LOWER(title) LIKE $${parameterIndex}`);
                relevanceFactors.push(`CASE WHEN LOWER(title) LIKE $${parameterIndex} THEN ${WEIGHTS.TITLE_MATCH} ELSE 0 END`);
                parameterIndex++;
            });
        }

        // tag matching
        if (tags?.length > 0) {
            tags.forEach(tag => {
                queryValues.push(tag.toLowerCase());
                filterConditions.push(`$${parameterIndex} = ANY(LOWER(tags::text)::text[])`);
                relevanceFactors.push(`CASE WHEN $${parameterIndex} = ANY(LOWER(tags::text)::text[]) THEN ${WEIGHTS.TAG_MATCH} ELSE 0 END`);
                parameterIndex++;
            });
        }

        // description matching
        if (descriptionKeywords?.length > 0) {
            descriptionKeywords.forEach(keyword => {
                queryValues.push(`%${keyword.toLowerCase()}%`);
                filterConditions.push(`LOWER(description) LIKE $${parameterIndex}`);
                relevanceFactors.push(`CASE WHEN LOWER(description) LIKE $${parameterIndex} THEN ${WEIGHTS.DESCRIPTION_MATCH} ELSE 0 END`);
                parameterIndex++;
            });
        }

        const whereClause = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' OR ')}` : '';
        const relevanceCalculation = relevanceFactors.length > 0
            ? `GREATEST(${relevanceFactors.join(' + ')}, ${WEIGHTS.FALLBACK_SCORE})`
            : `${WEIGHTS.FALLBACK_SCORE}`;

        const finalQuery = `
            WITH scored_projects AS (
                SELECT *,
                    ${relevanceCalculation} as relevance_score,
                    (stars + forks + watchers) as engagement_score
                FROM projects
                ${whereClause}
            )
            SELECT *
            FROM scored_projects
            ORDER BY 
                relevance_score DESC,
                engagement_score DESC,
                created_at DESC
            LIMIT 1;
        `;

        console.log('SQL Query to Execute:', finalQuery);
        console.log('Query Values:', queryValues);
        const queryResult = await pool.query(finalQuery, queryValues);
        console.log(`Number of rows returned: ${queryResult.rows.length}`);
        if (queryResult.rows.length === 0) {
            console.log('No results found with initial query. Trying fallback query.');
            const fallbackQuery = `
                SELECT * FROM projects
                ORDER BY (stars + forks + watchers) DESC
                LIMIT 1;
            `;

            const fallbackResult = await pool.query(fallbackQuery);
            console.log(`Number of rows returned by fallback query: ${fallbackResult.rows.length}`);
            
            if (fallbackResult.rows.length > 0) {
                res.status(200).json(fallbackResult.rows[0]);
            } else {
                res.status(404).json({ message: 'No projects found in the database.' });
            }
        } else {
            res.status(200).json(queryResult.rows[0]);
        }
        const endTime = performance.now();
        console.log(`Search operation took ${endTime - startTime} milliseconds.`);
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
                    // fetch the repo details from GitHub API
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

