import { TRANSFER_INFO } from '@/constants/admin';
import { formatOrderNumber } from '@/lib/format';

export const generateComandaHTML = (order: any): string => {
  const num = formatOrderNumber(order);
  const dt = new Date(order.createdAt);
  
  const deliveryLabel = order.deliveryType === 'delivery' ? 'DELIVERY' : 'RETIRO LOCAL';
  
  // 💳 Lógica de mapeo extendida con aclaración de terminales
  let paymentLabel = 'Mercado Pago';
  if (order.paymentMethod === 'cash') {
    paymentLabel = 'Efectivo';
  } else if (order.paymentMethod === 'transfer' || order.paymentMethod === 'transferencia') {
    paymentLabel = 'Transferencia';
  } else if (order.paymentMethod === 'debito') {
    paymentLabel = 'Débito (POSNET)';
  } else if (order.paymentMethod === 'credito') {
    paymentLabel = order.deliveryType === 'delivery' ? 'Crédito (LINK DE PAGO)' : 'Crédito (POSNET)';
  } else if (order.paymentMethod) {
    paymentLabel = order.paymentMethod; // Respeta etiquetas ya parseadas
  }

  const orderDate = dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const orderTime = dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

  const itemsHtml = order.items?.map((item: any) => `
    <div style="margin-bottom: 8px; font-size: 1.1em;">
      <strong>${item.quantity}x ${item.title}</strong>
      ${item.addons && item.addons.length > 0 ? `
        <ul style="list-style: none; padding-left: 12px; margin: 3px 0; color: #444; font-size: 0.9em;">
          ${item.addons.map((a: any) => `<li>&#8627; ${a.quantity}x ${a.title || a.name}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `).join('') || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>por AFdevelopers</title>
      <style>
        body { 
          font-family: 'Courier New', Courier, monospace; 
          font-size: 13px; 
          line-height: 1.3; 
          margin: 0; 
          padding: 4px; 
          color: #000;
        }
        .ticket { 
          width: 280px; 
          margin: 0 auto; 
        }
        .header { text-align: center; margin-bottom: 8px; }
        .header h3 { margin: 0 0 4px 0; font-size: 1.4em; letter-spacing: 1px; }
        .header p { margin: 2px 0; font-size: 0.9em; }
        .separator { border-top: 1px dashed #000; margin: 8px 0; }
        .details p { margin: 4px 0; font-weight: bold; }
        .notes-box { 
          background: #f0f0f0; 
          border: 1px solid #000; 
          padding: 6px; 
          margin-top: 6px; 
          font-family: sans-serif; 
          font-size: 0.95em; 
        }
        .products { margin: 8px 0; }
        .totals { text-align: right; margin-top: 8px; }
        .totals p { margin: 3px 0; }
      </style>
    </head>
    <body>
      <div class="ticket">
        <div class="header">
          <h3>TOKYO SUSHIS</h3>
          <p>Resistencia, Chaco</p>
          <p><strong>#${num}</strong></p>
        </div>
        <div class="separator"></div>
        <div class="details">
          <p>Fecha: ${orderDate} | Hora: ${orderTime}</p>
          <p>Tipo: ${deliveryLabel}</p>
          <p>Cliente: ${order.customer?.name || 'Cliente'}</p>
          <p>Teléfono: ${order.customer?.phone || '-'}</p>
          ${order.delivery?.address ? `<p>Dirección: ${order.delivery.address}</p>` : ''}
          ${order.notes ? `<div class="notes-box"><strong>NOTAS:</strong> ${order.notes}</div>` : ''}
        </div>
        <div class="separator"></div>
        <div class="products">
          ${itemsHtml}
        </div>
        <div class="separator"></div>
        <div class="totals">
          <p>Subtotal: $${order.subtotal?.toLocaleString('es-AR') || '0'}</p>
          ${order.deliveryCost > 0 ? `<p>Envío: $${order.deliveryCost.toLocaleString('es-AR')}</p>` : ''}
          ${order.discount > 0 ? `<p>Descuento: -$${order.discount.toLocaleString('es-AR')}</p>` : order.couponCode ? `<p>Cupón (${order.discountPercent}%): -$${((order.subtotal * order.discountPercent) / 100).toLocaleString('es-AR')}</p>` : ''}
          
          <!-- 💳 FILA DE RECARGO EN COMANDA -->
          ${order.surcharge > 0 ? `<p>Recargo Tarjeta (15%): +$${order.surcharge.toLocaleString('es-AR')}</p>` : ''}
          
          <p style="font-size: 1.2em; font-weight: bold; margin-top: 4px;">TOTAL: $${order.total?.toLocaleString('es-AR') || '0'}</p>
          <div class="separator" style="margin: 4px 0 2px 0;"></div>
          <p style="font-size: 1em; font-weight: bold; margin-top: 4px; text-align: center; text-transform: uppercase;">Pago: ${paymentLabel}</p>
          ${order.paymentMethod === 'transferencia' ? `<p style="font-size: 0.85em; text-align: center; margin-top: 2px;">(${TRANSFER_INFO.alias} — ${TRANSFER_INFO.holder})</p>` : ''}
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
};