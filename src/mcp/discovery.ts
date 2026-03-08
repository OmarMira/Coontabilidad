import { glob } from 'fast-glob';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Discovery utilities for Account Express MCP Server
 * 
 * Scans filesystem to discover modules, components, services, and types
 */

interface DiscoveredItem {
    name: string;
    path: string;
    relativePath: string;
    type: string;
    exports?: string[];
    description?: string;
}

// Cache for performance (30 second TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

function getCached(key: string): any | null {
    const cached = cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }

    return cached.data;
}

function setCache(key: string, data: any): void {
    cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Extract exports from TypeScript file (simple regex-based extraction)
 */
async function extractExports(filePath: string): Promise<string[]> {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const exports: string[] = [];

        // Match: export class ClassName
        const classMatches = content.matchAll(/export\s+class\s+(\w+)/g);
        for (const match of classMatches) {
            exports.push(`class ${match[1]}`);
        }

        // Match: export interface InterfaceName
        const interfaceMatches = content.matchAll(/export\s+interface\s+(\w+)/g);
        for (const match of interfaceMatches) {
            exports.push(`interface ${match[1]}`);
        }

        // Match: export function functionName
        const functionMatches = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g);
        for (const match of functionMatches) {
            exports.push(`function ${match[1]}`);
        }

        // Match: export const ConstName
        const constMatches = content.matchAll(/export\s+const\s+(\w+)/g);
        for (const match of constMatches) {
            exports.push(`const ${match[1]}`);
        }

        // Match: export type TypeName
        const typeMatches = content.matchAll(/export\s+type\s+(\w+)/g);
        for (const match of typeMatches) {
            exports.push(`type ${match[1]}`);
        }

        return exports;
    } catch (error) {
        return [];
    }
}

/**
 * Extract JSDoc description from file
 */
async function extractDescription(filePath: string): Promise<string | undefined> {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const match = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n/);
        return match ? match[1].trim() : undefined;
    } catch (error) {
        return undefined;
    }
}

/**
 * Discover all modules in src/modules/
 */
export async function discoverModules(): Promise<DiscoveredItem[]> {
    const cacheKey = 'modules';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const files = await glob('src/modules/**/*.{ts,tsx}', {
            cwd: process.cwd(),
            ignore: ['**/*.test.ts', '**/*.test.tsx', '**/*.d.ts'],
        });

        const modules: DiscoveredItem[] = [];

        for (const file of files) {
            const fullPath = path.resolve(process.cwd(), file);
            const exports = await extractExports(fullPath);
            const description = await extractDescription(fullPath);

            modules.push({
                name: path.basename(file, path.extname(file)),
                path: fullPath,
                relativePath: file,
                type: 'module',
                exports,
                description,
            });
        }

        setCache(cacheKey, modules);
        return modules;
    } catch (error) {
        console.error('Error discovering modules:', error);
        return [];
    }
}

/**
 * Discover all React components in src/components/
 */
export async function discoverComponents(): Promise<DiscoveredItem[]> {
    const cacheKey = 'components';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const files = await glob('src/components/**/*.tsx', {
            cwd: process.cwd(),
            ignore: ['**/*.test.tsx'],
        });

        const components: DiscoveredItem[] = [];

        for (const file of files) {
            const fullPath = path.resolve(process.cwd(), file);
            const exports = await extractExports(fullPath);
            const description = await extractDescription(fullPath);

            components.push({
                name: path.basename(file, '.tsx'),
                path: fullPath,
                relativePath: file,
                type: 'component',
                exports,
                description,
            });
        }

        setCache(cacheKey, components);
        return components;
    } catch (error) {
        console.error('Error discovering components:', error);
        return [];
    }
}

/**
 * Discover all services in src/services/
 */
export async function discoverServices(): Promise<DiscoveredItem[]> {
    const cacheKey = 'services';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const files = await glob('src/services/**/*.ts', {
            cwd: process.cwd(),
            ignore: ['**/*.test.ts', '**/*.d.ts'],
        });

        const services: DiscoveredItem[] = [];

        for (const file of files) {
            const fullPath = path.resolve(process.cwd(), file);
            const exports = await extractExports(fullPath);
            const description = await extractDescription(fullPath);

            services.push({
                name: path.basename(file, '.ts'),
                path: fullPath,
                relativePath: file,
                type: 'service',
                exports,
                description,
            });
        }

        setCache(cacheKey, services);
        return services;
    } catch (error) {
        console.error('Error discovering services:', error);
        return [];
    }
}

/**
 * Discover all types in src/types/
 */
export async function discoverTypes(): Promise<DiscoveredItem[]> {
    const cacheKey = 'types';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const files = await glob('src/types/**/*.ts', {
            cwd: process.cwd(),
            ignore: ['**/*.test.ts'],
        });

        const types: DiscoveredItem[] = [];

        for (const file of files) {
            const fullPath = path.resolve(process.cwd(), file);
            const exports = await extractExports(fullPath);
            const description = await extractDescription(fullPath);

            types.push({
                name: path.basename(file, '.ts'),
                path: fullPath,
                relativePath: file,
                type: 'type',
                exports,
                description,
            });
        }

        setCache(cacheKey, types);
        return types;
    } catch (error) {
        console.error('Error discovering types:', error);
        return [];
    }
}

/**
 * Get database schema information
 */
export async function getDatabaseSchema(): Promise<any> {
    const cacheKey = 'database_schema';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        // Look for schema files
        const schemaFiles = await glob('src/database/**/*schema*.{ts,sql}', {
            cwd: process.cwd(),
        });

        const schema: any = {
            tables: [],
            schemaFiles: schemaFiles.map(f => ({
                path: f,
                name: path.basename(f)
            })),
        };

        // Try to extract table names from TypeScript schema files
        for (const file of schemaFiles) {
            if (file.endsWith('.ts')) {
                const content = await fs.readFile(file, 'utf-8');

                // Match CREATE TABLE statements
                const tableMatches = content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi);
                for (const match of tableMatches) {
                    if (!schema.tables.includes(match[1])) {
                        schema.tables.push(match[1]);
                    }
                }
            }
        }

        // Add known tables from Account Express
        const knownTables = [
            'journal_entries',
            'journal_details',
            'chart_of_accounts',
            'invoices',
            'invoice_lines',
            'customers',
            'suppliers',
            'products',
            'audit_chain',
            'company_data',
        ];

        for (const table of knownTables) {
            if (!schema.tables.includes(table)) {
                schema.tables.push(table);
            }
        }

        setCache(cacheKey, schema);
        return schema;
    } catch (error) {
        console.error('Error getting database schema:', error);
        return { tables: [], schemaFiles: [] };
    }
}
