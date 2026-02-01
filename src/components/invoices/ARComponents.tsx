import { ModulePlaceholder } from '@/components/ModulePlaceholder';
import { ReceivableReports as RealReceivableReports } from './ReceivableReports';
import { QuoteList as RealQuoteList } from '@/components/quotes/QuoteList';

export const QuotesList = RealQuoteList;
export const ReceivableReports = () => <RealReceivableReports />;
