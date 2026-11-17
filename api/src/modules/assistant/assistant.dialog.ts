import { OperationName, operationErrors } from './assistant.operations';

export const greeting = '¡Hola! Puedo consultar datos de Tokyo y preparar cambios para que los confirmes. Por ejemplo: «¿cuál es el producto más caro?» o «prepará un producto de prueba». ¿Qué necesitás?';
export const help = 'Puedo consultar productos, categorías, cupones, pedidos, ventas y envíos, o preparar cambios para tu confirmación. Contame qué querés saber o hacer.';

export const isGreeting = (message: string) => /^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|holi)[!.\s]*$/i
  .test(message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());

export const missingFieldsMessage = (name: OperationName, input: Record<string, unknown>) => {
  if (name === 'products.create') {
    const missing = [
      !input.title && 'nombre',
      input.price === undefined && 'precio',
      !input.description && 'descripción',
      !input.category && 'categoría',
    ].filter(Boolean);
    if (missing.length) return `Claro. Para preparar el producto necesito ${missing.join(', ')}. También podés decirme «creá uno de ejemplo» y elegiré datos de prueba y una categoría activa. No crearé nada sin mostrarte la propuesta.`;
  }
  if (name === 'coupons.create') {
    const missing = [!input.code && 'código', input.discountPercent === undefined && 'porcentaje'].filter(Boolean);
    if (missing.length) return `Para preparar el cupón necesito ${missing.join(' y ')}. Después te mostraré la propuesta para confirmar.`;
  }
  return `Necesito corregir estos datos antes de continuar: ${operationErrors(name, input).join('; ')}.`;
};
