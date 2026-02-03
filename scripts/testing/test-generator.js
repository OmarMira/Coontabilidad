// Script de prueba para el generador de datos
import { generateMassiveTestData } from './src/database/seeding/MassiveDataGenerator.ts';

console.log('🧪 Iniciando prueba del generador...');

try {
  const result = await generateMassiveTestData({
    customers: 5,
    suppliers: 3,
    products: 10,
    invoices: 5,
    bills: 5,
    quotes: 3,
    employees: 3,
    bankAccounts: 2
  });
  
  console.log('✅ Resultado:', result);
} catch (error) {
  console.error('❌ Error:', error);
  console.error('Stack:', error.stack);
}
