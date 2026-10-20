import { Model, Document } from 'mongoose';

interface HasActive {
  active: boolean;
}

/** Genera modify/toggleActive/deleteById genéricos para modelos de catálogo con campo `active`. */
export function makeCrud<T extends Document & HasActive>(Model: Model<T>) {
  const modify = async (branchId: string, id: string, data: Partial<T>): Promise<T | null> => {
    const safeData = { ...data };
    delete (safeData as Record<string, unknown>).branchId;
    return await Model.findOneAndUpdate({ _id: id, branchId }, { $set: safeData }, { new: true, runValidators: true });
  };

  const toggleActive = async (branchId: string, id: string): Promise<T | null> => {
    const doc = await Model.findOne({ _id: id, branchId });
    if (!doc) return null;
    doc.active = !doc.active;
    return await doc.save();
  };

  const deleteById = async (branchId: string, id: string): Promise<T | null> => {
    return await Model.findOneAndDelete({ _id: id, branchId });
  };

  return { modify, toggleActive, deleteById };
}
