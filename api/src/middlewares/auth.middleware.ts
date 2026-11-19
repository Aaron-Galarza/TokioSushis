import { Response, Request, NextFunction } from "express";
import { validateAdminToken } from '../modules/users/admin-session'
import { sendError } from "../utils/response";

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {

    const authHeader = req.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
        return sendError(res, 'Acceso denegado. No autorizado', 401)
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = await validateAdminToken(token)
        if (!decoded) return sendError(res, 'Sesión inválida o expirada', 401)
        res.set('Cache-Control', 'private, no-store')
        req.user = decoded
        next()
    } catch (error) {
        next(error)
    }

}

