import { SQLiteEngine } from '../../core/database/SQLiteEngine';
import { saveDatabase, forceSaveDB } from '@/database/simple-db';



/**
 * Asset Category Model
 */
export interface AssetCategory {
    id: number;
    name: string;
    code: string;
    default_useful_life_months: number;
    default_depreciation_method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE_200';
    default_salvage_value_percent: number;
    gl_asset_account: number;
    gl_accumulated_dep_account: number;
    gl_expense_account: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AssetCategoryCreateData {
    name: string;
    code: string;
    default_useful_life_months: number;
    default_depreciation_method: 'STRAIGHT_LINE' | 'DECLINING_BALANCE_200';
    default_salvage_value_percent?: number;
    gl_asset_account: number;
    gl_accumulated_dep_account: number;
    gl_expense_account: number;
}

/**
 * AssetCategoryService
 * 
 * Manages asset categories with depreciation defaults and GL account mappings.
 * Categories provide templates for creating new assets.
 */
export class AssetCategoryService {
    constructor(private db: SQLiteEngine) { }

    /**
     * Get all asset categories
     */
    async getAllCategories(): Promise<AssetCategory[]> {
        const categories = await this.db.select(
            'SELECT * FROM asset_categories ORDER BY name'
        );
        return categories as AssetCategory[];
    }

    /**
     * Get only active categories
     */
    async getActiveCategories(): Promise<AssetCategory[]> {
        const categories = await this.db.select(
            'SELECT * FROM asset_categories WHERE is_active = 1 ORDER BY name'
        );
        return categories as AssetCategory[];
    }

    /**
     * Get category by ID
     */
    async getCategoryById(id: number): Promise<AssetCategory | null> {
        const categories = await this.db.select(
            'SELECT * FROM asset_categories WHERE id = ?',
            [id]
        );
        return categories.length > 0 ? (categories[0] as AssetCategory) : null;
    }

    /**
     * Get category by code
     */
    async getCategoryByCode(code: string): Promise<AssetCategory | null> {
        const categories = await this.db.select(
            'SELECT * FROM asset_categories WHERE code = ?',
            [code]
        );
        return categories.length > 0 ? (categories[0] as AssetCategory) : null;
    }

    /**
     * Create new asset category
     */
    async createCategory(data: AssetCategoryCreateData): Promise<number> {
        // Validate GL accounts exist
        await this.validateGLAccounts(
            data.gl_asset_account,
            data.gl_accumulated_dep_account,
            data.gl_expense_account
        );

        // Validate unique constraints
        await this.validateUnique(data.code, data.name);

        await this.db.run(
            `INSERT INTO asset_categories 
            (name, code, default_useful_life_months, default_depreciation_method, 
             default_salvage_value_percent, gl_asset_account, gl_accumulated_dep_account, 
             gl_expense_account)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.name,
                data.code,
                data.default_useful_life_months,
                data.default_depreciation_method,
                data.default_salvage_value_percent || 0,
                data.gl_asset_account,
                data.gl_accumulated_dep_account,
                data.gl_expense_account
            ]
        );

        // Get the last inserted ID
        const result = await this.db.select('SELECT last_insert_rowid() as id');
        const categoryId = result[0].id as number;

        // Persistencia forzada
        await saveDatabase();


        return categoryId;
    }


    /**
     * Update existing category
     */
    async updateCategory(
        id: number,
        data: Partial<AssetCategoryCreateData>
    ): Promise<void> {
        const category = await this.getCategoryById(id);
        if (!category) {
            throw new Error(`Category with ID ${id} not found`);
        }

        // Build dynamic UPDATE statement
        const updates: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) {
            updates.push('name = ?');
            values.push(data.name);
        }
        if (data.code !== undefined) {
            updates.push('code = ?');
            values.push(data.code);
        }
        if (data.default_useful_life_months !== undefined) {
            updates.push('default_useful_life_months = ?');
            values.push(data.default_useful_life_months);
        }
        if (data.default_depreciation_method !== undefined) {
            updates.push('default_depreciation_method = ?');
            values.push(data.default_depreciation_method);
        }
        if (data.default_salvage_value_percent !== undefined) {
            updates.push('default_salvage_value_percent = ?');
            values.push(data.default_salvage_value_percent);
        }
        if (data.gl_asset_account !== undefined) {
            updates.push('gl_asset_account = ?');
            values.push(data.gl_asset_account);
        }
        if (data.gl_accumulated_dep_account !== undefined) {
            updates.push('gl_accumulated_dep_account = ?');
            values.push(data.gl_accumulated_dep_account);
        }
        if (data.gl_expense_account !== undefined) {
            updates.push('gl_expense_account = ?');
            values.push(data.gl_expense_account);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        if (updates.length > 1) { // > 1 because we always add updated_at
            await this.db.run(
                `UPDATE asset_categories SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            // Persistencia forzada
            await forceSaveDB();
        }
    }


