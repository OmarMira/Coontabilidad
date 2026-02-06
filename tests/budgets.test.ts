/**
 * Unit Tests for Budget Management Module
 * 
 * Tests core CRUD functions, validation, and business logic
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initDB,
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  approveBudget,
  getBudgetLines,
  getBudgetPeriods,
  getBudgetSummary,
  getBudgetVarianceAnalysis,
  updatePeriodActuals,
  generateBudgetAlerts,
  getBudgetExecutionStatus,
  type Budget,
  type BudgetLine
} from '../src/database/simple-db';

describe('Budget Management - Unit Tests', () => {

  beforeEach(async () => {
    // Initialize database before each test
    await initDB();
  });

  describe('createBudget', () => {

    it('should create a budget with valid data', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Test Budget 2024',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000, // $1,000.00 in cents
        department: 'IT',
        notes: 'Test budget',
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        {
          account_number: 5100,
          annual_amount: 60000, // $600.00
          distribution_type: 'EQUAL',
          notes: 'Salaries'
        },
        {
          account_number: 5200,
          annual_amount: 40000, // $400.00
          distribution_type: 'EQUAL',
          notes: 'Office supplies'
        }
      ];

      const result = createBudget(budgetData, budgetLines);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.message).toContain('exitosamente');
    });

    it('should reject budget with invalid balance (CP-1 violation)', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Invalid Budget',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000, // $1,000.00
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        {
          account_number: 5100,
          annual_amount: 50000, // Only $500.00 - doesn't match total
          distribution_type: 'EQUAL'
        }
      ];

      const result = createBudget(budgetData, budgetLines);

      expect(result.success).toBe(false);
      expect(result.message).toContain('no coincide');
    });

    it('should create budget with multiple lines and generate periods', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Multi-line Budget',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 120000,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 60000, distribution_type: 'EQUAL' },
        { account_number: 5200, annual_amount: 30000, distribution_type: 'EQUAL' },
        { account_number: 5300, annual_amount: 30000, distribution_type: 'EQUAL' }
      ];

      const result = createBudget(budgetData, budgetLines);

      expect(result.success).toBe(true);

      // Verify lines were created
      const lines = getBudgetLines(result.id!);
      expect(lines.length).toBe(3);

      // Verify periods were generated for each line
      lines.forEach(line => {
        const periods = getBudgetPeriods(line.id);
        expect(periods.length).toBe(12); // 12 months
      });
    });

    it('should reject budget with missing required fields', () => {
      const budgetData: any = {
        budget_name: 'Incomplete Budget',
        // Missing fiscal_year, dates, etc.
        status: 'DRAFT',
        total_budget_amount: 100000
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      // This should fail gracefully with success: false
      const result = createBudget(budgetData, budgetLines);
      expect(result.success).toBe(false);
    });
  });

  describe('updateBudget', () => {

    it('should update budget header fields', () => {
      // Create a budget first
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Original Budget',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const createResult = createBudget(budgetData, budgetLines);
      expect(createResult.success).toBe(true);

      // Update the budget
      const updateResult = updateBudget(createResult.id!, {
        budget_name: 'Updated Budget Name',
        notes: 'Updated notes',
        updated_by: 1
      });

      expect(updateResult.success).toBe(true);

      // Verify update
      const updated = getBudgetById(createResult.id!);
      expect(updated?.budget_name).toBe('Updated Budget Name');
      expect(updated?.notes).toBe('Updated notes');
    });

    it('should prevent editing non-DRAFT budgets (CP-3)', () => {
      // Create and approve a budget
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Approved Budget',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const createResult = createBudget(budgetData, budgetLines);
      approveBudget(createResult.id!, 1);

      // Try to update lines (should fail)
      const newLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5200, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const updateResult = updateBudget(createResult.id!, {}, newLines);

      expect(updateResult.success).toBe(false);
      expect(updateResult.message).toContain('borrador');
    });
  });

  describe('deleteBudget', () => {

    it('should delete DRAFT budgets', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Budget to Delete',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const createResult = createBudget(budgetData, budgetLines);
      const deleteResult = deleteBudget(createResult.id!);

      expect(deleteResult.success).toBe(true);

      // Verify deletion
      const deleted = getBudgetById(createResult.id!);
      expect(deleted).toBeNull();
    });

    it('should prevent deleting non-DRAFT budgets (CP-3)', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Approved Budget',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const createResult = createBudget(budgetData, budgetLines);
      approveBudget(createResult.id!, 1);

      const deleteResult = deleteBudget(createResult.id!);

      expect(deleteResult.success).toBe(false);
      expect(deleteResult.message).toContain('borrador');
    });
  });

  describe('approveBudget', () => {

    it('should approve DRAFT budgets (CP-3)', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Budget to Approve',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const createResult = createBudget(budgetData, budgetLines);
      const approveResult = approveBudget(createResult.id!, 1);

      expect(approveResult.success).toBe(true);

      // Verify status change
      const approved = getBudgetById(createResult.id!);
      expect(approved?.status).toBe('APPROVED');
      expect(approved?.approved_by).toBe(1);
    });

    it('should prevent approving non-DRAFT budgets (CP-3)', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Already Approved',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const createResult = createBudget(budgetData, budgetLines);
      approveBudget(createResult.id!, 1);

      // Try to approve again
      const secondApproval = approveBudget(createResult.id!, 1);

      expect(secondApproval.success).toBe(false);
      expect(secondApproval.message).toContain('borrador');
    });
  });

  describe('getBudgets with filters', () => {

    it('should filter budgets by fiscal year', () => {
      // Create budgets for different years
      const budget2024: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Budget 2024',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const budget2025: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Budget 2025',
        fiscal_year: 2025,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const lines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      createBudget(budget2024, lines);
      createBudget(budget2025, lines);

      const budgets2024 = getBudgets({ fiscal_year: 2024 });
      const budgets2025 = getBudgets({ fiscal_year: 2025 });

      expect(budgets2024.length).toBeGreaterThan(0);
      expect(budgets2025.length).toBeGreaterThan(0);
      expect(budgets2024.every(b => b.fiscal_year === 2024)).toBe(true);
      expect(budgets2025.every(b => b.fiscal_year === 2025)).toBe(true);
    });

    it('should filter budgets by status', () => {
      const draftBudget: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Draft Budget',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const lines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const createResult = createBudget(draftBudget, lines);
      approveBudget(createResult.id!, 1);

      const draftBudgets = getBudgets({ status: 'DRAFT' });
      const approvedBudgets = getBudgets({ status: 'APPROVED' });

      expect(approvedBudgets.some(b => b.id === createResult.id)).toBe(true);
      expect(draftBudgets.every(b => b.status === 'DRAFT')).toBe(true);
    });
  });

  describe('Period generation', () => {

    it('should generate 12 monthly periods for annual budget', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Annual Budget',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 120000, // $1,200.00
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 120000, distribution_type: 'EQUAL' }
      ];

      const result = createBudget(budgetData, budgetLines);
      const lines = getBudgetLines(result.id!);
      const periods = getBudgetPeriods(lines[0].id);

      expect(periods.length).toBe(12);

      // Verify equal distribution
      const expectedMonthly = 120000 / 12; // $10.00 per month
      periods.forEach(period => {
        expect(period.budgeted_amount).toBe(expectedMonthly);
      });
    });

    it('should generate periods with correct sequence', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Sequential Budget',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const result = createBudget(budgetData, budgetLines);
      const lines = getBudgetLines(result.id!);
      const periods = getBudgetPeriods(lines[0].id);

      // Verify sequential period numbers
      periods.forEach((period, index) => {
        expect(period.period_number).toBe(index + 1);
      });
    });
  });

  describe('Variance calculations', () => {

    it('should calculate variance correctly', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Variance Test Budget',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const result = createBudget(budgetData, budgetLines);

      // Get variance analysis (will be 0 without actual transactions)
      const variance = getBudgetVarianceAnalysis(result.id!);

      expect(variance).toBeDefined();
      expect(variance.length).toBe(1);
      expect(variance[0].account_number).toBe(5100);
    });

    it('should update period actuals', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Period Update Test',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const result = createBudget(budgetData, budgetLines);
      const updateResult = updatePeriodActuals(result.id!);

      expect(updateResult.success).toBe(true);
      expect(updateResult.periodsUpdated).toBeGreaterThan(0);
    });
  });

  describe('Budget summary and alerts', () => {

    it('should generate budget summary', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Summary Test Budget',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 150000,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' },
        { account_number: 5200, annual_amount: 50000, distribution_type: 'EQUAL' }
      ];

      const result = createBudget(budgetData, budgetLines);
      const summary = getBudgetSummary(result.id!);

      expect(summary).toBeDefined();
      expect(summary?.total_budgeted).toBe(150000);
      expect(summary?.lines_count).toBe(2);
    });

    it('should generate alerts for threshold violations', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Alert Test Budget',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        alert_threshold_percentage: 10,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const result = createBudget(budgetData, budgetLines);
      const alerts = generateBudgetAlerts(result.id!);

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should calculate execution status', () => {
      const budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'> = {
        budget_name: 'Execution Test Budget',
        fiscal_year: 2024,
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        status: 'DRAFT',
        total_budget_amount: 100000,
        created_by: 1
      };

      const budgetLines: Omit<BudgetLine, 'id' | 'budget_id' | 'created_at'>[] = [
        { account_number: 5100, annual_amount: 100000, distribution_type: 'EQUAL' }
      ];

      const result = createBudget(budgetData, budgetLines);
      const status = getBudgetExecutionStatus(result.id!);

      expect(status).toBeDefined();
      expect(status?.budget_id).toBe(result.id);
      expect(['on_track', 'at_risk', 'over_budget']).toContain(status?.status);
    });
  });
});
