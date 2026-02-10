/**
 * ELITE DESIGN SYSTEM - INDEX
 * 
 * Exporta todos los componentes del sistema de diseño elite.
 * Importa este archivo para acceder a todos los componentes.
 * 
 * @example
 * ```tsx
 * import { ElitePageHeader, EliteStatsCard, EliteTable } from '@/components/elite';
 * ```
 */

export { ElitePageHeader } from './ElitePageHeader';
export { EliteStatsCard } from './EliteStatsCard';
export { EliteTable } from './EliteTable';
export { EliteSearchBar } from './EliteSearchBar';
export { EliteBadge } from './EliteBadge';

// Re-export types
export type { default as ElitePageHeaderProps } from './ElitePageHeader';
export type { default as EliteStatsCardProps } from './EliteStatsCard';
export type { default as EliteTableProps, EliteTableColumn } from './EliteTable';
export type { default as EliteSearchBarProps } from './EliteSearchBar';
export type { default as EliteBadgeProps } from './EliteBadge';
