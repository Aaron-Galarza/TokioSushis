import { iCategoria, CategoriaModel } from './categorias.model';

export const viewAll = async (): Promise<iCategoria[]> => {
  return await CategoriaModel.find().sort({ order: 1, name: 1 });
};

export const viewActive = async (): Promise<iCategoria[]> => {
  return await CategoriaModel.find({ active: true })
    .select('_id name order active')
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

export const modify = async (id: string, data: Partial<iCategoria>): Promise<iCategoria | null> => {
  return await CategoriaModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  );
};

export const toggleActive = async (id: string): Promise<iCategoria | null> => {
  const categoria = await CategoriaModel.findById(id);
  if (!categoria) return null;

  categoria.active = !categoria.active;
  return await categoria.save();
};

export const deleteById = async (id: string): Promise<iCategoria | null> => {
  return await CategoriaModel.findByIdAndDelete(id);
};
