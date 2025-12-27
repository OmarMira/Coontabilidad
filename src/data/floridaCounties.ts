/**
 * CONDADOS DE FLORIDA - DATOS OFICIALES
 * 
 * Lista completa de los 67 condados del estado de Florida
 * para uso en reportes DR-15 y cálculos de impuestos.
 */

export interface FloridaCounty {
  name: string;
  code: string;
  population?: number;
  taxRate?: number; // Tasa total (estatal + local)
}

export const FLORIDA_COUNTIES: FloridaCounty[] = [
  { name: 'Alachua', code: 'ALA' },
  { name: 'Baker', code: 'BAK' },
  { name: 'Bay', code: 'BAY' },
  { name: 'Bradford', code: 'BRA' },
  { name: 'Brevard', code: 'BRE' },
  { name: 'Broward', code: 'BRO', taxRate: 0.07 },
  { name: 'Calhoun', code: 'CAL' },
  { name: 'Charlotte', code: 'CHA' },
  { name: 'Citrus', code: 'CIT' },
  { name: 'Clay', code: 'CLA' },
  { name: 'Collier', code: 'COL' },
  { name: 'Columbia', code: 'COM' },
  { name: 'DeSoto', code: 'DES' },
  { name: 'Dixie', code: 'DIX' },
  { name: 'Duval', code: 'DUV' },
  { name: 'Escambia', code: 'ESC' },
  { name: 'Flagler', code: 'FLA' },
  { name: 'Franklin', code: 'FRA' },
  { name: 'Gadsden', code: 'GAD' },
  { name: 'Gilchrist', code: 'GIL' },
  { name: 'Glades', code: 'GLA' },
  { name: 'Gulf', code: 'GUL' },
  { name: 'Hamilton', code: 'HAM' },
  { name: 'Hardee', code: 'HAR' },
  { name: 'Hendry', code: 'HEN' },
  { name: 'Hernando', code: 'HER' },
  { name: 'Highlands', code: 'HIG' },
  { name: 'Hillsborough', code: 'HIL', taxRate: 0.0675 },
  { name: 'Holmes', code: 'HOL' },
  { name: 'Indian River', code: 'IND' },
  { name: 'Jackson', code: 'JAC' },
  { name: 'Jefferson', code: 'JEF' },
  { name: 'Lafayette', code: 'LAF' },
  { name: 'Lake', code: 'LAK' },
  { name: 'Lee', code: 'LEE' },
  { name: 'Leon', code: 'LEO' },
  { name: 'Levy', code: 'LEV' },
  { name: 'Liberty', code: 'LIB' },
  { name: 'Madison', code: 'MAD' },
  { name: 'Manatee', code: 'MAN' },
  { name: 'Marion', code: 'MAR' },
  { name: 'Martin', code: 'MRT' },
  { name: 'Miami-Dade', code: 'MIA', taxRate: 0.07 },
  { name: 'Monroe', code: 'MON' },
  { name: 'Nassau', code: 'NAS' },
  { name: 'Okaloosa', code: 'OKA' },
  { name: 'Okeechobee', code: 'OKE' },
  { name: 'Orange', code: 'ORA', taxRate: 0.065 },
  { name: 'Osceola', code: 'OSC' },
  { name: 'Palm Beach', code: 'PAL', taxRate: 0.07 },
  { name: 'Pasco', code: 'PAS' },
  { name: 'Pinellas', code: 'PIN' },
  { name: 'Polk', code: 'POL' },
  { name: 'Putnam', code: 'PUT' },
  { name: 'Santa Rosa', code: 'SAN' },
  { name: 'Sarasota', code: 'SAR' },
  { name: 'Seminole', code: 'SEM' },
  { name: 'St. Johns', code: 'STJ' },
  { name: 'St. Lucie', code: 'STL' },
  { name: 'Sumter', code: 'SUM' },
  { name: 'Suwannee', code: 'SUW' },
  { name: 'Taylor', code: 'TAY' },
  { name: 'Union', code: 'UNI' },
  { name: 'Volusia', code: 'VOL' },
  { name: 'Wakulla', code: 'WAK' },
  { name: 'Walton', code: 'WAL' },
  { name: 'Washington', code: 'WAS' }
];

/**
 * Obtiene la lista de nombres de condados para dropdowns
 */
export const getFloridaCountyNames = (): string[] => {
  return FLORIDA_COUNTIES.map(county => county.name).sort();
};

/**
 * Obtiene información de un condado por nombre
 */
export const getCountyByName = (name: string): FloridaCounty | undefined => {
  return FLORIDA_COUNTIES.find(county => 
    county.name.toLowerCase() === name.toLowerCase()
  );
};

/**
 * Verifica si un condado es válido
 */
export const isValidFloridaCounty = (name: string): boolean => {
  return FLORIDA_COUNTIES.some(county => 
    county.name.toLowerCase() === name.toLowerCase()
  );
};