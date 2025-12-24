import React, { useState } from 'react';
import { 
  User, 
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
import { Customer } from '../database/simple-db';

interface CustomerDetailViewProps {
  customer: Customer;
  onBack: () => void;
  onEdit: (customer: Customer) => void;
}

export const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  customer,
  onBack,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: User },
    { id: 'invoices', label: 'Facturas', icon: FileText },
    { id: 'payments', label: 'Pagos', icon: CreditCard },
    { id: 'products', label: 'Productos/Servicios', icon: Package }
  ];

  // Datos de ejemplo para las pestañas
  const sampleInvoices = [
    {
      id: 1,
      number: 'INV-2024-001',
      date: '2024-01-15',
      dueDate: '2024-02-14',
      amount: 1605.00,
      status: 'paid'
    },
    {
      id: 2,
      number: 'INV-2024-002',
      date: '2024-01-20',
      dueDate: '2024-02-04',
      amount: 319.49,
      status: 'sent'
    }
  ];

  const samplePayments = [
    {
      id: 1,
      number: 'PAY-2024-001',
      date: '2024-02-10',
      amount: 1605.00,
      method: 'bank_transfer',
      reference: 'TXN-789456123'
    },
    {
      id: 2,
      number: 'PAY-2024-002',
      date: '2024-01-25',
      amount: 500.00,
      method: 'check',
      reference: 'CHK-001234'
    }
  ];

  const sampleProducts = [
    {
      id: 1,
      name: 'Consultoría Contable',
      lastPurchase: '2024-01-15',
      totalPurchases: 10,
      totalAmount: 1500.00
    },
    {
      id: 2,
      name: 'Software License',
      lastPurchase: '2024-01-20',
      totalPurchases: 1,
      totalAmount: 299.99
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

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-900/30 text-green-400';
      case 'sent': return 'bg-blue-900/30 text-blue-400';
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
            <User className="w-5 h-5 text-blue-400" />
            Información Personal
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Nombre/Razón Social</p>
              <p className="text-white font-medium">{customer.name}</p>
            </div>
            {customer.business_name && (
              <div>
                <p className="text-sm text-gray-400">Nombre Comercial</p>
                <p className="text-white">{customer.business_name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-400">Documento</p>
              <p className="text-white">{customer.document_type}: {customer.document_number}</p>
            </div>
            {customer.business_type && (
              <div>
                <p className="text-sm text-gray-400">Tipo de Negocio</p>
                <p className="text-white">{customer.business_type}</p>
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
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-white">{customer.email}</p>
                  <p className="text-xs text-gray-400">Email Principal</p>
                </div>
              </div>
            )}
            {customer.email_secondary && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-white">{customer.email_secondary}</p>
                  <p className="text-xs text-gray-400">Email Secundario</p>
                </div>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-white">{customer.phone}</p>
                  <p className="text-xs text-gray-400">Teléfono Principal</p>
                </div>
              </div>
            )}
            {customer.phone_secondary && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-white">{customer.phone_secondary}</p>
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
            {customer.address_line1 && <p className="text-white">{customer.address_line1}</p>}
            {customer.address_line2 && <p className="text-white">{customer.address_line2}</p>}
            <p className="text-white">
              {customer.city}, {customer.state} {customer.zip_code}
            </p>
            <p className="text-gray-400">Condado: {customer.florida_county}</p>
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
              <p className="text-white font-medium">${customer.credit_limit?.toLocaleString() || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Términos de Pago</p>
              <p className="text-white">{customer.payment_terms || 30} días</p>
            </div>
            {customer.assigned_salesperson && (
              <div>
                <p className="text-sm text-gray-400">Vendedor Asignado</p>
                <p className="text-white">{customer.assigned_salesperson}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-400">Estado</p>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(customer.status || 'active')}`}>
                {customer.status === 'active' ? 'Activo' : customer.status === 'inactive' ? 'Inactivo' : 'Suspendido'}
              </span>
            </div>
            {customer.tax_exempt && (
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
      {customer.notes && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Notas</h3>
          <p className="text-gray-300">{customer.notes}</p>
        </div>
      )}
    </div>
  );
  const renderInvoicesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Facturas del Cliente</h3>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Nueva Factura
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
              {sampleInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-blue-400 font-medium">{invoice.number}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {new Date(invoice.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                    ${invoice.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getInvoiceStatusColor(invoice.status)}`}>
                      {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'sent' ? 'Enviada' : 'Borrador'}
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
        <h3 className="text-lg font-semibold text-white">Historial de Pagos</h3>
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
        <h3 className="text-lg font-semibold text-white">Productos y Servicios Comprados</h3>
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
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total compras:</span>
                <span className="text-white font-medium">{product.totalPurchases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Monto total:</span>
                <span className="text-green-400 font-medium">${product.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {sampleProducts.length === 0 && (
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Este cliente aún no ha comprado productos o servicios.</p>
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
            <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
            {customer.business_name && (
              <p className="text-gray-400">{customer.business_name}</p>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onEdit(customer)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Editar Cliente
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
                ? 'bg-blue-600 text-white'
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
        {activeTab === 'invoices' && renderInvoicesTab()}
        {activeTab === 'payments' && renderPaymentsTab()}
        {activeTab === 'products' && renderProductsTab()}
      </div>
    </div>
  );
};