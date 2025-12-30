import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { ReceivableReports as RealReceivableReports } from './ReceivableReports';

export const QuotesList = () => <ModulePlaceholder title="Cotizaciones" features={['Generar PDF', 'Convertir a Venta']} />;
export const ReceivableReports = () => <RealReceivableReports />;
