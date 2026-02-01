// quotes.worker.ts - Worker para procesamiento de cotizaciones
/// <reference lib="webworker" />

interface QuoteProcessingTask {
  type: 'CALCULATE_TOTALS' | 'VALIDATE_QUOTE' | 'GENERATE_PDF' | 'BATCH_PROCESS';
  payload: any;
}

interface QuoteCalculation {
  subtotal: number;
  taxAmount: number;
  total: number;
  discountTotal: number;
}

self.onmessage = async (event: MessageEvent) => {
  const { type, taskId, payload } = event.data;

  try {
    let result: any;

    switch (payload.type) {
      case 'CALCULATE_TOTALS':
        result = calculateQuoteTotals(payload.payload);
        break;

      case 'VALIDATE_QUOTE':
        result = validateQuote(payload.payload);
        break;

      case 'BATCH_PROCESS':
        result = await batchProcessQuotes(payload.payload);
        break;

      default:
        throw new Error(`Unknown task type: ${payload.type}`);
    }

    self.postMessage({
      taskId,
      type: 'SUCCESS',
      payload: result
    });

  } catch (error: any) {
    self.postMessage({
      taskId,
      type: 'ERROR',
      error: error.message
    });
  }
};

/**
 * Calcula totales de una cotización con descuentos
 */
function calculateQuoteTotals(data: {
  items: Array<{
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
    taxable: boolean;
  }>;
  taxRate: number;
}): QuoteCalculation {
  let subtotal = 0;
  let taxAmount = 0;
  let discountTotal = 0;

  data.items.forEach(item => {
    const discount = (item.discount_percentage || 0) / 100;
    const lineSubtotal = item.quantity * item.unit_price;
    const lineDiscount = lineSubtotal * discount;
    const lineTotal = lineSubtotal - lineDiscount;

    subtotal += lineTotal;
    discountTotal += lineDiscount;

    if (item.taxable) {
      taxAmount += lineTotal * data.taxRate;
    }
  });

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100
  };
}

/**
 * Valida una cotización antes de guardar
 */
function validateQuote(quote: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!quote.customer_id) {
    errors.push('Cliente es requerido');
  }

  if (!quote.items || quote.items.length === 0) {
    errors.push('Debe incluir al menos un item');
  }

  if (quote.items) {
    quote.items.forEach((item: any, index: number) => {
      if (!item.description) {
        errors.push(`Item ${index + 1}: Descripción es requerida`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Cantidad debe ser mayor a 0`);
      }
      if (item.unit_price < 0) {
        errors.push(`Item ${index + 1}: Precio no puede ser negativo`);
      }
    });
  }

  if (quote.expiration_date && quote.issue_date) {
    const expiration = new Date(quote.expiration_date);
    const issue = new Date(quote.issue_date);
    if (expiration < issue) {
      errors.push('Fecha de expiración debe ser posterior a fecha de emisión');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Procesa múltiples cotizaciones en lote
 */
async function batchProcessQuotes(quotes: any[]): Promise<{
  processed: number;
  errors: number;
  results: any[];
}> {
  const results: any[] = [];
  let processed = 0;
  let errors = 0;

  for (const quote of quotes) {
    try {
      const validation = validateQuote(quote);
      if (validation.valid) {
        const totals = calculateQuoteTotals({
          items: quote.items,
          taxRate: 0.07 // Default tax rate
        });
        results.push({
          quote_id: quote.id,
          status: 'success',
          totals
        });
        processed++;
      } else {
        results.push({
          quote_id: quote.id,
          status: 'error',
          errors: validation.errors
        });
        errors++;
      }
    } catch (error: any) {
      results.push({
        quote_id: quote.id,
        status: 'error',
        errors: [error.message]
      });
      errors++;
    }
  }

  return { processed, errors, results };
}

export {};
