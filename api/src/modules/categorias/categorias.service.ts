import { iCategoria, CategoriaModel } from './categorias.model';
import { makeCrud } from '../../utils/crudFactory';
import { ProductModel } from '../productos/products.model';
import { AdicionalModel } from '../adicionales/adicionales.model';
import { AppError } from '../../utils/AppError';

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
export const deleteById = async (branchId: string, id: string): Promise<iCategoria | null> => {
  const [product, addon] = await Promise.all([
    ProductModel.exists({ branchId, category: id, deleted: { $ne: true } }),
    AdicionalModel.exists({ branchId, categories: id }),
  ]);
  if (product || addon) throw new AppError(409, 'La categoría tiene productos o adicionales asociados');
  return crud.deleteById(branchId, id);
};
