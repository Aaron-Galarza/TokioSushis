import { iProducto } from './products.model';
import { IOptionGroup } from '../option-groups/optionGroups.model';
import { IOption } from '../options/options.model';

export interface ResolvedOption {
  ingredienteId: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  permiteCantidad: boolean;
  cantidadMaxima: number;
  orden: number;
}
export interface ResolvedGroup {
  grupoId: string;
  nombre: string;
  descripcion?: string;
  tipo: 'unico' | 'multiple';
  obligatorio: boolean;
  minimo: number;
  maximo: number;
  orden: number;
  ingredientes: ResolvedOption[];
}
export interface ResolvedConfiguration {
  productoId: string;
  tipoProducto: 'simple' | 'configurable';
  grupos: ResolvedGroup[];
}

/** Requiere el producto con grupos e ingredientes populados. */
export function resolveProductConfiguration(product: iProducto): ResolvedConfiguration {
  const grupos: ResolvedGroup[] = [];
  for (const association of product.gruposOpciones ?? []) {
    const group = association.grupo as unknown as IOptionGroup;
    if (!group?.ingredientes) continue;
    const enabled = new Set((association.ingredientes ?? []).map(String));
    const ingredientes: ResolvedOption[] = [];
    for (const entry of group.ingredientes) {
      const option = entry.ingrediente as unknown as IOption;
      if (!group.activo || !option?.nombre || !option.activo || !option.disponible || !entry.activo) continue;
      if (enabled.size && !enabled.has(String(option._id))) continue;
      ingredientes.push({
        ingredienteId: String(option._id), nombre: option.nombre,
        descripcion: option.descripcion,
        precio: entry.precioEspecial ?? option.precio,
        permiteCantidad: entry.permiteCantidad,
        cantidadMaxima: entry.permiteCantidad ? entry.cantidadMaxima : 1,
        orden: entry.orden,
      });
    }
    ingredientes.sort((a, b) => a.orden - b.orden);
    grupos.push({
      grupoId: String(group._id), nombre: group.nombre, descripcion: group.descripcion,
      tipo: group.tipo, obligatorio: association.obligatorio ?? group.obligatorio,
      minimo: association.minimo ?? group.minimo, maximo: association.maximo ?? group.maximo,
      orden: association.orden, ingredientes,
    });
  }
  grupos.sort((a, b) => a.orden - b.orden);
  return { productoId: String(product._id), tipoProducto: product.tipoProducto ?? 'simple', grupos };
}
