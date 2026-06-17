import { iAdicional, AdicionalModel } from './adicionales.model';

const ACTIVE_SELECT = 'title price category active';
const CATEGORY_POPULATE = 'name active';

export const viewAll = async (): Promise<iAdicional[]> => {
  return await AdicionalModel.find().populate('category', CATEGORY_POPULATE);
};

// Returns all active adicionales (admin / no filter context)
export const viewActive = async (): Promise<iAdicional[]> => {
  return await AdicionalModel.find({ active: true })
    .select(ACTIVE_SELECT)
    .populate('category', CATEGORY_POPULATE)
    .lean() as iAdicional[];
};

// Returns adicionales that belong to a specific category OR apply to all (category: null)
export const viewByCategory = async (categoryId: string): Promise<iAdicional[]> => {
  return await AdicionalModel.find({
    active: true,
    $or: [{ category: categoryId }, { category: null }],
  })
    .select(ACTIVE_SELECT)
    .populate('category', CATEGORY_POPULATE)
    .lean() as iAdicional[];
};

export const viewById = async (id: string): Promise<iAdicional | null> => {
  return await AdicionalModel.findById(id);
};

export const create = async (data: Partial<iAdicional>): Promise<iAdicional> => {
  const newAdicional = new AdicionalModel(data);
  return await newAdicional.save();
};

export const modify = async (id: string, data: Partial<iAdicional>): Promise<iAdicional | null> => {
  return await AdicionalModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true },
  );
};

export const toggleActive = async (id: string): Promise<iAdicional | null> => {
  const adicional = await AdicionalModel.findById(id);
  if (!adicional) return null;

  adicional.active = !adicional.active;
  return await adicional.save();
};

export const deleteById = async (id: string): Promise<iAdicional | null> => {
  return await AdicionalModel.findByIdAndDelete(id);
};
