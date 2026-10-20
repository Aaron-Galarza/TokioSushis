import { BranchModel } from './branch.model';

export const findActiveBranchBySlug = async (slug: string) => {
  return BranchModel.findOne({ slug, active: true })
    .select('name slug address coordinates timezone phone whatsappPhone')
    .lean();
};

export const listActiveBranches = async () =>
  BranchModel.find({ active: true }).select('name slug address').sort({ name: 1 }).lean();
