import mongoose from 'mongoose';
import { iProducto, ProductModel } from './products.model';
import { CategoriaModel } from '../categorias/categorias.model';

const isObjectId = (value: unknown): value is mongoose.Types.ObjectId | string =>
  typeof value === 'string'
    ? mongoose.Types.ObjectId.isValid(value)
    : value instanceof mongoose.Types.ObjectId;

const attachCategories = async (branchId: string, products: any[]) => {
  const categoryIds = products
    .map((product) => product.category)
    .filter(isObjectId)
    .map((category) => category.toString());

  const categories = await CategoriaModel.find({ _id: { $in: categoryIds }, branchId })
    .select('name active order')
    .lean();

  const categoryMap = new Map(categories.map((category) => [category._id.toString(), category]));

  return products.map((product) => {
    const rawCategory = product.category;
    const category =
      isObjectId(rawCategory)
        ? categoryMap.get(rawCategory.toString()) ?? rawCategory
        : { _id: null, name: rawCategory, active: true, order: 0 };

    return { ...product, category };
  });
};

const sortByCategory = (products: any[]) =>
  products.sort((a: any, b: any) => (a.category?.order ?? 0) - (b.category?.order ?? 0));

export const viewAll = async (branchId: string): Promise<iProducto[]> => {
  const products = await ProductModel.find({ branchId, deleted: { $ne: true } })
    .select('title description price image category active controlStock stock configurator createdAt updatedAt')
    .lean();

  return await attachCategories(branchId, products) as iProducto[];
};

export const viewActive = async (branchId: string): Promise<iProducto[]> => {
  const products = await ProductModel.find({ branchId, active: true, deleted: { $ne: true } })
    .select('title description price image category active controlStock stock configurator')
    .lean();

  const withCategories = await attachCategories(branchId, products);
  return sortByCategory(withCategories.filter((product) =>
    typeof product.category === 'object' && product.category?.active === true)) as iProducto[];
};

export const viewById = async (branchId: string, id: string): Promise<iProducto | null> => {
  return await ProductModel.findOne({ _id: id, branchId, deleted: { $ne: true } });
};

export const create = async (branchId: string, data: Partial<iProducto>): Promise<iProducto> => {
  const newProduct = new ProductModel({
    ...data,
    branchId,
    active: data.active ?? true,
  });
  return await newProduct.save();
};

export const modify = async (branchId: string, id: string, data: Partial<iProducto>): Promise<iProducto | null> => {
  const safeData = { ...data };
  delete (safeData as Record<string, unknown>).branchId;
  delete (safeData as Record<string, unknown>).deleted;
  return ProductModel.findOneAndUpdate({ _id: id, branchId, deleted: { $ne: true } },
    { $set: safeData }, { returnDocument: 'after', runValidators: true });
};
export const setStock = async (branchId: string, id: string, stock: number): Promise<iProducto | null> =>
  ProductModel.findOneAndUpdate({ _id: id, branchId, deleted: { $ne: true } }, { $set: { stock } }, { returnDocument: 'after', runValidators: true });
export const toggleActive = async (branchId: string, id: string): Promise<iProducto | null> => {
  const product = await ProductModel.findOne({ _id: id, branchId, deleted: { $ne: true } });
  if (!product) return null;
  product.active = !product.active;
  return product.save();
};
export const deleteById = async (branchId: string, id: string): Promise<iProducto | null> =>
  ProductModel.findOneAndUpdate({ _id: id, branchId, deleted: { $ne: true } },
    { $set: { deleted: true, active: false } }, { returnDocument: 'after' });
