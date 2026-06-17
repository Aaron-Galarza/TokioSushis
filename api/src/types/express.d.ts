import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload; // Aquí definís que 'user' es opcional y puede ser el payload del JWT
    }
  }
}