    /**
     * Deactivate category (soft delete)
     */
    async deactivateCategory(id: number): Promise<void> {
        await this.db.run(
            'UPDATE asset_categories SET is_active = 0 WHERE id = ?',
            [id]
        );

        // Persistencia forzada
        await saveDatabase();

    }


    /**
     * Reactivate category
     */
    async activateCategory(id: number): Promise<void> {
        await this.db.run(
            'UPDATE asset_categories SET is_active = 1 WHERE id = ?',
            [id]
        );

        // Persistencia forzada
        await saveDatabase();

    }


    /**
     * Delete category (only if no assets exist)
     */
    async deleteCategory(id: number): Promise<void> {
        // Check if any assets use this category
        const assets = await this.db.select(
            'SELECT COUNT(*) as count FROM fixed_assets WHERE category_id = ?',
            [id]
        );

        if (assets[0].count > 0) {
            throw new Error(
                `Cannot delete category: ${assets[0].count} asset(s) are using it. Deactivate instead.`
            );
        }

        await this.db.run('DELETE FROM asset_categories WHERE id = ?', [id]);

        // Persistencia forzada
        await saveDatabase();

    }


    /**
     * Validate that GL accounts exist in chart of accounts
     */
    private async validateGLAccounts(
        assetAccount: number,
        accumulatedDepAccount: number,
        expenseAccount: number
    ): Promise<void> {
        const accounts = [assetAccount, accumulatedDepAccount, expenseAccount];

        for (const account of accounts) {
            const exists = await this.db.select(
                'SELECT account_number FROM chart_of_accounts WHERE account_number = ?',
                [account]
            );

            if (exists.length === 0) {
                throw new Error(
                    `GL account ${account} does not exist in chart of accounts`
                );
            }
        }
    }

    /**
     * Validate code and name are unique
     */
    private async validateUnique(code: string, name: string, excludeId?: number): Promise<void> {
        // Check code
        const codeQuery = excludeId
            ? 'SELECT id FROM asset_categories WHERE code = ? AND id != ?'
            : 'SELECT id FROM asset_categories WHERE code = ?';
        const codeParams = excludeId ? [code, excludeId] : [code];

        const existingCode = await this.db.select(codeQuery, codeParams);
        if (existingCode.length > 0) {
            throw new Error(`Category code '${code}' already exists`);
        }

        // Check name
        const nameQuery = excludeId
            ? 'SELECT id FROM asset_categories WHERE name = ? AND id != ?'
            : 'SELECT id FROM asset_categories WHERE name = ?';
        const nameParams = excludeId ? [name, excludeId] : [name];

        const existingName = await this.db.select(nameQuery, nameParams);
        if (existingName.length > 0) {
            throw new Error(`Category name '${name}' already exists`);
        }
    }

    /**
     * Get category statistics (number of assets)
     */
    async getCategoryStats(): Promise<Array<{
        category_id: number;
        category_name: string;
        asset_count: number;
        total_cost: number;
        total_depreciation: number;
    }>> {
        const results = await this.db.select(`
            SELECT 
                c.id as category_id,
                c.name as category_name,
                COUNT(a.id) as asset_count,
                COALESCE(SUM(a.purchase_cost), 0) as total_cost,
                COALESCE(SUM(a.total_accumulated_depreciation), 0) as total_depreciation
            FROM asset_categories c
            LEFT JOIN fixed_assets a ON c.id = a.category_id AND a.status != 'DISPOSED'
            WHERE c.is_active = 1
            GROUP BY c.id, c.name
            ORDER BY c.name
        `);
        return results as Array<{
            category_id: number;
            category_name: string;
            asset_count: number;
            total_cost: number;
            total_depreciation: number;
        }>;
    }
}
