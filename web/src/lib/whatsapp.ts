import { Order } from '@/types/order';
import { formatPrice } from './format';


export const buildWhatsappOrderLink = (order: Order, storePhone: string): string => {
  // 1. Armamos el string usando solo caracteres estándar y formato de WhatsApp (*negrita*)
  let text = `*NUEVO PEDIDO - AMERICAN WAY*\n\n`;
  
  text += `*Cliente:* ${order.customer.name}\n`;
  text += `*Teléfono:* ${order.customer.phone}\n\n`;

  text += `*MI ORDEN:*\n`;
  order.items.forEach((item) => {
    // Producto base con guion
    text += `- ${item.quantity}x ${item.product.title}\n`;
    
    // Adicionales tabulados con el signo más
    if (item.addons && item.addons.length > 0) {
      item.addons.forEach(cartAddon => {
        text += `   + ${cartAddon.quantity}x ${cartAddon.addon.name}\n`;
      });
    }
  });

  text += `\n*Retiro/Envío:* ${order.deliveryType === 'delivery' ? 'Delivery' : 'Retiro por local'}\n`;
  
  if (order.deliveryType === 'delivery' && order.delivery?.address) {
    text += `*Dirección:* ${order.delivery.address}\n`;
  }

  // Mapeamos los métodos de pago a español legible
  const paymentMethods = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    mercadopago: 'Mercado Pago'
  };
  text += `*Medio de pago:* ${paymentMethods[order.paymentMethod]}\n\n`;

  text += `*TOTAL: ${formatPrice(order.total)}*\n`;

  // 2. Codificamos el texto de forma segura para URLs
  const encodedText = encodeURIComponent(text);
  
  // 3. Limpiamos el número de teléfono
  const cleanPhone = storePhone.replace(/\D/g, '');

  // 4. Retornamos la URL
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};