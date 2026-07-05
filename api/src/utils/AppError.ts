export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message)
    this.name = 'AppError'
  }
}

/** Mensaje amigable para AppError: oculta detalles técnicos de un 503 (servicio externo caído). */
export const friendlyAppErrorMessage = (error: AppError): string =>
  error.statusCode === 503 ? 'No pudimos calcular el envio en este momento' : error.message;
