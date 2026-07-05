import { iAdicional, AdicionalModel } from './adicionales.model';
import { makeCrud } from '../../utils/crudFactory';

const crud = makeCrud(AdicionalModel);

// 🔥 Actualizamos la proyección de category a categories
const ACTIVE_SELECT = 'title price categories active';
const CATEGORY_POPULATE = 'name active';

export const viewAll = async (): Promise<iAdicional[]> => {
  return await AdicionalModel.find().populate('categories', CATEGORY_POPULATE);
};

export const viewActive = async (): Promise<iAdicional[]> => {
  return await AdicionalModel.find({ active: true })
    .select(ACTIVE_SELECT)
    .populate('categories', CATEGORY_POPULATE)
    .lean() as iAdicional[];
};

/**
 * 🔥 Trae los adicionales activos que correspondan a la categoría solicitada
 * O aquellos que apliquen a todas las categorías (array categories vacío)
 */
export const viewByCategory = async (categoryId: string): Promise<iAdicional[]> => {
  return await AdicionalModel.find({
    active: true,
    $or: [
      { categories: categoryId },          // Si el ID está incluido en el array
      { categories: { $size: 0 } }         // O si el array está vacío (Aplica a todas)
    ],
  })
    .select(ACTIVE_SELECT)
    .populate('categories', CATEGORY_POPULATE)
    .lean() as iAdicional[];
};

export const viewById = async (id: string): Promise<iAdicional | null> => {
  return await AdicionalModel.findById(id);
};

export const create = async (data: Partial<iAdicional>): Promise<iAdicional> => {
  const newAdicional = new AdicionalModel(data);
  return await newAdicional.save();
};

export const modify = crud.modify;
export const toggleActive = crud.toggleActive;
export const deleteById = crud.deleteById;