import { Response, Request, NextFunction } from "express";
import * as jwt from 'jsonwebtoken'
import { sendError } from "../utils/response";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {

    const JWT_SECRET = process.env.JWT_SECRET 

    if (!JWT_SECRET) {
        return sendError(res, 'Error interno: Falta Configuracion de seguridad', 500)
    }

    const authHeader = req.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return sendError(res, 'Acceso denegado. No autorizado', 401)
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
        req.user = decoded
        next()
    } catch (error) {
        return sendError(res, 'Token invalido o expirado', 403)
    }

}

