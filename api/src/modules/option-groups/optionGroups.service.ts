import { z } from 'zod';
import { AppError } from '../../utils/AppError';
import { ProductModel } from '../productos/products.model';
import { OptionModel } from '../options/options.model';
import { OptionGroupModel } from './optionGroups.model';
import { groupSchema } from './optionGroups.schema';

type GroupInput = z.infer<typeof groupSchema>;
const populated = { path: 'ingredientes.ingrediente', select: 'nombre descripcion precio activo disponible orden' };

async function checkIngredients(ids: string[]) {
  const found = await OptionModel.countDocuments({ _id: { $in: ids } });
  if (found !== ids.length) throw new AppError(400, 'Uno o más ingredientes no existen');
}

export const listGroups = (activeOnly = false) =>
  OptionGroupModel.find(activeOnly ? { activo: true } : {}).populate(populated).sort({ nombre: 1 });

export const createGroup = async (data: GroupInput) => {
  await checkIngredients(data.ingredientes.map(item => item.ingrediente));
  return OptionGroupModel.create(data);
};

export const updateGroup = async (id: string, data: Partial<GroupInput>) => {
  const existing = await OptionGroupModel.findById(id);
  if (!existing) return null;
  const current = existing.toObject();
  const parsed = groupSchema.safeParse({
    ...current, ...data,
    ingredientes: data.ingredientes ?? current.ingredientes.map(item => ({
      ingrediente: String(item.ingrediente), orden: item.orden,
      activo: item.activo, permiteCantidad: item.permiteCantidad,
      cantidadMaxima: item.cantidadMaxima, precioEspecial: item.precioEspecial,
    })),
  });
  if (!parsed.success) throw new AppError(400, parsed.error.issues[0]?.message ?? 'Grupo inválido');
  await checkIngredients(parsed.data.ingredientes.map(item => item.ingrediente));
  existing.set(parsed.data);
  return existing.save();
};

export const toggleGroup = async (id: string) => {
  const group = await OptionGroupModel.findById(id);
  if (!group) return null;
  group.activo = !group.activo;
  return group.save();
};

export const deleteGroup = async (id: string) => {
  if (await ProductModel.exists({ 'gruposOpciones.grupo': id })) {
    throw new AppError(409, 'El grupo pertenece a un producto; quitá esa asociación antes de eliminarlo');
  }
  return OptionGroupModel.findByIdAndDelete(id);
};
