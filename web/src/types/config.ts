export interface SystemConfig {
  isOpen: boolean; // Controlar el cierre/apertura del local con un botón
  scheduleText: string; // Ejemplo: "Martes a Domingos de 19:00 a 00:00"
  baseDeliveryCost: number;
  minOrderAmount: number;
  whatsappNumber: string; // Número a donde se envían las copias de los pedidos
  noticeMessage?: string;
 } 

export interface StoreStatus {
  isOpen: boolean;
  message?: string;
pricePerKm: number
}