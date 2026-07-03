function getFriendlyPaymentMethod(method: string, deliveryType: string): string {
  const payLabels: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    debito: 'Débito (POSNET)',
    credito: deliveryType === 'delivery' ? 'Crédito (LINK DE PAGO)' : 'Crédito (POSNET)',
  };
  return payLabels[method] || method || 'A confirmar';
}

export function formatWhatsAppLink(phone: string, order: any): string {
  if (!phone) return '#';
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10 && !cleanPhone.startsWith('54')) {
    cleanPhone = '54' + cleanPhone;
  }

  const customerName = order.customer?.name || 'Cliente';
  const orderId = String(order.orderNumber || order._id?.slice(-4) || '0').padStart(4, '0');
  
  const itemsList = (order.items || [])
    .map((item: any) => {
      const title = item.title || 'Producto';
      const quantity = item.quantity || 1;
      const extras = (item.addons || [])
        .map((a: any) => `    + ${a.quantity}x ${a.title || a.name}`)
        .join('\n');
        
      return `  - ${quantity}x ${title}${extras ? '\n' : ''}${extras}`;
    })
    .join('\n');

  const isDelivery = order.deliveryType === 'delivery';
  const deliveryInfo = isDelivery
    ? `Modo: Delivery a domicilio\nDirección: ${order.delivery?.address || 'A confirmar'}`
    : `Modo: Retiro por el local`;

  const notesInfo = order.notes 
    ? `Nota: "${order.notes}"`
    : 'Sin notas ni aclaraciones adicionales.';

  const paymentLabel = getFriendlyPaymentMethod(order.paymentMethod, order.deliveryType);

  let financialBreakdown = `Total a abonar: $${order.total?.toLocaleString('es-AR')}`;
  if (order.surcharge > 0 || order.discount > 0 || order.deliveryCost > 0) {
    financialBreakdown = `Detalle de cuentas:\n` +
      `  - Subtotal: $${order.subtotal?.toLocaleString('es-AR')}\n` +
      (order.discount > 0 ? `  - Descuento: -$${order.discount.toLocaleString('es-AR')}\n` : '') +
      (order.deliveryCost > 0 ? `  - Costo de envío: $${order.deliveryCost.toLocaleString('es-AR')}\n` : '') +
      (order.surcharge > 0 ? `  - Recargo Crédito (15%): +$${order.surcharge.toLocaleString('es-AR')}\n` : '') +
      `  Total Final: $${order.total?.toLocaleString('es-AR')}`;
  }

  const text = `¡Hola ${customerName}! Desde Tokyo Sushis queremos confirmar tu pedido #${orderId}.

Tu pedido:
${itemsList}

${deliveryInfo}
Forma de Pago: ${paymentLabel}
${notesInfo}

${financialBreakdown}

¿Está todo perfecto o te gustaría realizar algún cambio? Avisanos y lo dejamos exacto a tu gusto.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function formatOrderReadyWhatsAppLink(phone: string, order: any): string {
  if (!phone) return '#';
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length === 10 && !cleanPhone.startsWith('54')) {
    cleanPhone = '54' + cleanPhone;
  }

  const customerName = order.customer?.name || 'Cliente';
  const orderId = String(order.orderNumber || order._id?.slice(-4) || '0').padStart(4, '0');
  const isDelivery = order.deliveryType === 'delivery';
  const paymentLabel = getFriendlyPaymentMethod(order.paymentMethod, order.deliveryType);

  let actionReminder = isDelivery
    ? 'El repartidor ya lo tiene y va en camino hacia tu domicilio. Avisanos cuando te llegue.'
    : 'Ya podés pasar por el local a retirarlo.';

  if (order.paymentMethod === 'credito' && isDelivery) {
    actionReminder += `\n\nRecordatorio: Te estaremos enviando el Link de Pago para que puedas procesar el abonado con tarjeta de crédito de forma segura.`;
  }

  const text = `¡Hola ${customerName}! Tu pedido #${orderId} de Tokyo Sushis ya está listo.

${actionReminder}

Forma de Pago: ${paymentLabel}
Monto a abonar: $${order.total?.toLocaleString('es-AR')}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}