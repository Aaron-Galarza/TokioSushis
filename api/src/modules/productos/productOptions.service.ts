import { AppError } from '../../utils/AppError';
import { ResolvedConfiguration } from './productConfig.resolver';

export interface SelectedOptionInput { grupoId: string; ingredienteId: string; cantidad?: number }
export interface PricedOption {
  grupoId: string; grupoNombre: string; ingredienteId: string;
  ingredienteNombre: string; precio: number; cantidad: number;
}

export function validateProductConfiguration(config: ResolvedConfiguration, selections: SelectedOptionInput[] = [], expectedGroupCount?: number) {
  if (config.tipoProducto !== 'configurable') {
    if (selections.length) throw new AppError(400, 'El producto no admite ingredientes configurables');
    return { ingredientes: [] as PricedOption[], precioIngredientes: 0 };
  }
  if (!config.grupos.length) throw new AppError(400, 'El producto no tiene opciones disponibles');
  if (expectedGroupCount !== undefined && config.grupos.length !== expectedGroupCount) throw new AppError(400, 'La configuración del producto está incompleta');
  const groupById = new Map(config.grupos.map(group => [group.grupoId, group]));
  const uniqueSelections = new Set<string>();
  for (const selection of selections) {
    if (!groupById.has(selection.grupoId)) throw new AppError(400, 'Grupo no disponible para este producto');
    const key = `${selection.grupoId}:${selection.ingredienteId}`;
    if (uniqueSelections.has(key)) throw new AppError(400, 'El ingrediente está repetido');
    uniqueSelections.add(key);
  }
  const ingredientes: PricedOption[] = [];
  let precioIngredientes = 0;
  for (const group of config.grupos) {
    if (!group.ingredientes.length) throw new AppError(400, `No hay ingredientes disponibles en "${group.nombre}"`);
    const entries = selections.filter(selection => selection.grupoId === group.grupoId);
    if (entries.length < Math.max(group.minimo, group.obligatorio ? 1 : 0)) {
      throw new AppError(400, `Faltan ingredientes en "${group.nombre}"`);
    }
    if ((group.tipo === 'unico' && entries.length > 1) || entries.length > group.maximo) {
      throw new AppError(400, `Demasiados ingredientes en "${group.nombre}"`);
    }
    for (const entry of entries) {
      const option = group.ingredientes.find(candidate => candidate.ingredienteId === entry.ingredienteId);
      if (!option) throw new AppError(400, `Ingrediente no disponible en "${group.nombre}"`);
      const cantidad = entry.cantidad ?? 1;
      if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > (option.permiteCantidad ? option.cantidadMaxima : 1)) {
        throw new AppError(400, `Cantidad inválida para "${option.nombre}"`);
      }
      precioIngredientes += option.precio * cantidad;
      ingredientes.push({
        grupoId: group.grupoId, grupoNombre: group.nombre,
        ingredienteId: option.ingredienteId, ingredienteNombre: option.nombre,
        precio: option.precio, cantidad,
      });
    }
  }
  return { ingredientes, precioIngredientes };
}
