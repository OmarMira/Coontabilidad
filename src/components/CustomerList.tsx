import React, { useState } from 'react';
import { Users, Edit, Trash2, MapPin, Mail, Phone, Search, Eye, Plus } from 'lucide-react';
import { Customer } from '../database/simple-db';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  onDelete: (id: number) => void;
  onAddCustomer: () => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onEdit,
  onView,
  onDelete,
  onAddCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');

  // Filtrar clientes
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);

    const matchesCounty = selectedCounty === '' || customer.florida_county === selectedCounty;

    return matchesSearch && matchesCounty;
  });

  // Obtener condados únicos para el filtro
  const uniqueCounties = Array.from(new Set(customers.map(c => c.florida_county))).sort();

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

  const handleDelete = (customer: Customer) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${customer.name}?`)) {
      onDelete(customer.id);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Clientes ({filteredCustomers.length})
          </h2>
          <button
            onClick={onAddCustomer}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-center space-x-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes..."
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

      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-2">
            {searchTerm || selectedCounty ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </p>
          <p className="text-gray-500 text-sm">
            {searchTerm || selectedCounty
              ? 'Intenta cambiar los filtros de búsqueda'
              : 'Agrega tu primer cliente usando el formulario de arriba'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-gray-700 p-4 rounded-md hover:bg-gray-650 transition-colors border border-gray-600"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1">
                    {customer.name}
                  </h3>
                  <div className="text-xs text-slate-300 mb-2 font-medium">
                    ID: {customer.id} • {formatDate(customer.created_at)}
                  </div>
                </div>

                <div className="flex space-x-1">
                  <button
                    onClick={() => onView(customer)}
                    className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-emerald-500/30"
                    title="Ver detalles del cliente"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onEdit(customer)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-blue-500/30"
                    title="Editar cliente"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer)}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-rose-500/30"
                    title="Eliminar cliente"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-600/50 pt-3">
                {customer.email && (
                  <div className="flex items-center text-white text-sm">
                    <Mail className="w-4 h-4 mr-2 text-blue-400" />
                    <span className="truncate font-medium">{customer.email}</span>
                  </div>
                )}

                {customer.phone && (
                  <div className="flex items-center text-white text-sm">
                    <Phone className="w-4 h-4 mr-2 text-emerald-400" />
                    <span className="font-bold">{customer.phone}</span>
                  </div>
                )}

                <div className="flex items-center text-white text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-rose-400" />
                  <span className="text-white font-black bg-blue-900/40 px-2 py-0.5 rounded border border-blue-500/30">{customer.florida_county}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estadísticas */}
      {customers.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="text-3xl font-black text-blue-400">{customers.length}</div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mt-1">Total Clientes</div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="text-3xl font-black text-emerald-400">
                {customers.filter(c => c.email).length}
              </div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mt-1">Con Email</div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="text-3xl font-black text-amber-400">
                {customers.filter(c => c.phone).length}
              </div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mt-1">Con Teléfono</div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="text-3xl font-black text-purple-400">
                {uniqueCounties.length}
              </div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-400 mt-1">Condados</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};