
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { LocalAIService } from '../../src/services/ai/LocalAIService';

// Mock database
const mockExec = vi.fn();
vi.mock('../../src/database/simple-db', () => ({
    db: {
        exec: (query: string) => mockExec(query)
    }
}));

describe('Final AI Verification', () => {
    let aiService: LocalAIService;

    beforeEach(() => {
        aiService = new LocalAIService();
        mockExec.mockReset();

        // Configurar respuesta mock de la base de datos
        mockExec.mockReturnValue([{
            columns: [
                'total_clientes', 'lista_clientes', 'facturas_venta',
                'facturas_compra', 'mayor_venta_monto', 'mayor_venta_numero',
                'total_proveedores', 'valor_inventario'
            ],
            values: [[
                8, 'Cliente A, Cliente B', 15,
                5, 2850.00, 'INV-001',
                3, 50000
            ]]
        }]);
    });

    test('Debe responder correctamente a preguntas clave', async () => {
        // 1. Clientes
        const r1 = await aiService.processQuery('cuantos clientes tengo');
        console.log('Q: cuantos clientes tengo');
        console.log('A:', r1.response.information);
        expect(r1.response.information).toContain('Tienes 8 clientes registrados');

        // 2. Facturas
        const r2 = await aiService.processQuery('cuantas facturas hay');
        console.log('Q: cuantas facturas hay');
        console.log('A:', r2.response.information);
        expect(r2.response.information).toContain('Hay 15 facturas de venta y 5 de compra');

        // 3. Mayor Venta
        const r3 = await aiService.processQuery('cual es la mayor venta');
        console.log('Q: cual es la mayor venta');
        console.log('A:', r3.response.information);
        expect(r3.response.information).toContain('La mayor venta es INV-001 por $2850');

        // 4. Proveedores
        const r4 = await aiService.processQuery('cuantos proveedores tengo');
        console.log('Q: cuantos proveedores tengo');
        console.log('A:', r4.response.information);
        expect(r4.response.information).toContain('Tienes 3 proveedores');

        // 5. Inventario
        const r5 = await aiService.processQuery('valor inventario');
        expect(r5.response.information).toContain('$50000');
    });
});
