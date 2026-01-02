import React, { useEffect, useRef, useState } from 'react';

interface AddressComponents {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    county?: string;
}

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string) => void;
    onAddressSelect: (components: AddressComponents) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

// Declarar tipos globales para Google Maps
declare global {
    interface Window {
        google: typeof google;
    }
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
    value,
    onChange,
    onAddressSelect,
    placeholder = "Ingrese dirección",
    className = "",
    disabled = false
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Verificar si Google Maps ya está cargado
        if (typeof window.google !== 'undefined' && window.google.maps && window.google.maps.places) {
            setIsLoaded(true);
        } else {
            // Esperar a que se cargue el script
            const checkGoogleMaps = setInterval(() => {
                if (typeof window.google !== 'undefined' && window.google.maps && window.google.maps.places) {
                    setIsLoaded(true);
                    clearInterval(checkGoogleMaps);
                }
            }, 100);

            // Timeout después de 10 segundos
            setTimeout(() => clearInterval(checkGoogleMaps), 10000);

            return () => clearInterval(checkGoogleMaps);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded || !inputRef.current) return;

        try {
            // Inicializar Google Places Autocomplete
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 'us' }, // Restringir a USA
                fields: ['address_components', 'formatted_address', 'geometry'],
                types: ['address'] // Solo direcciones completas
            });

            // Listener para cuando se selecciona una dirección
            autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current?.getPlace();

                if (!place || !place.address_components) return;

                const components = place.address_components;
                const addressData: AddressComponents = {
                    address: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    county: ''
                };

                // Extraer componentes de la dirección
                let streetNumber = '';
                let route = '';

                components.forEach((component: google.maps.GeocoderAddressComponent) => {
                    const types = component.types;

                    if (types.includes('street_number')) {
                        streetNumber = component.long_name;
                    }
                    if (types.includes('route')) {
                        route = component.long_name;
                    }
                    if (types.includes('locality')) {
                        addressData.city = component.long_name;
                    }
                    if (types.includes('administrative_area_level_1')) {
                        addressData.state = component.short_name; // FL, CA, etc.
                    }
                    if (types.includes('postal_code')) {
                        addressData.zipCode = component.long_name;
                    }
                    if (types.includes('administrative_area_level_2')) {
                        // Condado (ej: "Miami-Dade County")
                        addressData.county = component.long_name.replace(' County', '');
                    }
                });

                // Construir dirección completa
                addressData.address = `${streetNumber} ${route}`.trim();

                // Actualizar campo de dirección
                onChange(addressData.address);

                // Notificar componente padre con todos los datos
                onAddressSelect(addressData);
            });
        } catch (error) {
            console.error('Error initializing Google Places Autocomplete:', error);
        }

        return () => {
            // Limpiar listeners
            if (autocompleteRef.current) {
                window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [isLoaded, onChange, onAddressSelect]);

    return (
        <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={className || "w-full bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"}
            disabled={disabled}
            autoComplete="off"
        />
    );
};
