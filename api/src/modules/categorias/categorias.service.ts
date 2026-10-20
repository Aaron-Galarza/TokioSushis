import { iCategoria, CategoriaModel } from './categorias.model';
import { makeCrud } from '../../utils/crudFactory';

const crud = makeCrud(CategoriaModel);

export const viewAll = async (branchId: string): Promise<iCategoria[]> => {
  return await CategoriaModel.find({ branchId }).sort({ order: 1, name: 1 });
};

export const viewActive = async (branchId: string): Promise<iCategoria[]> => {
  return await CategoriaModel.find({ branchId, active: true })
    .select('_id name order active icon')
    .sort({ order: 1, name: 1 })
    .lean();
};

export const findById = async (branchId: string, id: string): Promise<iCategoria | null> => {
  return await CategoriaModel.findOne({ _id: id, branchId });
};

export const create = async (branchId: string, data: Partial<iCategoria>): Promise<iCategoria> => {
  const newCategoria = new CategoriaModel({ ...data, branchId });
  return await newCategoria.save();
};

export const modify = crud.modify;
export const toggleActive = crud.toggleActive;
export const deleteById = crud.deleteById;
