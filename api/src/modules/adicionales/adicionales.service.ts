import { iAdicional, AdicionalModel } from './adicionales.model';
import { makeCrud } from '../../utils/crudFactory';

const crud = makeCrud(AdicionalModel);

// 🔥 Actualizamos la proyección de category a categories
const ACTIVE_SELECT = 'title price categories active';
const CATEGORY_POPULATE = 'name active';

export const viewAll = async (branchId: string): Promise<iAdicional[]> => {
  return await AdicionalModel.find({ branchId }).populate({ path: 'categories', select: CATEGORY_POPULATE, match: { branchId } });
};

export const viewActive = async (branchId: string): Promise<iAdicional[]> => {
  return await AdicionalModel.find({ branchId, active: true })
    .select(ACTIVE_SELECT)
    .populate({ path: 'categories', select: CATEGORY_POPULATE, match: { branchId } })
    .lean() as iAdicional[];
};

/**
 * 🔥 Trae los adicionales activos que correspondan a la categoría solicitada
 * O aquellos que apliquen a todas las categorías (array categories vacío)
 */
export const viewByCategory = async (branchId: string, categoryId: string): Promise<iAdicional[]> => {
  return await AdicionalModel.find({
    branchId,
    active: true,
    $or: [
      { categories: categoryId },          // Si el ID está incluido en el array
      { categories: { $size: 0 } }         // O si el array está vacío (Aplica a todas)
    ],
  })
    .select(ACTIVE_SELECT)
    .populate({ path: 'categories', select: CATEGORY_POPULATE, match: { branchId } })
    .lean() as iAdicional[];
};

export const viewById = async (branchId: string, id: string): Promise<iAdicional | null> => {
  return await AdicionalModel.findOne({ _id: id, branchId });
};

export const create = async (branchId: string, data: Partial<iAdicional>): Promise<iAdicional> => {
  const newAdicional = new AdicionalModel({ ...data, branchId });
  return await newAdicional.save();
};

export const modify = crud.modify;
export const toggleActive = crud.toggleActive;
export const deleteById = crud.deleteById;
