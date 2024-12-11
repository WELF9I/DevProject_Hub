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
/**
 @description get all projects from the database
 */
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
            next(new errorHandler_1.CustomError(error.message === 'Database query timeout'
                ? 'Database query timeout'
                : 'Failed to get projects', 500));
        }
    }
});
exports.getAllProjects = getAllProjects;
/**
 @description get top 3 projects by engagement (sum of stars,forks,watchers)
 */
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
        next(new errorHandler_1.CustomError(error instanceof Error ? error.message : 'Failed to get top projects', 500));
    }
});
exports.getTopProjects = getTopProjects;
/**
@description create a new project(s),and support insert multiple projects at the same time
 */
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
        throw new errorHandler_1.CustomError('Failed to create projects', 400);
    }
});
exports.createProject = createProject;
/**
 * @description Handles searching for projects based on title, description, and tags.
 * The system assigns different scores to the search criteria for better results.
 */
const searchProjects = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { title: titleKeywords, description: descriptionKeywords, tags } = req.body;
    try {
        const queryValues = []; // values passed into the sql query
        let parameterIndex = 1; // used to track the position of parameters in the sql query
        const filterConditions = []; // stores the WHERE conditions
        let relevanceFactors = []; // tracks how relevance is calculated
        // ** Tag Filtering and Scoring **
        if ((tags === null || tags === void 0 ? void 0 : tags.length) > 0) {
            const tagPlaceholders = [];
            for (let i = 0; i < tags.length; i++) {
                const currentTag = tags[i];
                queryValues.push(currentTag.toUpperCase());
                queryValues.push(currentTag.toLowerCase());
                tagPlaceholders.push(`$${parameterIndex++}`);
                tagPlaceholders.push(`$${parameterIndex++}`);
                relevanceFactors.push(`CASE WHEN $${parameterIndex - 2}= ANY(tags) OR $${parameterIndex - 1} =ANY(tags) THEN 5 ELSE 0 END`);
            }
            const tagConditions = [];
            for (let i = 0; i < tags.length; i++) {
                const start = i * 2;
                tagConditions.push(`(${tagPlaceholders[start]} = ANY(tags) OR ${tagPlaceholders[start + 1]} = ANY(tags))`);
            }
            filterConditions.push(`(${tagConditions.join(' AND ')})`);
        }
        // ** title Scoring **
        if ((titleKeywords === null || titleKeywords === void 0 ? void 0 : titleKeywords.length) > 0) {
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
        if ((descriptionKeywords === null || descriptionKeywords === void 0 ? void 0 : descriptionKeywords.length) > 0) {
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
        const queryResult = yield database_1.default.query(finalQuery, queryValues);
        console.log(`Number of Projects Found: ${queryResult.rows.length}`);
        res.status(200).json(queryResult.rows);
    }
    catch (error) {
        next(new errorHandler_1.CustomError(error instanceof Error ? error.message : 'Error occurred while searching projects', 500));
    }
});
exports.searchProjects = searchProjects;
/**
 @description update projects engagement(for stars, forks and watchers) using Github api,this function is used by the admin(s) to update the engagement data
 *could be once a day for example
 */
const updateProjectsEngagement = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { rows: projects } = yield database_1.default.query('SELECT * FROM projects');
        for (const project of projects) {
            const { title, link } = project;
            // extracting repo name and repo owner
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
        next(new errorHandler_1.CustomError(error instanceof Error ? error.message : 'Failed to update project engagement', 500));
    }
});
exports.updateProjectsEngagement = updateProjectsEngagement;
