import { AppError } from '../../utils/AppError';
import { OptionGroupModel } from '../option-groups/optionGroups.model';
import { OptionModel } from './options.model';

export const listOptions = (activeOnly = false) =>
  OptionModel.find(activeOnly ? { activo: true } : {}).sort({ orden: 1, nombre: 1 });

export const createOption = (data: Record<string, unknown>) => OptionModel.create(data);

export const updateOption = (id: string, data: Record<string, unknown>) =>
  OptionModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true });

export const toggleOption = async (id: string) => {
  const option = await OptionModel.findById(id);
  if (!option) return null;
  option.activo = !option.activo;
  return option.save();
};

export const deleteOption = async (id: string) => {
  if (await OptionGroupModel.exists({ 'ingredientes.ingrediente': id })) {
    throw new AppError(409, 'El ingrediente pertenece a un grupo; quitá esa asociación antes de eliminarlo');
  }
  return OptionModel.findByIdAndDelete(id);
};
