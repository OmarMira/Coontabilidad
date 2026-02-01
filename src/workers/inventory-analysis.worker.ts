// inventory-analysis.worker.ts - Worker para análisis pesado de inventario
/// <reference lib="webworker" />

interface InventoryAnalysisTask {
  type: 'ABC_ANALYSIS' | 'TURNOVER_CALCULATION' | 'STOCK_AGING' | 'REORDER_SUGGESTIONS';
  payload: any;
}

interface ABCClassification {
  productId: number;
  productName: string;
  annualValue: number;
  cumulativePercentage: number;
  classification: 'A' | 'B' | 'C';
}

interface TurnoverMetrics {
  productId: number;
  turnoverRatio: number;
  daysToSell: number;
  stockStatus: 'fast' | 'normal' | 'slow' | 'dead';
}

self.onmessage = async (event: MessageEvent) => {
  const { type, taskId, payload } = event.data;

  try {
    let result: any;

    switch (payload.type) {
      case 'ABC_ANALYSIS':
        result = performABCAnalysis(payload.payload);
        break;

      case 'TURNOVER_CALCULATION':
        result = calculateTurnoverMetrics(payload.payload);
        break;

      case 'STOCK_AGING':
        result = analyzeStockAging(payload.payload);
        break;

      case 'REORDER_SUGGESTIONS':
        result = generateReorderSuggestions(payload.payload);
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
 * Análisis ABC de inventario
 * Clasifica productos por valor anual (A: 80%, B: 15%, C: 5%)
 */
function performABCAnalysis(products: Array<{
  id: number;
  name: string;
  annualSales: number;
  unitCost: number;
}>): ABCClassification[] {
  // Calcular valor anual de cada producto
  const productsWithValue = products.map(p => ({
    productId: p.id,
    productName: p.name,
    annualValue: p.annualSales * p.unitCost
  }));

  // Ordenar por valor descendente
  productsWithValue.sort((a, b) => b.annualValue - a.annualValue);

  // Calcular valor total
  const totalValue = productsWithValue.reduce((sum, p) => sum + p.annualValue, 0);

  // Clasificar productos
  let cumulativeValue = 0;
  const classified: ABCClassification[] = productsWithValue.map(product => {
    cumulativeValue += product.annualValue;
    const cumulativePercentage = (cumulativeValue / totalValue) * 100;

    let classification: 'A' | 'B' | 'C';
    if (cumulativePercentage <= 80) {
      classification = 'A';
    } else if (cumulativePercentage <= 95) {
      classification = 'B';
    } else {
      classification = 'C';
    }

    return {
      ...product,
      cumulativePercentage: Math.round(cumulativePercentage * 100) / 100,
      classification
    };
  });

  return classified;
}

/**
 * Calcula métricas de rotación de inventario
 */
function calculateTurnoverMetrics(products: Array<{
  id: number;
  name: string;
  currentStock: number;
  annualSales: number;
  avgStock: number;
}>): TurnoverMetrics[] {
  return products.map(product => {
    // Ratio de rotación = Ventas anuales / Stock promedio
    const turnoverRatio = product.avgStock > 0 
      ? Math.round((product.annualSales / product.avgStock) * 100) / 100
      : 0;

    // Días para vender = 365 / Ratio de rotación
    const daysToSell = turnoverRatio > 0 
      ? Math.round(365 / turnoverRatio)
      : 999;

    // Clasificar velocidad de rotación
    let stockStatus: 'fast' | 'normal' | 'slow' | 'dead';
    if (turnoverRatio >= 12) {
      stockStatus = 'fast'; // Rota más de 12 veces al año
    } else if (turnoverRatio >= 4) {
      stockStatus = 'normal'; // Rota 4-12 veces al año
    } else if (turnoverRatio >= 1) {
      stockStatus = 'slow'; // Rota 1-4 veces al año
    } else {
      stockStatus = 'dead'; // Rota menos de 1 vez al año
    }

    return {
      productId: product.id,
      turnoverRatio,
      daysToSell,
      stockStatus
    };
  });
}

/**
 * Analiza antigüedad del stock
 */
function analyzeStockAging(products: Array<{
  id: number;
  name: string;
  lastPurchaseDate: string;
  currentStock: number;
  unitCost: number;
}>): Array<{
  productId: number;
  productName: string;
  daysInStock: number;
  ageCategory: 'fresh' | 'aging' | 'old' | 'obsolete';
  stockValue: number;
}> {
  const today = new Date();

  return products.map(product => {
    const lastPurchase = new Date(product.lastPurchaseDate);
    const daysInStock = Math.floor((today.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));

    let ageCategory: 'fresh' | 'aging' | 'old' | 'obsolete';
    if (daysInStock <= 30) {
      ageCategory = 'fresh';
    } else if (daysInStock <= 90) {
      ageCategory = 'aging';
    } else if (daysInStock <= 180) {
      ageCategory = 'old';
    } else {
      ageCategory = 'obsolete';
    }

    return {
      productId: product.id,
      productName: product.name,
      daysInStock,
      ageCategory,
      stockValue: product.currentStock * product.unitCost
    };
  });
}

/**
 * Genera sugerencias de reorden basadas en análisis
 */
function generateReorderSuggestions(products: Array<{
  id: number;
  name: string;
  currentStock: number;
  reorderLevel: number;
  avgDailySales: number;
  leadTimeDays: number;
  safetyStock: number;
}>): Array<{
  productId: number;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedOrderQty: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  daysUntilStockout: number;
}> {
  return products.map(product => {
    // Punto de reorden = (Demanda diaria × Lead time) + Stock de seguridad
    const reorderPoint = (product.avgDailySales * product.leadTimeDays) + product.safetyStock;

    // Cantidad sugerida de orden = Demanda durante lead time + Stock de seguridad - Stock actual
    const suggestedOrderQty = Math.max(0, 
      (product.avgDailySales * product.leadTimeDays) + product.safetyStock - product.currentStock
    );

    // Días hasta agotamiento
    const daysUntilStockout = product.avgDailySales > 0
      ? Math.floor(product.currentStock / product.avgDailySales)
      : 999;

    // Nivel de urgencia
    let urgency: 'critical' | 'high' | 'medium' | 'low';
    if (product.currentStock <= 0) {
      urgency = 'critical';
    } else if (product.currentStock <= product.reorderLevel) {
      urgency = 'high';
    } else if (product.currentStock <= reorderPoint) {
      urgency = 'medium';
    } else {
      urgency = 'low';
    }

    return {
      productId: product.id,
      productName: product.name,
      currentStock: product.currentStock,
      reorderPoint: Math.round(reorderPoint),
      suggestedOrderQty: Math.round(suggestedOrderQty),
      urgency,
      daysUntilStockout
    };
  });
}

export {};
