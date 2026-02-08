/**
 * Sistema de Auditoría Completa de AccountExpress
 * 
 * Este script audita todos los aspectos del sistema para asegurar:
 * 1. Integridad de datos
 * 2. Correcta enlazación de módulos
 * 3. Flujos de procesos completos
 * 4. Validaciones funcionando
 * 5. Seguridad implementada
 */

import { db } from '../database/simple-db';

export interface AuditResult {
  category: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: any;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface SystemAuditReport {
  timestamp: string;
  overallStatus: 'pass' | 'warning' | 'fail';
  totalChecks: number;
  passed: number;
  warnings: number;
  failed: number;
  results: AuditResult[];
}

/**
 * 1. AUDITORÍA DE ASIENTOS CONTABLES
 */
export async function auditJournalEntries(): Promise<AuditResult[]> {
  const results: AuditResult[] = [];
  
  if (!db) {
    results.push({
      category: 'Journal Entries',
      status: 'fail',
      message: 'Database not initialized',
      severity: 'critical'
    });
    return results;
  }

  try {
    // 1.1 Verificar que todos los asientos balanceen
    const unbalancedQuery = `
      SELECT 
        je.id,
        je.entry_date,
        je.description,
        SUM(CASE WHEN jd.debit_amount > 0 THEN jd.debit_amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN jd.credit_amount > 0 THEN jd.credit_amount ELSE 0 END) as total_credits
      FROM journal_entries je
      LEFT JOIN journal_details jd ON je.id = jd.journal_entry_id
      GROUP BY je.id
      HAVING ABS(total_debits - total_credits) > 1.00
    `;
    
    const unbalanced = db.exec(unbalancedQuery);
    
    if (unbalanced.length > 0 && unbalanced[0].values.length > 0) {
      results.push({
        category: 'Journal Entries',
        status: 'fail',
        message: `Found ${unbalanced[0].values.length} unbalanced journal entries (difference > $1.00)`,
        details: unbalanced[0].values,
        severity: 'critical'
      });
    } else {
      results.push({
        category: 'Journal Entries',
        status: 'pass',
        message: 'All journal entries are balanced',
        severity: 'low'
      });
    }

    // 1.2 Verificar que no haya asientos sin líneas
    const entriesWithoutLinesQuery = `
      SELECT je.id, je.entry_date, je.description
      FROM journal_entries je
      LEFT JOIN journal_details jd ON je.id = jd.journal_entry_id
      WHERE jd.id IS NULL
    `;
    
    const entriesWithoutLines = db.exec(entriesWithoutLinesQuery);
    
    if (entriesWithoutLines.length > 0 && entriesWithoutLines[0].values.length > 0) {
      results.push({
        category: 'Journal Entries',
        status: 'fail',
        message: `Found ${entriesWithoutLines[0].values.length} journal entries without lines`,
        details: entriesWithoutLines[0].values,
        severity: 'high'
      });
    } else {
      results.push({
        category: 'Journal Entries',
        status: 'pass',
        message: 'All journal entries have lines',
        severity: 'low'
      });
    }

    // 1.3 Verificar que todas las cuentas en líneas existan
    const invalidAccountsQuery = `
      SELECT jd.id, jd.journal_entry_id, jd.account_code
      FROM journal_details jd
      LEFT JOIN chart_of_accounts coa ON jd.account_code = coa.account_code
      WHERE coa.account_code IS NULL
    `;
    
    const invalidAccounts = db.exec(invalidAccountsQuery);
    
    if (invalidAccounts.length > 0 && invalidAccounts[0].values.length > 0) {
      results.push({
        category: 'Journal Entries',
        status: 'fail',
        message: `Found ${invalidAccounts[0].values.length} journal details with invalid accounts`,
        details: invalidAccounts[0].values,
        severity: 'critical'
      });
    } else {
      results.push({
        category: 'Journal Entries',
        status: 'pass',
        message: 'All journal details reference valid accounts',
        severity: 'low'
      });
    }

  } catch (error: any) {
    results.push({
      category: 'Journal Entries',
      status: 'fail',
      message: `Error auditing journal entries: ${error.message}`,
      severity: 'critical'
    });
  }

  return results;
}

/**
 * 2. AUDITORÍA DE PERÍODOS CONTABLES
 */
export async function auditAccountingPeriods(): Promise<AuditResult[]> {
  const results: AuditResult[] = [];
  
  if (!db) {
    results.push({
      category: 'Accounting Periods',
      status: 'fail',
      message: 'Database not initialized',
      severity: 'critical'
    });
    return results;
  }

  try {
    // 2.1 Verificar que no haya transacciones en períodos cerrados
    const transactionsInClosedPeriodsQuery = `
      SELECT 
        je.id,
        je.entry_date,
        je.description,
        ap.name as period_name,
        ap.status
      FROM journal_entries je
      JOIN accounting_periods ap ON je.entry_date BETWEEN ap.start_date AND ap.end_date
      WHERE ap.status = 'closed'
      AND je.created_at > ap.created_at
    `;
    
    const transactionsInClosedPeriods = db.exec(transactionsInClosedPeriodsQuery);
    
    if (transactionsInClosedPeriods.length > 0 && transactionsInClosedPeriods[0].values.length > 0) {
      results.push({
        category: 'Accounting Periods',
        status: 'fail',
        message: `Found ${transactionsInClosedPeriods[0].values.length} transactions in closed periods`,
        details: transactionsInClosedPeriods[0].values,
        severity: 'critical'
      });
    } else {
      results.push({
        category: 'Accounting Periods',
        status: 'pass',
        message: 'No transactions found in closed periods',
        severity: 'low'
      });
    }

    // 2.2 Verificar que no haya períodos superpuestos
    const overlappingPeriodsQuery = `
      SELECT 
        ap1.id as period1_id,
        ap1.name as period1_name,
        ap1.start_date as period1_start,
        ap1.end_date as period1_end,
        ap2.id as period2_id,
        ap2.name as period2_name,
        ap2.start_date as period2_start,
        ap2.end_date as period2_end
      FROM accounting_periods ap1
      JOIN accounting_periods ap2 ON ap1.id < ap2.id
      WHERE (ap1.start_date BETWEEN ap2.start_date AND ap2.end_date)
         OR (ap1.end_date BETWEEN ap2.start_date AND ap2.end_date)
         OR (ap2.start_date BETWEEN ap1.start_date AND ap1.end_date)
         OR (ap2.end_date BETWEEN ap1.start_date AND ap1.end_date)
    `;
    
    const overlappingPeriods = db.exec(overlappingPeriodsQuery);
    
    if (overlappingPeriods.length > 0 && overlappingPeriods[0].values.length > 0) {
      results.push({
        category: 'Accounting Periods',
        status: 'fail',
        message: `Found ${overlappingPeriods[0].values.length} overlapping periods`,
        details: overlappingPeriods[0].values,
        severity: 'high'
      });
    } else {
      results.push({
        category: 'Accounting Periods',
        status: 'pass',
        message: 'No overlapping periods found',
        severity: 'low'
      });
    }

  } catch (error: any) {
    results.push({
      category: 'Accounting Periods',
      status: 'fail',
      message: `Error auditing accounting periods: ${error.message}`,
      severity: 'critical'
    });
  }

  return results;
}

/**
 * 3. AUDITORÍA DE FOREIGN KEYS
 */
export async function auditForeignKeys(): Promise<AuditResult[]> {
  const results: AuditResult[] = [];
  
  if (!db) {
    results.push({
      category: 'Foreign Keys',
      status: 'fail',
      message: 'Database not initialized',
      severity: 'critical'
    });
    return results;
  }

  try {
    // 3.1 Verificar invoices → customers
    const orphanInvoicesQuery = `
      SELECT i.id, i.invoice_number, i.customer_id
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE c.id IS NULL
    `;
    
    const orphanInvoices = db.exec(orphanInvoicesQuery);
    
    if (orphanInvoices.length > 0 && orphanInvoices[0].values.length > 0) {
      results.push({
        category: 'Foreign Keys',
        status: 'fail',
        message: `Found ${orphanInvoices[0].values.length} orphan invoices (invalid customer_id)`,
        details: orphanInvoices[0].values,
        severity: 'critical'
      });
    } else {
      results.push({
        category: 'Foreign Keys',
        status: 'pass',
        message: 'All invoices reference valid customers',
        severity: 'low'
      });
    }

    // 3.2 Verificar bills → suppliers
    const orphanBillsQuery = `
      SELECT b.id, b.bill_number, b.supplier_id
      FROM bills b
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      WHERE s.id IS NULL
    `;
    
    const orphanBills = db.exec(orphanBillsQuery);
    
    if (orphanBills.length > 0 && orphanBills[0].values.length > 0) {
      results.push({
        category: 'Foreign Keys',
        status: 'fail',
        message: `Found ${orphanBills[0].values.length} orphan bills (invalid supplier_id)`,
        details: orphanBills[0].values,
        severity: 'critical'
      });
    } else {
      results.push({
        category: 'Foreign Keys',
        status: 'pass',
        message: 'All bills reference valid suppliers',
        severity: 'low'
      });
    }

    // 3.3 Verificar fixed_assets → asset_categories
    const orphanAssetsQuery = `
      SELECT fa.id, fa.name, fa.category_id
      FROM fixed_assets fa
      LEFT JOIN asset_categories ac ON fa.category_id = ac.id
      WHERE ac.id IS NULL
    `;
    
    const orphanAssets = db.exec(orphanAssetsQuery);
    
    if (orphanAssets.length > 0 && orphanAssets[0].values.length > 0) {
      results.push({
        category: 'Foreign Keys',
        status: 'fail',
        message: `Found ${orphanAssets[0].values.length} fixed assets with invalid category references`,
        details: orphanAssets[0].values,
        severity: 'critical'
      });
    } else {
      results.push({
        category: 'Foreign Keys',
        status: 'pass',
        message: 'All fixed assets reference valid categories',
        severity: 'low'
      });
    }

  } catch (error: any) {
    results.push({
      category: 'Foreign Keys',
      status: 'fail',
      message: `Error auditing foreign keys: ${error.message}`,
      severity: 'critical'
    });
  }

  return results;
}

/**
 * 4. AUDITORÍA DE VALIDACIONES DE NEGOCIO
 */
export async function auditBusinessRules(): Promise<AuditResult[]> {
  const results: AuditResult[] = [];
  
  if (!db) {
    results.push({
      category: 'Business Rules',
      status: 'fail',
      message: 'Database not initialized',
      severity: 'critical'
    });
    return results;
  }

  try {
    // 4.1 Verificar que no haya montos negativos donde no deberían
    const negativeAmountsQuery = `
      SELECT 'invoices' as table_name, id, total_amount as amount
      FROM invoices
      WHERE total_amount < 0
      UNION ALL
      SELECT 'bills' as table_name, id, total_amount as amount
      FROM bills
      WHERE total_amount < 0
      UNION ALL
      SELECT 'fixed_assets' as table_name, id, acquisition_cost as amount
      FROM fixed_assets
      WHERE acquisition_cost < 0
    `;
    
    const negativeAmounts = db.exec(negativeAmountsQuery);
    
    if (negativeAmounts.length > 0 && negativeAmounts[0].values.length > 0) {
      results.push({
        category: 'Business Rules',
        status: 'fail',
        message: `Found ${negativeAmounts[0].values.length} records with negative amounts`,
        details: negativeAmounts[0].values,
        severity: 'high'
      });
    } else {
      results.push({
        category: 'Business Rules',
        status: 'pass',
        message: 'No negative amounts found where they should not be',
        severity: 'low'
      });
    }

    // 4.2 Verificar que no haya fechas futuras inválidas
    const futureDatesQuery = `
      SELECT 'invoices' as table_name, id, issue_date as date
      FROM invoices
      WHERE issue_date > date('now', '+1 day')
      UNION ALL
      SELECT 'bills' as table_name, id, issue_date as date
      FROM bills
      WHERE issue_date > date('now', '+1 day')
      UNION ALL
      SELECT 'journal_entries' as table_name, id, entry_date as date
      FROM journal_entries
      WHERE entry_date > date('now', '+1 day')
    `;
    
    const futureDates = db.exec(futureDatesQuery);
    
    if (futureDates.length > 0 && futureDates[0].values.length > 0) {
      results.push({
        category: 'Business Rules',
        status: 'warning',
        message: `Found ${futureDates[0].values.length} records with future dates`,
        details: futureDates[0].values,
        severity: 'medium'
      });
    } else {
      results.push({
        category: 'Business Rules',
        status: 'pass',
        message: 'No invalid future dates found',
        severity: 'low'
      });
    }

  } catch (error: any) {
    results.push({
      category: 'Business Rules',
      status: 'fail',
      message: `Error auditing business rules: ${error.message}`,
      severity: 'critical'
    });
  }

  return results;
}

/**
 * 5. AUDITORÍA DE ACTIVOS FIJOS
 */
export async function auditFixedAssets(): Promise<AuditResult[]> {
  const results: AuditResult[] = [];
  
  if (!db) {
    results.push({
      category: 'Fixed Assets',
      status: 'fail',
      message: 'Database not initialized',
      severity: 'critical'
    });
    return results;
  }

  try {
    // 5.1 Verificar que el valor en libros sea correcto
    const bookValueQuery = `
      SELECT 
        fa.id,
        fa.name,
        fa.acquisition_cost,
        fa.accumulated_depreciation,
        (fa.acquisition_cost - fa.accumulated_depreciation) as calculated_book_value,
        fa.current_value as stored_book_value,
        ABS((fa.acquisition_cost - fa.accumulated_depreciation) - COALESCE(fa.current_value, fa.acquisition_cost)) as difference
      FROM fixed_assets fa
      WHERE ABS((fa.acquisition_cost - fa.accumulated_depreciation) - COALESCE(fa.current_value, fa.acquisition_cost)) > 1.00
    `;
    
    const incorrectBookValues = db.exec(bookValueQuery);
    
    if (incorrectBookValues.length > 0 && incorrectBookValues[0].values.length > 0) {
      results.push({
        category: 'Fixed Assets',
        status: 'fail',
        message: `Found ${incorrectBookValues[0].values.length} assets with incorrect book values (difference > $1.00)`,
        details: incorrectBookValues[0].values,
        severity: 'high'
      });
    } else {
      results.push({
        category: 'Fixed Assets',
        status: 'pass',
        message: 'All fixed assets have correct book values',
        severity: 'low'
      });
    }

    // 5.2 Verificar que la depreciación acumulada no exceda el precio de compra
    const excessiveDepreciationQuery = `
      SELECT id, name, acquisition_cost, accumulated_depreciation
      FROM fixed_assets
      WHERE accumulated_depreciation > acquisition_cost
    `;
    
    const excessiveDepreciation = db.exec(excessiveDepreciationQuery);
    
    if (excessiveDepreciation.length > 0 && excessiveDepreciation[0].values.length > 0) {
      results.push({
        category: 'Fixed Assets',
        status: 'fail',
        message: `Found ${excessiveDepreciation[0].values.length} assets with excessive depreciation`,
        details: excessiveDepreciation[0].values,
        severity: 'critical'
      });
    } else {
      results.push({
        category: 'Fixed Assets',
        status: 'pass',
        message: 'No assets with excessive depreciation',
        severity: 'low'
      });
    }

  } catch (error: any) {
    results.push({
      category: 'Fixed Assets',
      status: 'fail',
      message: `Error auditing fixed assets: ${error.message}`,
      severity: 'critical'
    });
  }

  return results;
}

/**
 * 6. AUDITORÍA DE REPORTES FINANCIEROS
 */
export async function auditFinancialReports(): Promise<AuditResult[]> {
  const results: AuditResult[] = [];
  
  if (!db) {
    results.push({
      category: 'Financial Reports',
      status: 'fail',
      message: 'Database not initialized',
      severity: 'critical'
    });
    return results;
  }

  try {
    // 6.1 Verificar que el Trial Balance balancea
    const trialBalanceQuery = `
      SELECT 
        SUM(jd.debit_amount) as total_debits,
        SUM(jd.credit_amount) as total_credits,
        ABS(SUM(jd.debit_amount) - SUM(jd.credit_amount)) as difference
      FROM journal_details jd
      JOIN journal_entries je ON jd.journal_entry_id = je.id
    `;
    
    const trialBalance = db.exec(trialBalanceQuery);
    
    if (trialBalance.length > 0 && trialBalance[0].values.length > 0) {
      const difference = trialBalance[0].values[0][2] as number;
      
      if (difference > 0.01) {
        results.push({
          category: 'Financial Reports',
          status: 'fail',
          message: `Trial Balance does not balance. Difference: $${difference.toFixed(2)}`,
          details: trialBalance[0].values[0],
          severity: 'critical'
        });
      } else {
        results.push({
          category: 'Financial Reports',
          status: 'pass',
          message: 'Trial Balance is balanced',
          severity: 'low'
        });
      }
    }

  } catch (error: any) {
    results.push({
      category: 'Financial Reports',
      status: 'fail',
      message: `Error auditing financial reports: ${error.message}`,
      severity: 'critical'
    });
  }

  return results;
}

/**
 * FUNCIÓN PRINCIPAL DE AUDITORÍA
 */
export async function runSystemAudit(): Promise<SystemAuditReport> {
  console.log('🔍 Starting system audit...');
  
  const allResults: AuditResult[] = [];
  
  // Ejecutar todas las auditorías
  const journalEntriesResults = await auditJournalEntries();
  const accountingPeriodsResults = await auditAccountingPeriods();
  const foreignKeysResults = await auditForeignKeys();
  const businessRulesResults = await auditBusinessRules();
  const fixedAssetsResults = await auditFixedAssets();
  const financialReportsResults = await auditFinancialReports();
  
  // Combinar todos los resultados
  allResults.push(...journalEntriesResults);
  allResults.push(...accountingPeriodsResults);
  allResults.push(...foreignKeysResults);
  allResults.push(...businessRulesResults);
  allResults.push(...fixedAssetsResults);
  allResults.push(...financialReportsResults);
  
  // Calcular estadísticas
  const totalChecks = allResults.length;
  const passed = allResults.filter(r => r.status === 'pass').length;
  const warnings = allResults.filter(r => r.status === 'warning').length;
  const failed = allResults.filter(r => r.status === 'fail').length;
  
  // Determinar estado general
  let overallStatus: 'pass' | 'warning' | 'fail' = 'pass';
  if (failed > 0) {
    overallStatus = 'fail';
  } else if (warnings > 0) {
    overallStatus = 'warning';
  }
  
  const report: SystemAuditReport = {
    timestamp: new Date().toISOString(),
    overallStatus,
    totalChecks,
    passed,
    warnings,
    failed,
    results: allResults
  };
  
  console.log('✅ System audit completed');
  console.log(`Total checks: ${totalChecks}`);
  console.log(`Passed: ${passed}`);
  console.log(`Warnings: ${warnings}`);
  console.log(`Failed: ${failed}`);
  
  return report;
}

/**
 * FUNCIÓN PARA GENERAR REPORTE HTML
 */
export function generateAuditReportHTML(report: SystemAuditReport): string {
  const criticalIssues = report.results.filter(r => r.severity === 'critical' && r.status === 'fail');
  const highIssues = report.results.filter(r => r.severity === 'high' && r.status === 'fail');
  const mediumIssues = report.results.filter(r => r.severity === 'medium' && (r.status === 'fail' || r.status === 'warning'));
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>System Audit Report - ${report.timestamp}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; border-radius: 8px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
    .summary-card { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; }
    .summary-card h3 { margin: 0; font-size: 32px; }
    .summary-card p { margin: 5px 0 0 0; color: #6b7280; }
    .pass { color: #10b981; }
    .warning { color: #f59e0b; }
    .fail { color: #ef4444; }
    .section { margin: 30px 0; }
    .issue { background: #fff; border-left: 4px solid #ef4444; padding: 15px; margin: 10px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .issue.warning { border-left-color: #f59e0b; }
    .issue.pass { border-left-color: #10b981; }
    .issue h4 { margin: 0 0 10px 0; }
    .issue p { margin: 5px 0; color: #6b7280; }
    .details { background: #f9fafb; padding: 10px; border-radius: 4px; margin-top: 10px; font-family: monospace; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 System Audit Report</h1>
    <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
    <p>Overall Status: <strong class="${report.overallStatus}">${report.overallStatus.toUpperCase()}</strong></p>
  </div>
  
  <div class="summary">
    <div class="summary-card">
      <h3>${report.totalChecks}</h3>
      <p>Total Checks</p>
    </div>
    <div class="summary-card">
      <h3 class="pass">${report.passed}</h3>
      <p>Passed</p>
    </div>
    <div class="summary-card">
      <h3 class="warning">${report.warnings}</h3>
      <p>Warnings</p>
    </div>
    <div class="summary-card">
      <h3 class="fail">${report.failed}</h3>
      <p>Failed</p>
    </div>
  </div>
  
  ${criticalIssues.length > 0 ? `
  <div class="section">
    <h2>🚨 Critical Issues (${criticalIssues.length})</h2>
    ${criticalIssues.map(issue => `
      <div class="issue fail">
        <h4>${issue.category}</h4>
        <p>${issue.message}</p>
        ${issue.details ? `<div class="details">${JSON.stringify(issue.details, null, 2)}</div>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${highIssues.length > 0 ? `
  <div class="section">
    <h2>⚠️ High Priority Issues (${highIssues.length})</h2>
    ${highIssues.map(issue => `
      <div class="issue fail">
        <h4>${issue.category}</h4>
        <p>${issue.message}</p>
        ${issue.details ? `<div class="details">${JSON.stringify(issue.details, null, 2)}</div>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${mediumIssues.length > 0 ? `
  <div class="section">
    <h2>⚡ Medium Priority Issues (${mediumIssues.length})</h2>
    ${mediumIssues.map(issue => `
      <div class="issue warning">
        <h4>${issue.category}</h4>
        <p>${issue.message}</p>
        ${issue.details ? `<div class="details">${JSON.stringify(issue.details, null, 2)}</div>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  <div class="section">
    <h2>✅ All Checks</h2>
    ${report.results.map(issue => `
      <div class="issue ${issue.status}">
        <h4>${issue.category}</h4>
        <p>${issue.message}</p>
        ${issue.details ? `<div class="details">${JSON.stringify(issue.details, null, 2)}</div>` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>
  `;
}
