import React, { useState } from 'react';
import {
  Edit,
  Trash2,
  Tag,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Percent,
  CheckCircle,
  AlertTriangle,
  Package
} from 'lucide-react';
import { ProductCategory } from '@/database/simple-db';

interface ProductCategoryListProps {
  categories: ProductCategory[];
  onEdit: (category: ProductCategory) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

interface CategoryNode extends ProductCategory {
  children: CategoryNode[];
  level: number;
}

export const ProductCategoryList: React.FC<ProductCategoryListProps> = ({
  categories,
  onEdit,
  onDelete,
  onAdd
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Construir árbol jerárquico de categorías
  const buildCategoryTree = (): CategoryNode[] => {
    const categoryMap = new Map<number, CategoryNode>();
    const rootCategories: CategoryNode[] = [];

    // Crear nodos para todas las categorías
    categories.forEach(category => {
      categoryMap.set(category.id!, {
        ...category,
        children: [],
        level: 0
      });
    });

    // Construir relaciones padre-hijo
    categories.forEach(category => {
      const node = categoryMap.get(category.id!);
      if (!node) return;

      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          node.level = parent.level + 1;
          parent.children.push(node);
        } else {
          // Padre no encontrado, tratar como raíz
          rootCategories.push(node);
        }
      } else {
        rootCategories.push(node);
      }
    });

    return rootCategories;
  };

  // Filtrar categorías por búsqueda
  const filterCategories = (nodes: CategoryNode[], term: string): CategoryNode[] => {
    if (!term) return nodes;

    const filtered: CategoryNode[] = [];

    nodes.forEach(node => {
      const matchesSearch =
        node.name.toLowerCase().includes(term.toLowerCase()) ||
        (node.description && node.description.toLowerCase().includes(term.toLowerCase()));

      const filteredChildren = filterCategories(node.children, term);

      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren
        });
      }
    });

    return filtered;
  };

  const categoryTree = buildCategoryTree();
  const filteredTree = filterCategories(categoryTree, searchTerm);

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDelete = (category: CategoryNode) => {
    const hasChildren = category.children.length > 0;
    const confirmMessage = hasChildren
      ? `¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Esta acción también eliminará todas sus subcategorías.`
      : `¿Estás seguro de que deseas eliminar la categoría "${category.name}"?`;

    if (window.confirm(confirmMessage)) {
      onDelete(category.id!);
    }
  };

  const renderCategoryNode = (node: CategoryNode): React.ReactNode => {
    const isExpanded = expandedCategories.has(node.id!);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="border-l-2 border-white/10">
        <div
          className={`flex items-center justify-between p-4 hover:bg-white/5/50 transition-colors ${node.level > 0 ? 'ml-6' : ''
            }`}
        >
          <div className="flex items-center space-x-3 flex-1">
            {/* Botón expandir/contraer */}
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(node.id!)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}

            {/* Icono de categoría */}
            <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
              <Tag className="w-4 h-4 text-purple-400" />
            </div>

            {/* Información de la categoría */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-white font-medium truncate">{node.name}</h3>

                {/* Estado */}
                {node.active ? (
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-slate-500 flex-shrink-0" />
                )}

                {/* Tasa de impuesto */}
                {node.tax_rate && node.tax_rate > 0 && (
                  <span className="bg-blue-900/20 text-blue-300 px-2 py-0.5 rounded-full text-xs flex items-center">
                    <Percent className="w-3 h-3 mr-1" />
                    {node.tax_rate}%
                  </span>
                )}
              </div>

              {node.description && (
                <p className="text-slate-500 text-sm truncate mt-1">{node.description}</p>
              )}

              {/* Información adicional */}
              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-600">
                <span>ID: {node.id}</span>
                {hasChildren && (
                  <span className="flex items-center">
                    <Package className="w-3 h-3 mr-1" />
                    {node.children.length} subcategoría{node.children.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(node)}
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
              title="Editar categoría"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(node)}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="Eliminar categoría"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subcategorías */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {node.children.map(child => renderCategoryNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con búsqueda y botón agregar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-900/40 active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-lg font-semibold text-white">{categories.length}</p>
            </div>
            <Tag className="w-5 h-5 text-purple-400" />
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Principales</p>
              <p className="text-lg font-semibold text-white">
                {categories.filter(c => !c.parent_id).length}
              </p>
            </div>
            <Package className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Subcategorías</p>
              <p className="text-lg font-semibold text-white">
                {categories.filter(c => c.parent_id).length}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-green-400" />
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Activas</p>
              <p className="text-lg font-semibold text-green-400">
                {categories.filter(c => c.active).length}
              </p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
        </div>
      </div>

      {/* Lista de categorías */}
      {filteredTree.length === 0 ? (
        <div className="bg-white/10 rounded-lg p-8 text-center">
          <Tag className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-black tracking-tight text-slate-500 mb-2">
            {searchTerm
              ? 'No se encontraron categorías'
              : 'No hay categorías registradas'
            }
          </h3>
          <p className="text-slate-600">
            {searchTerm
              ? 'Intenta ajustar los términos de búsqueda'
              : 'Comienza creando tu primera categoría de productos'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white/10 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-700">
            {filteredTree.map(node => renderCategoryNode(node))}
          </div>
        </div>
      )}

      {/* Información de ayuda */}
      {categories.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h4 className="text-blue-300 font-medium mb-2">💡 Gestión de Categorías</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Haz clic en las flechas para expandir/contraer subcategorías</li>
            <li>• Las categorías con tasa de impuesto específica muestran el porcentaje</li>
            <li>• Las categorías inactivas aparecen con un ícono de advertencia</li>
            <li>• No puedes eliminar categorías que tengan productos asociados</li>
          </ul>
        </div>
      )}

      {/* Resumen de resultados */}
      {filteredTree.length > 0 && searchTerm && (
        <div className="text-sm text-slate-500 text-center">
          Mostrando {filteredTree.length} de {categories.length} categorías
        </div>
      )}
    </div>
  );
};