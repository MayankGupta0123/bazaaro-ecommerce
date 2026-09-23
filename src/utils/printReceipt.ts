import { Order } from '../types';
import { formatINR } from './format';

/**
 * Generates clean, standalone HTML for an official Bazaaro Tax Invoice & Receipt
 * formatted specifically for 1-page A4 printing and PDF saving.
 */
function generateReceiptHtml(order: Order): string {
  const invoiceNumber = `INV-${order.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const orderDate = order.date || new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsRows = order.items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; text-align: center; color: #64748b; font-size: 12px;">${idx + 1}</td>
        <td style="padding: 10px 8px;">
          <div style="font-weight: 600; color: #0f172a; font-size: 13px;">${escapeHtml(item.product.name)}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Brand: ${escapeHtml(item.product.brand || 'Bazaaro')}</div>
        </td>
        <td style="padding: 10px 8px; text-align: center; font-weight: 600; color: #0f172a; font-size: 13px;">${item.quantity}</td>
        <td style="padding: 10px 8px; text-align: right; color: #334155; font-size: 13px;">${formatINR(item.product.price)}</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 600; color: #0f172a; font-size: 13px;">${formatINR(item.product.price * item.quantity)}</td>
      </tr>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Receipt - ${order.id}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 20px;
      font-size: 13px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .brand-title span {
      color: #f59e0b;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .info-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
    }
    .info-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
    }
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-table {
      width: 280px;
      border-collapse: collapse;
    }
    .totals-table td {
      padding: 6px 8px;
      font-size: 12px;
    }
    .totals-table .grand-total {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      border-top: 2px solid #0f172a;
      border-bottom: 2px solid #0f172a;
      padding-top: 10px;
      padding-bottom: 10px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      text-align: center;
      color: #64748b;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-title">BAZAAR<span>O</span></div>
        <div style="font-size: 12px; color: #475569; margin-top: 2px;">India's Premier Electronics Bazaar</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">GSTIN: 07AAACB2026B1Z8 &bull; support@bazaaro.in</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">TAX INVOICE</div>
        <div style="font-size: 12px; font-family: monospace; color: #475569; margin-top: 3px;"># ${invoiceNumber}</div>
        <div style="margin-top: 6px;">
          <span class="badge">${order.paymentStatus === 'paid' ? 'PAID & CONFIRMED' : 'ORDER CONFIRMED'}</span>
        </div>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="section-grid">
      <!-- Order & Payment Info -->
      <div class="info-box">
        <div class="info-title">Order & Payment Details</div>
        <div style="margin-bottom: 4px;"><strong>Order ID:</strong> <span style="font-family: monospace;">${escapeHtml(order.id)}</span></div>
        <div style="margin-bottom: 4px;"><strong>Date:</strong> ${orderDate}</div>
        <div style="margin-bottom: 4px;"><strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod || 'ZapUPI Gateway')}</div>
        ${order.paymentId ? `<div><strong>Payment Ref:</strong> <span style="font-family: monospace;">${escapeHtml(order.paymentId)}</span></div>` : ''}
        ${order.utr ? `<div style="margin-top: 4px;"><strong>Bank UTR:</strong> <span style="font-family: monospace;">${escapeHtml(order.utr)}</span></div>` : ''}
      </div>

      <!-- Shipping Info -->
      <div class="info-box">
        <div class="info-title">Deliver To</div>
        <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${escapeHtml(order.address?.fullName || 'Customer')}</div>
        <div style="color: #475569; font-size: 12px; margin-bottom: 2px;">${escapeHtml(order.address?.street || '')}</div>
        <div style="color: #475569; font-size: 12px; margin-bottom: 4px;">${escapeHtml(order.address?.city || '')}, ${escapeHtml(order.address?.state || '')} - ${escapeHtml(order.address?.pincode || '')}</div>
        <div style="font-size: 12px; color: #0f172a; margin-top: 4px;"><strong>Phone:</strong> +91 ${escapeHtml(order.address?.phone || '')}</div>
        <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 4px;">
          Partner: ${escapeHtml(order.courier || 'BlueDart Express')} &bull; ETA: ${escapeHtml(order.estimatedDeliveryDate || '24-48 Hours')}
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th style="text-align: left;">Product Details</th>
          <th style="width: 60px; text-align: center;">Qty</th>
          <th style="width: 100px; text-align: right;">Unit Price</th>
          <th style="width: 110px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Totals Section -->
    <div class="totals-area">
      <table class="totals-table">
        <tr>
          <td style="color: #64748b;">Subtotal (MRP):</td>
          <td style="text-align: right; font-weight: 600;">${formatINR(order.subtotal)}</td>
        </tr>
        ${order.discount ? `
        <tr>
          <td style="color: #059669;">Store Discount:</td>
          <td style="text-align: right; color: #059669; font-weight: 600;">-${formatINR(order.discount)}</td>
        </tr>` : ''}
        ${order.couponDiscount ? `
        <tr>
          <td style="color: #059669;">Coupon (${escapeHtml(order.couponCode || 'PROMO')}):</td>
          <td style="text-align: right; color: #059669; font-weight: 600;">-${formatINR(order.couponDiscount)}</td>
        </tr>` : ''}
        <tr>
          <td style="color: #64748b;">Shipping Fee:</td>
          <td style="text-align: right; font-weight: 600;">${order.deliveryFee > 0 ? formatINR(order.deliveryFee) : '<span style="color:#059669;">FREE</span>'}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-size: 11px;">Includes 18% GST:</td>
          <td style="text-align: right; color: #64748b; font-size: 11px;">${formatINR(order.gstAmount || Math.round((order.total * 18) / 118))}</td>
        </tr>
        <tr class="grand-total">
          <td>Grand Total:</td>
          <td style="text-align: right;">${formatINR(order.total)}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div style="font-weight: 600; color: #334155; margin-bottom: 4px;">Thank you for shopping at Bazaaro!</div>
      <div>This is a computer-generated tax invoice. No signature is required. For inquiries, contact support@bazaaro.in</div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Triggers clean 1-page receipt printing/PDF download via an isolated hidden iframe.
 * Prevents Chrome/Edge from rendering the 59-page background web page.
 */
export function printOrderReceipt(order: Order): void {
  try {
    // Remove any leftover print iframes
    const existingIframe = document.getElementById('bazaaro-print-iframe');
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'bazaaro-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      // Fallback to window.print if iframe unavailable
      window.print();
      return;
    }

    doc.open();
    doc.write(generateReceiptHtml(order));
    doc.close();

    // Allow browser layout engine to parse and render fonts/styles
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Error invoking iframe print:', e);
        window.print();
      } finally {
        // Clean up iframe after print dialog closes
        setTimeout(() => {
          iframe.remove();
        }, 3000);
      }
    }, 250);
  } catch (err) {
    console.error('Failed to trigger printable receipt:', err);
    window.print();
  }
}
