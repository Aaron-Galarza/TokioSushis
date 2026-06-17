import { z } from 'zod';

export const calculateDeliverySchema = z.object({
  lat: z.number({ message: 'lat debe ser un numero' }).min(-90).max(90),
  lng: z.number({ message: 'lng debe ser un numero' }).min(-180).max(180),
});
