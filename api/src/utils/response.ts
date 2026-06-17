import { Response } from "express";

interface ApiResponse<T = any> { // <<--- Interface generica para las respuestas de la api
    success: boolean
    data?: T
    error?: string 

}

//Respuesta positiva (200,201,etc)
export const sendSucces = (res: Response, data: any, statusCode: number = 200) => {
    const response: ApiResponse = {
        success: true,
        data

    }
    return res.status(statusCode).json(response)
}

//Respuestas negativas (400, 404, 500, etc)
export const sendError = (res: Response, message: string, statusCode: number = 400) => {
    const response: ApiResponse = {
        success: false,
        error: message
    }
    return res.status(statusCode).json(response)
}