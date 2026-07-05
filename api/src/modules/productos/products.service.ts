import mongoose from 'mongoose';
import { iProducto, ProductModel } from './products.model';
import { CategoriaModel } from '../categorias/categorias.model';
import { makeCrud } from '../../utils/crudFactory';

const crud = makeCrud(ProductModel);

const isObjectId = (value: unknown): value is mongoose.Types.ObjectId | string =>
  typeof value === 'string'
    ? mongoose.Types.ObjectId.isValid(value)
    : value instanceof mongoose.Types.ObjectId;

const attachCategories = async (products: any[]) => {
  const categoryIds = products
    .map((product) => product.category)
    .filter(isObjectId)
    .map((category) => category.toString());

  const categories = await CategoriaModel.find({ _id: { $in: categoryIds } })
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

export const viewAll = async (): Promise<iProducto[]> => {
  const products = await ProductModel.find()
    .select('title description price image category active controlStock stock createdAt updatedAt')
    .lean();

  return await attachCategories(products) as iProducto[];
};

export const viewActive = async (): Promise<iProducto[]> => {
  const products = await ProductModel.find({ active: true })
    .select('title description price image category active controlStock stock')
    .lean();

  const withCategories = await attachCategories(products);
  return sortByCategory(withCategories) as iProducto[];
};

export const viewById = async (id: string): Promise<iProducto | null> => {
  return await ProductModel.findById(id);
};

export const create = async (data: Partial<iProducto>): Promise<iProducto> => {
  const newProduct = new ProductModel({
    ...data,
    active: data.active ?? true,
  });
  return await newProduct.save();
};

export const modify = crud.modify;
export const toggleActive = crud.toggleActive;
export const deleteById = crud.deleteById;
