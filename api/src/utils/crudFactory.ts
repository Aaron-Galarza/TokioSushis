import { Model, Document } from 'mongoose';

interface HasActive {
  active: boolean;
}

/** Genera modify/toggleActive/deleteById genéricos para modelos de catálogo con campo `active`. */
export function makeCrud<T extends Document & HasActive>(Model: Model<T>) {
  const modify = async (id: string, data: Partial<T>): Promise<T | null> => {
    return await Model.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  };

  const toggleActive = async (id: string): Promise<T | null> => {
    const doc = await Model.findById(id);
    if (!doc) return null;
    doc.active = !doc.active;
    return await doc.save();
  };

  const deleteById = async (id: string): Promise<T | null> => {
    return await Model.findByIdAndDelete(id);
  };

  return { modify, toggleActive, deleteById };
}
