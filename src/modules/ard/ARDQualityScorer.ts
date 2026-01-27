export interface QualityScore {
    score: number; // 0 - 100
    rating: 'A++' | 'A' | 'B' | 'C' | 'D';
    label: string;
    color: string;
    metrics: {
        precision: number;
        speed: number;
        volume: number;
        consistency: number;
    };
}

export const calculateCustomerQuality = (stats: any): QualityScore => {
    const { total_docs, pending_conversion, total_converted, total_volume } = stats;

    // 1. Tasa de Conversión (Peso: 40%)
    const conversionRate = total_docs > 0 ? (total_converted / total_docs) * 100 : 0;

    // 2. Volumen de Operaciones (Peso: 30%)
    // Basado en un umbral de $10,000 para el score máximo
    const volumeScore = Math.min((total_volume / 10000) * 100, 100);

    // 3. Eficiencia Operativa (Peso: 30%)
    // Menos documentos pendientes = Mayor eficiencia
    const efficiencyScore = total_docs > 0 ? ((total_docs - pending_conversion) / total_docs) * 100 : 0;

    const finalScore = Math.round(
        (conversionRate * 0.4) +
        (volumeScore * 0.3) +
        (efficiencyScore * 0.3)
    );

    let rating: QualityScore['rating'] = 'D';
    let label = 'Requiere Atención';
    let color = 'text-rose-500';

    if (finalScore >= 90) {
        rating = 'A++';
        label = 'Cliente Elite';
        color = 'text-emerald-400';
    } else if (finalScore >= 75) {
        rating = 'A';
        label = 'Alta Calidad';
        color = 'text-blue-400';
    } else if (finalScore >= 50) {
        rating = 'B';
        label = 'Estándar';
        color = 'text-sun-orange';
    } else if (finalScore >= 30) {
        rating = 'C';
        label = 'Bajo Cumplimiento';
        color = 'text-amber-600';
    }

    return {
        score: finalScore,
        rating,
        label,
        color,
        metrics: {
            precision: Math.round(conversionRate),
            speed: Math.round(efficiencyScore),
            volume: Math.round(volumeScore),
            consistency: Math.round((finalScore + conversionRate) / 2)
        }
    };
};
