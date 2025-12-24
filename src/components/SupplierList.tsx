import React, { useState } from 'react';
import { Truck, Edit, Trash2, MapPin, Mail, Phone, Search, Eye } from 'lucide-react';
import { Supplier } from '../database/simple-db';

interface SupplierListProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onView: (supplier: Supplier) => void;
  onDelete: (id: number) => void;
}

export const SupplierList: React.FC<SupplierListProps> = ({ 
  suppliers, 
  onEdit, 
  onView,
  onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');

  // Filtrar proveedores
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.phone.includes(searchTerm);
    
    const matchesCounty = selectedCounty === '' || supplier.florida_county === selectedCounty;
    
    return matchesSearch && matchesCounty;
  });

  // Obtener condados únicos para el filtro
  const uniqueCounties = Array.from(new Set(suppliers.map(s => s.florida_county))).sort();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const handleDelete = (supplier: Supplier) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${supplier.name}?`)) {
      onDelete(supplier.id);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Truck className="w-5 h-5 text-orange-500" />
          Proveedores ({filteredSuppliers.length})
        </h2>
        
        {/* Filtros */}
        <div className="flex items-center space-x-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none w-64"
            />
          </div>
          
          {/* Filtro por condado */}
          {uniqueCounties.length > 1 && (
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos los condados</option>
              {uniqueCounties.map(county => (
                <option key={county} value={county}>
                  {county}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {filteredSuppliers.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">
            {searchTerm || selectedCounty ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
          </p>
          <p className="text-gray-500 text-sm">
            {searchTerm || selectedCounty 
              ? 'Intenta cambiar los filtros de búsqueda'
              : 'Agrega tu primer proveedor usando el formulario de arriba'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => (
            <div 
              key={supplier.id} 
              className="bg-gray-700 p-4 rounded-md hover:bg-gray-650 transition-colors border border-gray-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1">
                    {supplier.name}
                  </h3>
                  <div className="text-xs text-gray-400 mb-2">
                    ID: {supplier.id} • {formatDate(supplier.created_at)}
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => onView(supplier)}
                    className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-600 rounded transition-colors"
                    title="Ver detalles del proveedor"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(supplier)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded transition-colors"
                    title="Editar proveedor"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(supplier)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded transition-colors"
                    title="Eliminar proveedor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {supplier.business_name && (
                  <div className="text-gray-300 text-sm">
                    <span className="font-medium">{supplier.business_name}</span>
                  </div>
                )}
                
                {supplier.email && (
                  <div className="flex items-center text-gray-300 text-sm">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                
                {supplier.phone && (
                  <div className="flex items-center text-gray-300 text-sm">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center text-gray-300 text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-orange-400 font-medium">{supplier.florida_county}</span>
                </div>

                {supplier.business_type && (
                  <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    {supplier.business_type}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Estadísticas */}
      {suppliers.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-400">{suppliers.length}</div>
              <div className="text-sm text-gray-400">Total Proveedores</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {suppliers.filter(s => s.email).length}
              </div>
              <div className="text-sm text-gray-400">Con Email</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {suppliers.filter(s => s.phone).length}
              </div>
              <div className="text-sm text-gray-400">Con Teléfono</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {uniqueCounties.length}
              </div>
              <div className="text-sm text-gray-400">Condados</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};