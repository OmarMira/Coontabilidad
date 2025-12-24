import React, { useState } from 'react';
import { 
  Truck, 
  FileText, 
  CreditCard, 
  Package, 
  ArrowLeft, 
  Edit,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';
import { Supplier } from '../database/simple-db';

interface SupplierDetailViewProps {
  supplier: Supplier;
  onBack: () => void;
  onEdit: (supplier: Supplier) => void;
}

export const SupplierDetailView: React.FC<SupplierDetailViewProps> = ({
  supplier,
  onBack,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: Truck },
    { id: 'bills', label: 'Facturas de Compra', icon: FileText },
    { id: 'payments', label: 'Pagos Realizados', icon: CreditCard },
    { id: 'products', label: 'Productos/Servicios', icon: Package }
  ];

  // Datos de ejemplo para las pestañas
  const sampleBills = [
    {
      id: 1,
      number: 'BILL-2024-001',
      date: '2024-01-10',
      dueDate: '2024-02-09',
      amount: 2140.00,
      status: 'approved'
    },
    {
      id: 2,
      number: 'BILL-2024-002',
      date: '2024-01-15',
      dueDate: '2024-01-30',
      amount: 905.25,
      status: 'received'
    }
  ];

  const samplePayments = [
    {
      id: 1,
      number: 'SPAY-2024-001',
      date: '2024-03-01',
      amount: 1605.00,
      method: 'bank_transfer',
      reference: 'TXN-SP789123'
    },
    {
      id: 2,
      number: 'SPAY-2024-002',
      date: '2024-01-20',
      amount: 1000.00,
      method: 'check',
      reference: 'CHK-SP001'
    }
  ];

  const sampleProducts = [
    {
      id: 1,
      name: 'Software Licenses',
      lastPurchase: '2024-01-10',
      totalPurchases: 10,
      totalAmount: 2000.00
    },
    {
      id: 2,
      name: 'Office Equipment',
      lastPurchase: '2024-01-15',
      totalPurchases: 5,
      totalAmount: 850.00
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900/30 text-green-400 border-green-700/50';
      case 'inactive': return 'bg-gray-900/30 text-gray-400 border-gray-700/50';
      case 'suspended': return 'bg-red-900/30 text-red-400 border-red-700/50';
      default: return 'bg-gray-900/30 text-gray-400 border-gray-700/50';
    }
  };

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-900/30 text-green-400';
      case 'approved': return 'bg-blue-900/30 text-blue-400';
      case 'received': return 'bg-yellow-900/30 text-yellow-400';
      case 'overdue': return 'bg-red-900/30 text-red-400';
      case 'draft': return 'bg-gray-900/30 text-gray-400';
      default: return 'bg-gray-900/30 text-gray-400';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'check': return 'Cheque';
      case 'credit_card': return 'Tarjeta de Crédito';
      case 'bank_transfer': return 'Transferencia Bancaria';
      default: return 'Otro';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-400" />
            Información del Proveedor
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Nombre/Razón Social</p>
              <p className="text-white font-medium">{supplier.name}</p>
            </div>
            {supplier.business_name && (
              <div>
                <p className="text-sm text-gray-400">Nombre Comercial</p>
                <p className="text-white">{supplier.business_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-400">Documento</p>
              <p className="text-white">{supplier.document_type}: {supplier.document_number}</p>
            </div>
            {supplier.business_type && (
              <div>
                <p className="text-sm text-gray-400">Tipo de Negocio</p>
                <p className="text-white">{supplier.business_type}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-green-400" />
            Contacto
          </h3>
          <div className="space-y-3">
            {supplier.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-white">{supplier.email}</p>
                  <p className="text-xs text-gray-400">Email Principal</p>
                </div>
              </div>
            )}
            {supplier.email_secondary && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-white">{supplier.email_secondary}</p>
                  <p className="text-xs text-gray-400">Email Secundario</p>
                </div>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-white">{supplier.phone}</p>
                  <p className="text-xs text-gray-400">Teléfono Principal</p>
                </div>
              </div>
            )}
            {supplier.phone_secondary && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-white">{supplier.phone_secondary}</p>
                  <p className="text-xs text-gray-400">Teléfono Secundario</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dirección y datos comerciales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-400" />
            Dirección
          </h3>
          <div className="space-y-2">
            {supplier.address_line1 && <p className="text-white">{supplier.address_line1}</p>}
            {supplier.address_line2 && <p className="text-white">{supplier.address_line2}</p>}
            <p className="text-white">
              {supplier.city}, {supplier.state} {supplier.zip_code}
            </p>
            <p className="text-gray-400">Condado: {supplier.florida_county}</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-400" />
            Datos Comerciales
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Límite de Crédito</p>
              <p className="text-white font-medium">${supplier.credit_limit?.toLocaleString() || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Términos de Pago</p>
              <p className="text-white">{supplier.payment_terms || 30} días</p>
            </div>
            {supplier.assigned_buyer && (
              <div>
                <p className="text-sm text-gray-400">Comprador Asignado</p>
                <p className="text-white">{supplier.assigned_buyer}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-400">Estado</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(supplier.status || 'active')}`}>
                {supplier.status === 'active' ? 'Activo' : supplier.status === 'inactive' ? 'Inactivo' : 'Suspendido'}
              </span>
            </div>
            {supplier.tax_exempt && (
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-700/50">
                  Exento de Impuestos
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notas */}
      {supplier.notes && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Notas</h3>
          <p className="text-gray-300">{supplier.notes}</p>
        </div>
      )}
    </div>
  );

  const renderBillsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Facturas de Compra</h3>
        <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Nueva Factura de Compra
        </button>
      </div>
      
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sampleBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-orange-400 font-medium">{bill.number}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {new Date(bill.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {new Date(bill.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                    ${bill.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getBillStatusColor(bill.status)}`}>
                      {bill.status === 'approved' ? 'Aprobada' : bill.status === 'received' ? 'Recibida' : 'Borrador'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-400 hover:text-blue-300 mr-3">Ver</button>
                    <button className="text-green-400 hover:text-green-300">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Pagos Realizados</h3>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Registrar Pago
        </button>
      </div>
      
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Referencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {samplePayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-400 font-medium">{payment.number}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {new Date(payment.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                    ${payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {getPaymentMethodLabel(payment.method)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    {payment.reference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-400 hover:text-blue-300 mr-3">Ver</button>
                    <button className="text-green-400 hover:text-green-300">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProductsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Productos y Servicios Suministrados</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleProducts.map((product) => (
          <div key={product.id} className="bg-gray-900 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-white font-medium">{product.name}</h4>
                <p className="text-sm text-gray-400">
                  Última compra: {new Date(product.lastPurchase).toLocaleDateString()}
                </p>
              </div>
              <Package className="w-5 h-5 text-orange-400" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total compras:</span>
                <span className="text-white font-medium">{product.totalPurchases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Monto total:</span>
                <span className="text-orange-400 font-medium">${product.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {sampleProducts.length === 0 && (
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Aún no se han registrado compras a este proveedor.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{supplier.name}</h1>
            {supplier.business_name && (
              <p className="text-gray-400">{supplier.business_name}</p>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onEdit(supplier)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Editar Proveedor
        </button>
      </div>

      {/* Pestañas */}
      <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors flex-1 text-sm ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de las pestañas */}
      <div>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'bills' && renderBillsTab()}
        {activeTab === 'payments' && renderPaymentsTab()}
        {activeTab === 'products' && renderProductsTab()}
      </div>
    </div>
  );
};