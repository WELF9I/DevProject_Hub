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
exports.updateProjectsEngagement = exports.searchProjects = exports.createProject = exports.getTopProjects = exports.getAllProjects = void 0;
const database_1 = __importDefault(require("../config/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const axios_1 = __importDefault(require("axios"));
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const getAllProjects = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.default.query(`
            SELECT * FROM projects 
            ORDER BY created_at DESC
        `);
        const rows = result.rows;
        if (!res.headersSent) {
            res.status(200).json(rows);
        }
    }
    catch (error) {
        if (!res.headersSent) {
            next(new errorHandler_1.AppError(error.message === 'Database query timeout'
                ? 'Database query timeout'
                : 'Failed to retrieve projects', 500));
        }
    }
});
exports.getAllProjects = getAllProjects;
const getTopProjects = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield database_1.default.query(`
            SELECT * FROM projects 
            ORDER BY (forks + stars + watchers) DESC 
            LIMIT 3
        `);
        const topProjects = result.rows;
        if (!res.headersSent) {
            res.status(200).json(topProjects);
        }
    }
    catch (error) {
        console.error('Error retrieving top projects:', error);
        next(new errorHandler_1.AppError(error instanceof Error ? error.message : 'Failed to retrieve top projects', 500));
    }
});
exports.getTopProjects = getTopProjects;
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const projects = Array.isArray(req.body) ? req.body : [req.body];
    try {
        const createdProjects = [];
        for (const project of projects) {
            const { title, description, stars, forks, watchers, tags, link } = project;
            const { rows } = yield database_1.default.query(`
                INSERT INTO projects 
                (title, description, stars, forks, watchers, tags, link)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [title, description, stars, forks, watchers, tags, link]);
            createdProjects.push(rows[0]);
        }
        res.status(201).json(createdProjects);
    }
    catch (error) {
        throw new errorHandler_1.AppError('Failed to create projects', 400);
    }
});
exports.createProject = createProject;
const searchProjects = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { title: titleKeywords, description: descriptionKeywords, tags } = req.body;
    try {
        const values = [];
        let paramCounter = 1;
        const conditions = [];
        let scoreComponents = [];
        // Tag scoring and filtering (highest priority - 5 points per tag)
        if ((tags === null || tags === void 0 ? void 0 : tags.length) > 0) {
            const tagParams = [];
            tags.forEach(tag => {
                values.push(tag.toUpperCase());
                values.push(tag.toLowerCase());
                tagParams.push(`$${paramCounter++}`);
                tagParams.push(`$${paramCounter++}`);
                scoreComponents.push(`CASE WHEN $${paramCounter - 2} = ANY(tags) OR $${paramCounter - 1} = ANY(tags) THEN 5 ELSE 0 END`);
            });
            // Ensure ALL provided tags are present
            const tagConditions = tags.map((_, idx) => {
                const pos = idx * 2;
                return `(${tagParams[pos]} = ANY(tags) OR ${tagParams[pos + 1]} = ANY(tags))`;
            });
            conditions.push(`(${tagConditions.join(' AND ')})`);
        }
        // Title scoring (medium priority - 3 points per match)
        if ((titleKeywords === null || titleKeywords === void 0 ? void 0 : titleKeywords.length) > 0) {
            const titleScores = titleKeywords.map(keyword => {
                values.push(`%${keyword.toLowerCase()}%`);
                const score = `CASE WHEN LOWER(title) LIKE $${paramCounter++} THEN 3 ELSE 0 END`;
                scoreComponents.push(score);
                return `LOWER(title) LIKE $${paramCounter - 1}`;
            });
            conditions.push(`(${titleScores.join(' OR ')})`);
        }
        // Description scoring (lowest priority - 1 point per match)
        if ((descriptionKeywords === null || descriptionKeywords === void 0 ? void 0 : descriptionKeywords.length) > 0) {
            const descScores = descriptionKeywords.map(keyword => {
                values.push(`%${keyword.toLowerCase()}%`);
                const score = `CASE WHEN LOWER(description) LIKE $${paramCounter++} THEN 1 ELSE 0 END`;
                scoreComponents.push(score);
                return `LOWER(description) LIKE $${paramCounter - 1}`;
            });
            conditions.push(`(${descScores.join(' OR ')})`);
        }
        // Combine all scoring components
        const relevancyScore = scoreComponents.length > 0
            ? scoreComponents.join(' + ')
            : '0';
        // Build the final query with WHERE clause
        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(' AND ')}`
            : '';
        const query = `
            WITH scored_projects AS (
                SELECT *,
                    ${relevancyScore} as relevancy_score
                FROM projects
                ${whereClause}
            )
            SELECT *
            FROM scored_projects
            WHERE relevancy_score > 0
            ORDER BY 
                relevancy_score DESC,
                stars DESC,
                created_at DESC
            LIMIT 50;
        `;
        console.log('Executing query:', query);
        console.log('With values:', values);
        const result = yield database_1.default.query(query, values);
        console.log(`Found ${result.rows.length} matching projects`);
        res.status(200).json(result.rows);
    }
    catch (error) {
        console.error('Search projects error:', error);
        next(new errorHandler_1.AppError(error instanceof Error ? error.message : 'Failed to search projects', 500));
    }
});
exports.searchProjects = searchProjects;
const updateProjectsEngagement = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { rows: projects } = yield database_1.default.query('SELECT * FROM projects');
        for (const project of projects) {
            const { title, link } = project;
            const repoOwner = (_a = link.split('github.com/')[1]) === null || _a === void 0 ? void 0 : _a.split('/')[0];
            const repoName = (_c = (_b = link.split('github.com/')[1]) === null || _b === void 0 ? void 0 : _b.split('/')[1]) === null || _c === void 0 ? void 0 : _c.replace('.git', '');
            if (repoOwner && repoName) {
                try {
                    // Fetch the repo details from GitHub API
                    const response = yield axios_1.default.get(`https://api.github.com/repos/${repoOwner}/${repoName}`, {
                        headers: {
                            'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        }
                    });
                    const { stargazers_count, forks_count, watchers_count } = response.data;
                    yield database_1.default.query(`
                        UPDATE projects
                        SET stars = $1, forks = $2, watchers = $3
                        WHERE title = $4
                    `, [stargazers_count, forks_count, watchers_count, title]);
                    console.log(`Updated engagement data for project: ${title}`);
                }
                catch (githubError) {
                    console.error(`Failed to update engagement data for ${title}:`, githubError.message);
                }
            }
            else {
                console.error(`Invalid GitHub URL for project: ${title}`);
            }
        }
        res.status(200).json({ message: 'Projects engagement updated successfully' });
    }
    catch (error) {
        console.error('Error updating projects engagement:', error);
        next(new errorHandler_1.AppError(error instanceof Error ? error.message : 'Failed to update project engagement', 500));
    }
});
exports.updateProjectsEngagement = updateProjectsEngagement;
