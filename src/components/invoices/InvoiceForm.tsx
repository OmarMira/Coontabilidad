import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, PlusCircle, Trash2 } from 'lucide-react';
import { useInvoiceForm } from './useInvoiceForm';
import { CustomerSelector } from './subcomponents/CustomerSelector';
import { TaxSummary } from './subcomponents/TaxSummary';

export const InvoiceForm: React.FC = () => {
    const {
        customer,
        lines,
        subtotal,
        taxAmount,
        total,
        auditHash,
        loading,
        error,
        setCustomer,
        addLine,
        updateLine,
        removeLine,
        saveInvoice
    } = useInvoiceForm();

    const handleSave = async () => {
        const savedId = await saveInvoice();
        if (savedId) {
            console.log('Factura guardada con ID:', savedId);
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto my-8">
            <CardHeader>
                <CardTitle className="text-2xl">Facturación Forense Florida</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Selector de Cliente */}
                <div className="space-y-4">
                    <Label htmlFor="customer">Cliente</Label>
                    <CustomerSelector
                        selectedCustomer={customer}
                        onSelect={setCustomer}
                    />
                    {customer && (
                        <div className="text-sm text-muted-foreground">
                            Condado: <strong>{customer.county}</strong>
                        </div>
                    )}
                </div>

                {/* Líneas de Factura */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label>Productos/Servicios</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addLine}
                            disabled={loading}
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Agregar Línea
                        </Button>
                    </div>

                    {lines.map((line, index) => (
                        <div key={line.id} className="flex gap-4 items-start p-4 border rounded-lg">
                            <div className="flex-1 space-y-2">
                                <Input
                                    placeholder="Descripción"
                                    value={line.description}
                                    onChange={(e) => updateLine(line.id, { description: e.target.value })}
                                    disabled={loading}
                                />
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor={`quantity-${line.id}`}>Cantidad</Label>
                                        <Input
                                            id={`quantity-${line.id}`}
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={line.quantity}
                                            onChange={(e) => updateLine(line.id, { quantity: parseFloat(e.target.value) || 0 })}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Label htmlFor={`price-${line.id}`}>Precio Unitario</Label>
                                        <Input
                                            id={`price-${line.id}`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={line.unitPrice}
                                            onChange={(e) => updateLine(line.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => removeLine(line.id)}
                                disabled={loading || lines.length <= 1}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Resumen de Impuestos */}
                <TaxSummary
                    subtotal={subtotal}
                    taxAmount={taxAmount}
                    total={total}
                    county={customer?.county}
                />

                {/* Hash de Auditoría */}
                {auditHash && (
                    <Alert className="bg-green-50 border-green-200">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            <div className="font-semibold mb-1">🛡️ Transacción Auditada</div>
                            <div className="text-sm font-mono break-all">
                                Hash: {auditHash.substring(0, 32)}...
                            </div>
                            <div className="text-xs mt-1">
                                Esta factura ha sido registrada en la cadena de auditoría inmutable.
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Mensajes de Error */}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Botón de Guardar */}
                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={loading || !customer || lines.some(l => !l.description || l.unitPrice <= 0)}
                        className="min-w-32"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            'Guardar con Auditoría'
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
