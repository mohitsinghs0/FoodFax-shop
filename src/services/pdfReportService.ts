import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OwnerOrder, Shop } from '../types';

export interface SalesReportParams {
  shop: Shop | null;
  orders: OwnerOrder[];
  dateRangeLabel: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  completedOrdersCount: number;
  cancelledOrdersCount: number;
  upiAmount: number;
  cashAmount: number;
  upiOrdersCount: number;
  cashOrdersCount: number;
  averageOrderValue: number;
}

export function generateSalesSummaryPdf(params: SalesReportParams): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [249, 115, 22]; // #F97316 (FoodFax Vibrant Orange)
  const darkColor = [15, 23, 42]; // Slate 900
  const lightGray = [241, 245, 249]; // Slate 100

  // Header Banner Background
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 38, 'F');

  // Accent Orange Line
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 38, 210, 3, 'F');

  // Brand & Document Title
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('FOODFAX', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(249, 115, 22);
  doc.text('OFFICIAL SETTLEMENT & SALES REPORT', 14, 23);

  // Shop Details on Header Right
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  const shopName = params.shop?.name || 'Restaurant / Stall';
  doc.text(shopName, 196, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate 300
  const shopContact = params.shop?.phone ? `Phone: ${params.shop.phone}` : (params.shop?.shopType || 'QSR / Food Stall');
  doc.text(shopContact, 196, 22, { align: 'right' });

  const generatedDateStr = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  doc.text(`Generated: ${generatedDateStr}`, 196, 28, { align: 'right' });

  // Period / Date Range Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`Sales Performance Summary: ${params.dateRangeLabel}`, 14, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date Scope: ${params.startDate} to ${params.endDate}`, 14, 56);

  // Key KPI Cards (4 grid boxes)
  const boxY = 62;
  const boxWidth = 43;
  const boxHeight = 22;
  const gap = 6;

  // Box 1: Total Revenue
  doc.setFillColor(254, 242, 232); // Orange 50
  doc.setDrawColor(249, 115, 22);
  doc.roundedRect(14, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(194, 65, 12);
  doc.text('TOTAL REVENUE', 18, boxY + 6);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${params.totalRevenue.toLocaleString()}`, 18, boxY + 16);

  // Box 2: Completed Orders
  const b2X = 14 + boxWidth + gap;
  doc.setFillColor(240, 253, 244); // Green 50
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(b2X, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61);
  doc.text('SETTLED ORDERS', b2X + 4, boxY + 6);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`${params.completedOrdersCount} orders`, b2X + 4, boxY + 16);

  // Box 3: Average Order Value
  const b3X = b2X + boxWidth + gap;
  doc.setFillColor(239, 246, 255); // Blue 50
  doc.setDrawColor(59, 130, 246);
  doc.roundedRect(b3X, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(29, 78, 216);
  doc.text('AVG ORDER VALUE', b3X + 4, boxY + 6);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${params.averageOrderValue}`, b3X + 4, boxY + 16);

  // Box 4: UPI vs Cash
  const b4X = b3X + boxWidth + gap;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(b4X, boxY, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('PAYMENT SPLIT', b4X + 4, boxY + 6);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`UPI: INR ${params.upiAmount.toLocaleString()}`, b4X + 4, boxY + 13);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Cash: INR ${params.cashAmount.toLocaleString()}`, b4X + 4, boxY + 18);

  // Table of Settled Orders
  const tableData = params.orders.map((ord, idx) => {
    const timeFormatted = new Date(ord.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    const itemsSummary = ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
    return [
      idx + 1,
      ord.orderNumber,
      timeFormatted,
      ord.customerName || 'Walk-in Guest',
      ord.orderType.toUpperCase(),
      itemsSummary,
      ord.paymentMethod.toUpperCase(),
      `INR ${ord.totalAmount}`,
    ];
  });

  autoTable(doc, {
    startY: 92,
    head: [['#', 'Order No', 'Date & Time', 'Customer', 'Type', 'Ordered Items', 'Payment', 'Amount']],
    body: tableData.length > 0 ? tableData : [['-', 'No settled orders recorded for the selected date range.', '', '', '', '', '', 'INR 0']],
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 24 },
      4: { cellWidth: 18 },
      5: { cellWidth: 62 },
      6: { cellWidth: 18, halign: 'center' },
      7: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Page ${doc.getNumberOfPages()}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, 196, 287, { align: 'right' });
      doc.text('FoodFax Smart QR Partner System • Confidential Business Analytics', 14, 287);
    },
  });

  // Trigger browser direct download
  const safeShopName = (params.shop?.name || 'Shop').replace(/[^a-zA-Z0-9]/g, '_');
  const safeDateLabel = params.dateRangeLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `FoodFax_SalesReport_${safeShopName}_${safeDateLabel}.pdf`;
  doc.save(filename);
}
