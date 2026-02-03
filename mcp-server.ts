import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
    discoverModules,
    discoverComponents,
    discoverServices,
    discoverTypes,
    getDatabaseSchema
} from './src/mcp/discovery.js';

/**
 * Account Express MCP Server
 * 
 * Exposes dynamic system resources for AI auto-discovery:
 * - accountexpress://modules/list
 * - accountexpress://components/list
 * - accountexpress://services/list
 * - accountexpress://types/list
 * - accountexpress://database/schema
 */

const server = new Server(
    {
        name: 'accountexpress-mcp',
        version: '1.0.0',
    },
    {
        capabilities: {
            resources: {},
            tools: {},
        },
    }
);

// ==========================================
// RESOURCE HANDLERS
// ==========================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
        resources: [
            {
                uri: 'accountexpress://modules/list',
                name: 'Account Express Modules',
                description: 'Lista de todos los módulos del sistema (billing, payroll, tax, etc.)',
                mimeType: 'application/json',
            },
            {
                uri: 'accountexpress://components/list',
                name: 'React Components',
                description: 'Lista de todos los componentes React del sistema',
                mimeType: 'application/json',
            },
            {
                uri: 'accountexpress://services/list',
                name: 'Services',
                description: 'Lista de todos los servicios (AccountingService, TaxEngine, etc.)',
                mimeType: 'application/json',
            },
            {
                uri: 'accountexpress://types/list',
                name: 'TypeScript Types',
                description: 'Lista de interfaces y tipos TypeScript del sistema',
                mimeType: 'application/json',
            },
            {
                uri: 'accountexpress://database/schema',
                name: 'Database Schema',
                description: 'Esquema de la base de datos SQLite (tablas, columnas)',
                mimeType: 'application/json',
            },
        ],
    };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    try {
        let data;

        switch (uri) {
            case 'accountexpress://modules/list':
                data = await discoverModules();
                break;

            case 'accountexpress://components/list':
                data = await discoverComponents();
                break;

            case 'accountexpress://services/list':
                data = await discoverServices();
                break;

            case 'accountexpress://types/list':
                data = await discoverTypes();
                break;

            case 'accountexpress://database/schema':
                data = await getDatabaseSchema();
                break;

            default:
                throw new Error(`Unknown resource: ${uri}`);
        }

        return {
            contents: [
                {
                    uri,
                    mimeType: 'application/json',
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    } catch (error) {
        console.error(`Error reading resource ${uri}:`, error);
        throw error;
    }
});

// ==========================================
// TOOLS (Optional - for future use)
// ==========================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'search_codebase',
                description: 'Search for specific files or patterns in Account Express codebase',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search query (file name or pattern)',
                        },
                        type: {
                            type: 'string',
                            enum: ['module', 'component', 'service', 'type'],
                            description: 'Type of item to search for',
                        },
                    },
                    required: ['query'],
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'search_codebase') {
        const { query, type } = args as { query: string; type?: string };

        // Simple search implementation
        let allItems: any[] = [];

        if (!type || type === 'module') {
            allItems = allItems.concat(await discoverModules());
        }
        if (!type || type === 'component') {
            allItems = allItems.concat(await discoverComponents());
        }
        if (!type || type === 'service') {
            allItems = allItems.concat(await discoverServices());
        }
        if (!type || type === 'type') {
            allItems = allItems.concat(await discoverTypes());
        }

        const results = allItems.filter(
            (item) =>
                item.name?.toLowerCase().includes(query.toLowerCase()) ||
                item.path?.toLowerCase().includes(query.toLowerCase())
        );

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(results, null, 2),
                },
            ],
        };
    }

    throw new Error(`Unknown tool: ${name}`);
});

// ==========================================
// START SERVER
// ==========================================

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Account Express MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
