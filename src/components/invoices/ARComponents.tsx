import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { ReceivableReports as RealReceivableReports } from '../../features/receivables/components/ReceivableReports';
import { QuoteList as RealQuoteList } from '../../features/quotes/components/QuoteList';

export const QuotesList = RealQuoteList;
export const ReceivableReports = () => <RealReceivableReports />;
