// payroll.worker.ts - Heavy payroll calculations worker
import { calculateEmployeePayroll, CalculationResult } from '../utils/payroll-tax-calculator';
import { Employee, PayrollSetting, TaxBracket } from '../database/simple-db';

export interface PayrollCalculationTask {
  type: 'CALCULATE_PAYROLL' | 'BULK_CALCULATE' | 'TAX_CALCULATION' | 'GENERATE_PAYSLIPS';
  employees: Employee[];
  settings: PayrollSetting[];
  brackets: TaxBracket[];
  periodData?: {
    start_date: string;
    end_date: string;
    pay_date: string;
  };
}

export interface PayrollCalculationResult {
  calculations: CalculationResult[];
  summary: {
    totalEmployees: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    processingTime: number;
  };
  payslips?: string[]; // Base64 encoded PDFs
}

// Worker message handler
self.onmessage = async (event: MessageEvent) => {
  const { type, taskId, payload } = event.data;

  if (type !== 'EXECUTE_TASK') {
    return;
  }

  const startTime = performance.now();

  try {
    const task = payload as PayrollCalculationTask;
    let result: PayrollCalculationResult;

    switch (task.type) {
      case 'CALCULATE_PAYROLL':
      case 'BULK_CALCULATE':
        result = await calculateBulkPayroll(task);
        break;

      case 'TAX_CALCULATION':
        result = await calculateTaxes(task);
        break;

      case 'GENERATE_PAYSLIPS':
        result = await generatePayslips(task);
        break;

      default:
        throw new Error(`Tipo de tarea no soportado: ${task.type}`);
    }

    const endTime = performance.now();
    result.summary.processingTime = endTime - startTime;

    // Send success response
    self.postMessage({
      taskId,
      type: 'TASK_COMPLETE',
      payload: result
    });

  } catch (error) {
    console.error('Error in payroll worker:', error);
    
    // Send error response
    self.postMessage({
      taskId,
      type: 'TASK_ERROR',
      error: error instanceof Error ? error.message : 'Error desconocido en worker de nómina'
    });
  }
};

async function calculateBulkPayroll(task: PayrollCalculationTask): Promise<PayrollCalculationResult> {
  const calculations: CalculationResult[] = [];
  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  // Process each employee
  for (const employee of task.employees) {
    const calc = calculateEmployeePayroll(employee, task.settings, task.brackets);
    calculations.push(calc);
    
    totalGross += calc.grossAmount;
    totalDeductions += calc.deductionsAmount;
    totalNet += calc.netAmount;

    // Yield control periodically for large batches
    if (calculations.length % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return {
    calculations,
    summary: {
      totalEmployees: task.employees.length,
      totalGross,
      totalDeductions,
      totalNet,
      processingTime: 0 // Will be set by caller
    }
  };
}

async function calculateTaxes(task: PayrollCalculationTask): Promise<PayrollCalculationResult> {
  // Specialized tax calculation logic
  const calculations: CalculationResult[] = [];
  
  for (const employee of task.employees) {
    // Focus only on tax calculations
    const calc = calculateEmployeePayroll(employee, task.settings, task.brackets);
    
    // Extract only tax-related line items
    const taxItems = calc.lineItems.filter(item => 
      item.type === 'deduction' && 
      item.category && (
        item.category.includes('tax') || item.category.includes('Tax') || 
        item.category.includes('ISR') || item.category.includes('Social')
      )
    );
    
    calculations.push({
      ...calc,
      lineItems: taxItems
    });
  }

  const totalDeductions = calculations.reduce((sum, calc) => 
    sum + calc.lineItems.reduce((itemSum, item) => itemSum + (item.amount || 0), 0), 0
  );

  return {
    calculations,
    summary: {
      totalEmployees: task.employees.length,
      totalGross: 0,
      totalDeductions,
      totalNet: 0,
      processingTime: 0
    }
  };
}

async function generatePayslips(task: PayrollCalculationTask): Promise<PayrollCalculationResult> {
  const calculations: CalculationResult[] = [];
  const payslips: string[] = [];

  for (const employee of task.employees) {
    const calc = calculateEmployeePayroll(employee, task.settings, task.brackets);
    calculations.push(calc);

    // Generate simple payslip (in real implementation, use jsPDF)
    const payslipData = generatePayslipData(employee, calc, task.periodData);
    payslips.push(btoa(JSON.stringify(payslipData))); // Base64 encode for transport

    // Yield control for large batches
    if (payslips.length % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  const totalGross = calculations.reduce((sum, calc) => sum + calc.grossAmount, 0);
  const totalDeductions = calculations.reduce((sum, calc) => sum + calc.deductionsAmount, 0);
  const totalNet = calculations.reduce((sum, calc) => sum + calc.netAmount, 0);

  return {
    calculations,
    payslips,
    summary: {
      totalEmployees: task.employees.length,
      totalGross,
      totalDeductions,
      totalNet,
      processingTime: 0
    }
  };
}

function generatePayslipData(employee: Employee, calculation: CalculationResult, periodData?: any) {
  return {
    employee: {
      name: `${employee.first_name} ${employee.last_name}`,
      number: employee.employee_number,
      position: employee.position,
      department: employee.department
    },
    period: periodData || {
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      pay_date: new Date().toISOString().split('T')[0]
    },
    earnings: calculation.lineItems.filter(item => item.type === 'earning'),
    deductions: calculation.lineItems.filter(item => item.type === 'deduction'),
    summary: {
      gross: calculation.grossAmount,
      deductions: calculation.deductionsAmount,
      net: calculation.netAmount
    },
    generatedAt: new Date().toISOString()
  };
}

// Export types for main thread