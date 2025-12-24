// Servicio de autocompletado de direcciones usando API gratuita de Nominatim (OpenStreetMap)
import { ZIP_CODE_DATABASE, ZipCodeData, searchAddresses as searchZipCodes, findByZipCode } from '../data/zipCodes';

export interface AddressSuggestion {
  id: string;
  display_name: string;
  city: string;
  state: string;
  stateCode: string;
  zipCode: string;
  county: string;
  lat?: number;
  lon?: number;
}

export interface AddressDetails {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  fullAddress: string;
}

class AddressService {
  private cache = new Map<string, AddressSuggestion[]>();
  private readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
  private readonly REQUEST_DELAY = 1000; // 1 segundo entre requests para respetar límites
  private lastRequestTime = 0;

  // Delay para respetar límites de la API gratuita
  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  // Buscar direcciones con autocompletado usando API gratuita + datos locales
  async searchAddresses(query: string): Promise<AddressSuggestion[]> {
    if (!query || query.length < 2) return [];

    console.log('🔍 Searching addresses for:', query);

    // Verificar cache
    const cacheKey = query.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      console.log('📋 Returning cached results');
      return this.cache.get(cacheKey)!;
    }

    try {
      // Buscar en datos locales primero (siempre rápido)
      console.log('🏠 Searching local data...');
      const localResults = searchZipCodes(query);
      console.log('🏠 Local results found:', localResults.length);
      
      const localSuggestions: AddressSuggestion[] = localResults.slice(0, 6).map((item, index) => ({
        id: `local-${item.zipCode}-${index}`,
        display_name: `${item.city}, ${item.stateCode} ${item.zipCode}`,
        city: item.city,
        state: item.state,
        stateCode: item.stateCode,
        zipCode: item.zipCode,
        county: item.county
      }));

      // Para queries cortas (2-3 caracteres), devolver solo resultados locales para mejor rendimiento
      if (query.length <= 3) {
        console.log('✅ Returning local results for short query:', localSuggestions.length);
        if (localSuggestions.length > 0) {
          this.cache.set(cacheKey, localSuggestions);
        }
        return localSuggestions;
      }

      // Para queries más largas, intentar API externa también
      let apiSuggestions: AddressSuggestion[] = [];
      try {
        console.log('🌐 Searching external API...');
        await this.respectRateLimit();
        
        apiSuggestions = await this.searchWithNominatim(query);
        console.log('🌐 API results found:', apiSuggestions.length);
      } catch (apiError) {
        console.warn('⚠️ API search failed, using local results only:', apiError);
      }
      
      // Combinar resultados, priorizando diversidad geográfica
      const combinedResults = this.combineResultsWithDiversity(localSuggestions, apiSuggestions);

      console.log('✅ Returning combined results:', combinedResults.length);
      
      // Guardar en cache
      if (combinedResults.length > 0) {
        this.cache.set(cacheKey, combinedResults);
      }
      
      return combinedResults;
      
    } catch (error) {
      console.error('❌ Error searching addresses:', error);
      
      // En caso de error, devolver solo resultados locales
      const fallbackResults = searchZipCodes(query).slice(0, 8).map((item, index) => ({
        id: `fallback-${item.zipCode}-${index}`,
        display_name: `${item.city}, ${item.stateCode} ${item.zipCode}`,
        city: item.city,
        state: item.state,
        stateCode: item.stateCode,
        zipCode: item.zipCode,
        county: item.county
      }));
      
      console.log('🔄 Returning fallback results:', fallbackResults.length);
      return fallbackResults;
    }
  }

  // Combinar resultados priorizando diversidad geográfica
  private combineResultsWithDiversity(
    localResults: AddressSuggestion[], 
    apiResults: AddressSuggestion[]
  ): AddressSuggestion[] {
    const combined: AddressSuggestion[] = [];
    const seenStates = new Set<string>();
    const seenCities = new Set<string>();
    
    // Agregar resultados locales primero
    for (const local of localResults) {
      if (combined.length < 6) {
        combined.push(local);
        seenStates.add(local.stateCode);
        seenCities.add(`${local.city}-${local.stateCode}`);
      }
    }
    
    // Agregar resultados de API, priorizando diversidad de estados
    for (const api of apiResults) {
      if (combined.length >= 6) break;
      
      const cityKey = `${api.city}-${api.stateCode}`;
      
      // Evitar duplicados exactos
      if (seenCities.has(cityKey)) continue;
      
      // Priorizar estados diferentes
      if (!seenStates.has(api.stateCode) || combined.length < 4) {
        combined.push(api);
        seenStates.add(api.stateCode);
        seenCities.add(cityKey);
      }
    }
    
    return combined;
  }

  // Buscar usando la API gratuita de Nominatim
  private async searchWithNominatim(query: string): Promise<AddressSuggestion[]> {
    try {
      // Construir URL de búsqueda
      const params = new URLSearchParams({
        q: `${query}, United States`,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: 'us',
        'accept-language': 'en'
      });

      const response = await fetch(`${this.NOMINATIM_BASE_URL}?${params}`, {
        headers: {
          'User-Agent': 'AccountExpress/1.0 (Business Application)'
        }
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('🌐 Nominatim API response:', data.length, 'results');

      // Procesar resultados de la API
      const suggestions: AddressSuggestion[] = [];
      
      for (const item of data) {
        if (item.address && item.address.state && item.address.country_code === 'us') {
          const stateCode = this.getStateCode(item.address.state);
          const city = item.address.city || item.address.town || item.address.village || item.address.hamlet;
          const county = item.address.county;
          const postcode = item.address.postcode;

          if (city && stateCode) {
            suggestions.push({
              id: `nominatim-${item.place_id}`,
              display_name: `${city}, ${stateCode}${postcode ? ' ' + postcode : ''}`,
              city: city,
              state: item.address.state,
              stateCode: stateCode,
              zipCode: postcode || '',
              county: county ? county.replace(' County', '') : '',
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon)
            });
          }
        }
      }

      return suggestions;
      
    } catch (error) {
      console.error('❌ Error with Nominatim API:', error);
      return [];
    }
  }

  // Obtener detalles completos de una dirección
  async getAddressDetails(suggestion: AddressSuggestion): Promise<AddressDetails> {
    try {
      const details: AddressDetails = {
        street: '', // El usuario deberá completar la calle manualmente
        city: suggestion.city,
        state: suggestion.stateCode,
        zipCode: suggestion.zipCode,
        county: suggestion.county,
        fullAddress: suggestion.display_name
      };

      return details;
    } catch (error) {
      console.error('Error getting address details:', error);
      throw error;
    }
  }

  // Buscar por código postal específico
  async searchByZipCode(zipCode: string): Promise<AddressSuggestion | null> {
    console.log('🔍 Searching by zip code:', zipCode);
    
    // Primero buscar en datos locales
    const localResult = findByZipCode(zipCode);
    if (localResult) {
      console.log('✅ Found in local data');
      return {
        id: localResult.zipCode,
        display_name: `${localResult.city}, ${localResult.stateCode} ${localResult.zipCode}`,
        city: localResult.city,
        state: localResult.state,
        stateCode: localResult.stateCode,
        zipCode: localResult.zipCode,
        county: localResult.county
      };
    }

    // Si no se encuentra localmente, buscar en API
    try {
      await this.respectRateLimit();
      
      const params = new URLSearchParams({
        q: `${zipCode}, United States`,
        format: 'json',
        addressdetails: '1',
        limit: '1',
        countrycodes: 'us'
      });

      const response = await fetch(`${this.NOMINATIM_BASE_URL}?${params}`, {
        headers: {
          'User-Agent': 'AccountExpress/1.0 (Business Application)'
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.length === 0) return null;

      const item = data[0];
      if (item.address && item.address.state) {
        const stateCode = this.getStateCode(item.address.state);
        const city = item.address.city || item.address.town || item.address.village;
        const county = item.address.county;

        if (city && stateCode) {
          console.log('✅ Found via API');
          return {
            id: `api-${item.place_id}`,
            display_name: `${city}, ${stateCode} ${zipCode}`,
            city: city,
            state: item.address.state,
            stateCode: stateCode,
            zipCode: zipCode,
            county: county ? county.replace(' County', '') : ''
          };
        }
      }
    } catch (error) {
      console.error('Error searching by zip code:', error);
    }

    return null;
  }

  // Convertir nombre de estado a código
  private getStateCode(stateName: string): string {
    const stateMap: Record<string, string> = {
      'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
      'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
      'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
      'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
      'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
      'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
      'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
      'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
      'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
      'district of columbia': 'DC'
    };

    return stateMap[stateName.toLowerCase()] || stateName.toUpperCase().substring(0, 2);
  }

  // Validar código postal
  isValidZipCode(zipCode: string): boolean {
    return /^\d{5}(-\d{4})?$/.test(zipCode);
  }

  // Obtener condado de Florida si aplica
  getFloridaCounty(county: string, city: string): string {
    // Mapeo de condados de Florida
    const floridaCounties = [
      'Alachua', 'Baker', 'Bay', 'Bradford', 'Brevard', 'Broward', 'Calhoun',
      'Charlotte', 'Citrus', 'Clay', 'Collier', 'Columbia', 'DeSoto', 'Dixie',
      'Duval', 'Escambia', 'Flagler', 'Franklin', 'Gadsden', 'Gilchrist',
      'Glades', 'Gulf', 'Hamilton', 'Hardee', 'Hendry', 'Hernando', 'Highlands',
      'Hillsborough', 'Holmes', 'Indian River', 'Jackson', 'Jefferson', 'Lafayette',
      'Lake', 'Lee', 'Leon', 'Levy', 'Liberty', 'Madison', 'Manatee', 'Marion',
      'Martin', 'Miami-Dade', 'Monroe', 'Nassau', 'Okaloosa', 'Okeechobee',
      'Orange', 'Osceola', 'Palm Beach', 'Pasco', 'Pinellas', 'Polk', 'Putnam',
      'Santa Rosa', 'Sarasota', 'Seminole', 'St. Johns', 'St. Lucie', 'Sumter',
      'Suwannee', 'Taylor', 'Union', 'Volusia', 'Wakulla', 'Walton', 'Washington'
    ];

    // Limpiar el nombre del condado
    const cleanCounty = county.replace(/\s+(County|Parish)$/i, '');
    
    // Buscar coincidencia exacta
    const match = floridaCounties.find(fc => 
      fc.toLowerCase() === cleanCounty.toLowerCase()
    );

    if (match) return match;

    // Mapeo especial para ciudades conocidas
    const cityToCounty: Record<string, string> = {
      'miami': 'Miami-Dade',
      'orlando': 'Orange',
      'tampa': 'Hillsborough',
      'jacksonville': 'Duval',
      'fort lauderdale': 'Broward',
      'west palm beach': 'Palm Beach',
      'tallahassee': 'Leon',
      'gainesville': 'Alachua',
      'pensacola': 'Escambia',
      'sarasota': 'Sarasota',
      'naples': 'Collier',
      'fort myers': 'Lee'
    };

    return cityToCounty[city.toLowerCase()] || 'Miami-Dade';
  }

  // Limpiar cache
  clearCache(): void {
    this.cache.clear();
  }
}

export const addressService = new AddressService();