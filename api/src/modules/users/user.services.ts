import { iUser, UserModel } from './user.model'

export const findByEmail = async (email: string): Promise<iUser | null> => {
  return await UserModel.findOne({ email: email.toLowerCase() })
}
