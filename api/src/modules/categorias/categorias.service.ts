import { iCategoria, CategoriaModel } from './categorias.model';
import { makeCrud } from '../../utils/crudFactory';

const crud = makeCrud(CategoriaModel);

export const viewAll = async (): Promise<iCategoria[]> => {
  return await CategoriaModel.find().sort({ order: 1, name: 1 });
};

export const viewActive = async (): Promise<iCategoria[]> => {
  return await CategoriaModel.find({ active: true })
    .select('_id name order active icon')
    .sort({ order: 1, name: 1 })
    .lean();
};

export const findById = async (id: string): Promise<iCategoria | null> => {
  return await CategoriaModel.findById(id);
};

export const create = async (data: Partial<iCategoria>): Promise<iCategoria> => {
  const newCategoria = new CategoriaModel(data);
  return await newCategoria.save();
};

export const modify = crud.modify;
export const toggleActive = crud.toggleActive;
export const deleteById = crud.deleteById;
