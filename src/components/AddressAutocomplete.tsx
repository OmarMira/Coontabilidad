import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, Check } from 'lucide-react';
import { addressService, AddressSuggestion, AddressDetails } from '../services/addressService';

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressDetails) => void;
  initialValue?: string;
  placeholder?: string;
  className?: string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  initialValue = '',
  placeholder = 'Ingresa una dirección en Estados Unidos...',
  className = ''
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasSelected, setHasSelected] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (hasSelected) {
      setHasSelected(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        console.log('🔍 Starting address search for:', query);
        const results = await addressService.searchAddresses(query);
        console.log('📍 Search results:', results.length, results);
        
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(-1);
        
        if (results.length === 0) {
          console.log('⚠️ No results found for query:', query);
        }
      } catch (error) {
        console.error('❌ Error searching addresses:', error);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, hasSelected]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setHasSelected(false);
  };

  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    try {
      setIsLoading(true);
      const details = await addressService.getAddressDetails(suggestion);
      
      setQuery(suggestion.display_name);
      setHasSelected(true);
      setIsOpen(false);
      setSelectedIndex(-1);
      
      onAddressSelect(details);
    } catch (error) {
      console.error('Error selecting address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const formatSuggestionText = (suggestion: AddressSuggestion) => {
    return {
      street: '', // No tenemos calle en las sugerencias, el usuario la completará
      location: `${suggestion.city}, ${suggestion.stateCode} ${suggestion.zipCode}`
    };
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full bg-gray-700 text-white px-4 py-2 pl-10 pr-10 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none ${className}`}
        />
        
        {/* Search icon */}
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        
        {/* Loading/Success icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          ) : hasSelected ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => {
            const { street, location } = formatSuggestionText(suggestion);
            
            return (
              <div
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0 ${
                  index === selectedIndex
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700 text-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {suggestion.city}, {suggestion.stateCode}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {suggestion.zipCode} • {suggestion.county} County
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && suggestions.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg p-4 text-center">
          <div className="text-gray-400">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No se encontraron direcciones para "{query}"</p>
            <p className="text-sm mt-1">Intenta con:</p>
            <ul className="text-xs mt-2 space-y-1">
              <li>• Nombre de ciudad: "Miami", "New York"</li>
              <li>• Estado: "FL", "California"</li>
              <li>• Código postal: "33101", "10001"</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};