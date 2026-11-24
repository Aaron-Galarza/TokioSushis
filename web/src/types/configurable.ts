export interface IngredientOption {
  _id: string; nombre: string; descripcion?: string; precio: number;
  activo: boolean; disponible: boolean; orden: number;
}
export interface GroupIngredient {
  ingrediente: IngredientOption | string;
  orden: number; activo: boolean; permiteCantidad: boolean;
  cantidadMaxima: number; precioEspecial?: number | null;
}
export interface OptionGroup {
  _id: string; nombre: string; descripcion?: string;
  tipo: 'unico' | 'multiple'; obligatorio: boolean; minimo: number;
  maximo: number; activo: boolean; ingredientes: GroupIngredient[];
}
export interface ResolvedGroup {
  grupoId: string; nombre: string; descripcion?: string;
  tipo: 'unico' | 'multiple'; obligatorio: boolean; minimo: number;
  maximo: number; orden: number;
  ingredientes: Array<{ ingredienteId: string; nombre: string; descripcion?: string; precio: number; permiteCantidad: boolean; cantidadMaxima: number; orden: number }>;
}
export interface ProductConfiguration {
  productoId: string; tipoProducto: 'simple' | 'configurable'; grupos: ResolvedGroup[];
}
export interface SelectedIngredient {
  grupoId: string; ingredienteId: string; cantidad: number;
  grupoNombre?: string; ingredienteNombre?: string; precio?: number;
}
