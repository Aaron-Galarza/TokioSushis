export function formatWhatsAppLink(phone: string, order: any): string {
  if (!phone) return '#';
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10 && !cleanPhone.startsWith('54')) {
    cleanPhone = '54' + cleanPhone;
  }

  const customerName = order.customer?.name || 'amigo';
  const orderId = String(order.orderNumber || order._id?.slice(-4) || '0').padStart(4, '0');
  
  // Detalle de las piezas y productos con alta onda
  const itemsList = (order.items || [])
    .map((item: any) => {
      const title = item.title || 'Producto';
      const quantity = item.quantity || 1;
      
      // Mapear los adicionales si tiene
      const extras = (item.addons || [])
        .map((a: any) => `    ➕ ${a.quantity}x ${a.title}`)
        .join('\n');
        
      return `  • ${quantity}x ${title}${extras ? '\n' : ''}${extras}`;
    })
    .join('\n');

  // Si es delivery o retiro, le metemos el textito personalizado
  const isDelivery = order.deliveryType === 'delivery';
  const deliveryInfo = isDelivery
    ? `Modo: Delivery a domicilio\n Dirección: ${order.delivery?.address || 'A confirmar'}`
    : `Modo: Retiro por el local (¡Te esperamos!)`;

  // Notas o aclaraciones del cliente
  const notesInfo = order.notes 
    ? `Nota que nos dejaste: "${order.notes}"`
    : 'Sin notas ni aclaraciones adicionales.';

  const text = `¡Hola ${customerName}! Desde Tokyo Sushis queremos confirmar tu pedido #${orderId}.

Tu pedido:
${itemsList}

${deliveryInfo}
${notesInfo}

¿Está todo perfecto o te gustaría realizar algun cambio? ¡Avisanos y lo dejamos exacto a tu gusto! `;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function formatOrderReadyWhatsAppLink(phone: string, order: any): string {
  if (!phone) return '#';
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10 && !cleanPhone.startsWith('54')) {
    cleanPhone = '54' + cleanPhone;
  }

  const customerName = order.customer?.name || 'amigo';
  const orderId = String(order.orderNumber || order._id?.slice(-4) || '0').padStart(4, '0');
  const isDelivery = order.deliveryType === 'delivery';

  // Mensaje para cuando el pedido ya está terminado
  const text = `¡Hola ${customerName}!Tu pedido #${orderId} de Tokyo Sushis ya está listo.\n\n${
    isDelivery
      ? 'El repartidor ya lo tiene y va en camino hacia tu domicilio. ¡Avisanos cuando te llegue!'
      : 'Ya podés pasar por el local a retirarlo. ¡Te esperamos!'
  }`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}