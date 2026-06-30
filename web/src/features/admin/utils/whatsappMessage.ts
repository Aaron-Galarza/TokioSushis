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
    ? `🛵 Modo: Delivery a domicilio\n📍 Dirección: ${order.delivery?.address || 'A confirmar'}`
    : `🛍️ Modo: Retiro por el local (¡Te esperamos!)`;

  // Notas o aclaraciones del cliente
  const notesInfo = order.notes 
    ? `📝 Nota que nos dejaste: "${order.notes}"`
    : '✨ Sin notas ni aclaraciones adicionales.';

  // Mensaje súper simpático, humano, re piola y sushesco 🍣
  const text = `¡Hola ${customerName}! ¡Buenas noches! 🙌 Te escribimos de acá de TokyoSushis 🍣🥢 por tu pedido voluntario número #${orderId}.

Queríamos chequear con vos que esté todo súper bien y tal cual lo armaste antes de que los chicos lo metan a la cocina, así te llega impecable:

🥢 Tu pedido:
${itemsList}

${deliveryInfo}
${notesInfo}

¿Está todo perfecto o te gustaría hacer algún cambio de último momento en las piezas, sumar algún adicional o corregir algo? 🤔 ¡Avisanos y lo dejamos exacto a tu gusto! 

¡Muchas gracias por elegirnos y que disfrutes de tu noche! 🍱✨`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}