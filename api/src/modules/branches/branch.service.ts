import { BranchModel } from './branch.model';

export const findActiveBranchBySlug = async (slug: string) => {
  return BranchModel.findOne({ slug, active: true })
    .select('name slug address coordinates timezone phone whatsappPhone')
    .lean();
};
