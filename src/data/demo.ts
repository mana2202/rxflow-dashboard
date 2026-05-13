import type { User, Account, Product, Order, OrderLineItem, AuditEntry, SLABreach, DailyVolume, OrderChannel, StockState, StockConfidence, PipelineStage, OrderStatus as OrderStatusT } from '@/types';
import { computePriorityScore } from '@/utils/priorityScore';
import { format, subDays, addHours, subHours } from 'date-fns';

export const demoUsers: User[] = [
  { id: 'u1', name: 'Sarah Chen', initials: 'SC', role: 'pharmacy_staff', email: 'sarah@rxflow.com' },
  { id: 'u2', name: 'James Rivera', initials: 'JR', role: 'sales_rep', email: 'james@rxflow.com' },
  { id: 'u3', name: 'Marcus Thompson', initials: 'MT', role: 'operations', email: 'marcus@rxflow.com' },
  { id: 'u4', name: 'Diana Park', initials: 'DP', role: 'procurement', email: 'diana@rxflow.com' },
];

export const demoAccounts: Account[] = [
  { id: 'a1', name: 'Metro General Hospital', tier: 1, address: '450 Medical Center Dr, Boston MA', accountManager: 'James Rivera', totalOrdersYTD: 342, avgOrderValue: 12400 },
  { id: 'a2', name: 'Northeast Health System', tier: 1, address: '1200 Health Pkwy, Cambridge MA', accountManager: 'James Rivera', totalOrdersYTD: 289, avgOrderValue: 9800 },
  { id: 'a3', name: 'Beacon Hill Pharmacy', tier: 2, address: '78 Charles St, Boston MA', accountManager: 'James Rivera', totalOrdersYTD: 156, avgOrderValue: 3200 },
  { id: 'a4', name: 'Harbor Drug Co.', tier: 2, address: '55 Atlantic Ave, Boston MA', accountManager: 'James Rivera', totalOrdersYTD: 98, avgOrderValue: 2800 },
  { id: 'a5', name: 'Cambridge Apothecary', tier: 2, address: '301 Mass Ave, Cambridge MA', accountManager: 'James Rivera', totalOrdersYTD: 134, avgOrderValue: 2100 },
  { id: 'a6', name: 'CVS Health — Region NE', tier: 2, address: '1 CVS Dr, Woonsocket RI', accountManager: 'James Rivera', totalOrdersYTD: 267, avgOrderValue: 8500 },
  { id: 'a7', name: 'Walgreens — Boston Metro', tier: 2, address: '200 Wilmot Rd, Boston MA', accountManager: 'James Rivera', totalOrdersYTD: 245, avgOrderValue: 7200 },
  { id: 'a8', name: 'Smith Family Pharmacy', tier: 3, address: '12 Main St, Quincy MA', accountManager: 'James Rivera', totalOrdersYTD: 45, avgOrderValue: 890 },
];

export const demoProducts: Product[] = [
  // OTC
  { sku: 'OTC-1001', name: 'Ibuprofen 200mg (500ct)', category: 'OTC', unitPrice: 24.99, currentStock: 1200, reorderPoint: 300, daysOfSupply: 45, expiringWithin30Days: false },
  { sku: 'OTC-1002', name: 'Acetaminophen 500mg (1000ct)', category: 'OTC', unitPrice: 32.50, currentStock: 890, reorderPoint: 200, daysOfSupply: 38, expiringWithin30Days: false },
  { sku: 'OTC-1003', name: 'Cetirizine 10mg (90ct)', category: 'OTC', unitPrice: 18.75, currentStock: 45, reorderPoint: 100, daysOfSupply: 8, expiringWithin30Days: true },
  { sku: 'OTC-1004', name: 'Omeprazole 20mg (42ct)', category: 'OTC', unitPrice: 22.30, currentStock: 560, reorderPoint: 150, daysOfSupply: 30, expiringWithin30Days: false },
  { sku: 'OTC-1005', name: 'Vitamin D3 5000IU (360ct)', category: 'OTC', unitPrice: 15.99, currentStock: 1500, reorderPoint: 400, daysOfSupply: 60, expiringWithin30Days: false },
  { sku: 'OTC-1006', name: 'Diphenhydramine 25mg (100ct)', category: 'OTC', unitPrice: 12.49, currentStock: 670, reorderPoint: 200, daysOfSupply: 35, expiringWithin30Days: false },
  { sku: 'OTC-1007', name: 'Calcium Carbonate 600mg (120ct)', category: 'OTC', unitPrice: 9.99, currentStock: 340, reorderPoint: 100, daysOfSupply: 28, expiringWithin30Days: false },
  { sku: 'OTC-1008', name: 'Guaifenesin 400mg (60ct)', category: 'OTC', unitPrice: 14.25, currentStock: 18, reorderPoint: 80, daysOfSupply: 3, expiringWithin30Days: false },
  // Controlled
  { sku: 'CS-2001', name: 'Analgesic Schedule II (Oxycodone 5mg)', category: 'Controlled', schedule: 'II', unitPrice: 89.99, currentStock: 120, reorderPoint: 50, daysOfSupply: 15, expiringWithin30Days: false },
  { sku: 'CS-2002', name: 'Stimulant Schedule II (Amphetamine 20mg)', category: 'Controlled', schedule: 'II', unitPrice: 145.00, currentStock: 30, reorderPoint: 40, daysOfSupply: 5, expiringWithin30Days: false },
  { sku: 'CS-2003', name: 'Analgesic Schedule III (Codeine Compound)', category: 'Controlled', schedule: 'III', unitPrice: 67.50, currentStock: 200, reorderPoint: 60, daysOfSupply: 22, expiringWithin30Days: false },
  { sku: 'CS-2004', name: 'Anxiolytic Schedule IV (Alprazolam 0.5mg)', category: 'Controlled', schedule: 'IV', unitPrice: 42.00, currentStock: 340, reorderPoint: 100, daysOfSupply: 28, expiringWithin30Days: false },
  { sku: 'CS-2005', name: 'Sedative Schedule IV (Zolpidem 10mg)', category: 'Controlled', schedule: 'IV', unitPrice: 38.75, currentStock: 280, reorderPoint: 80, daysOfSupply: 25, expiringWithin30Days: false },
  { sku: 'CS-2006', name: 'Antitussive Schedule V (Codeine Syrup)', category: 'Controlled', schedule: 'V', unitPrice: 28.99, currentStock: 95, reorderPoint: 40, daysOfSupply: 18, expiringWithin30Days: false },
  // Devices
  { sku: 'MD-3001', name: 'Glucose Monitor Kit (AccuCheck Pro)', category: 'Device', unitPrice: 79.99, currentStock: 150, reorderPoint: 30, daysOfSupply: 42, expiringWithin30Days: false },
  { sku: 'MD-3002', name: 'Digital BP Cuff (OmronElite)', category: 'Device', unitPrice: 64.50, currentStock: 85, reorderPoint: 25, daysOfSupply: 35, expiringWithin30Days: false },
  { sku: 'MD-3003', name: 'Wound Care Kit (Advanced)', category: 'Device', unitPrice: 34.99, currentStock: 12, reorderPoint: 30, daysOfSupply: 4, expiringWithin30Days: false },
  { sku: 'MD-3004', name: 'Pulse Oximeter (Clinical)', category: 'Device', unitPrice: 45.00, currentStock: 200, reorderPoint: 50, daysOfSupply: 55, expiringWithin30Days: false },
  { sku: 'MD-3005', name: 'Nebulizer System (Portable)', category: 'Device', unitPrice: 125.00, currentStock: 40, reorderPoint: 15, daysOfSupply: 30, expiringWithin30Days: false },
  { sku: 'MD-3006', name: 'Insulin Pen Needles (100ct)', category: 'Device', unitPrice: 29.99, currentStock: 500, reorderPoint: 100, daysOfSupply: 45, expiringWithin30Days: false },
  { sku: 'OTC-1009', name: 'Aspirin 325mg (500ct)', category: 'OTC', unitPrice: 19.99, currentStock: 900, reorderPoint: 250, daysOfSupply: 40, expiringWithin30Days: false },
  { sku: 'OTC-1010', name: 'Loratadine 10mg (60ct)', category: 'OTC', unitPrice: 16.50, currentStock: 430, reorderPoint: 100, daysOfSupply: 32, expiringWithin30Days: false },
  { sku: 'MD-3007', name: 'Compression Stockings (Pair)', category: 'Device', unitPrice: 22.00, currentStock: 75, reorderPoint: 20, daysOfSupply: 25, expiringWithin30Days: false },
  { sku: 'CS-2007', name: 'Muscle Relaxant Schedule IV (Diazepam 5mg)', category: 'Controlled', schedule: 'IV', unitPrice: 35.00, currentStock: 150, reorderPoint: 40, daysOfSupply: 20, expiringWithin30Days: false },
  { sku: 'OTC-1011', name: 'Melatonin 5mg (120ct)', category: 'OTC', unitPrice: 11.99, currentStock: 620, reorderPoint: 150, daysOfSupply: 42, expiringWithin30Days: false },
];

const now = new Date();
const fmt = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss");

function makeItems(products: Product[], qtys: number[]): OrderLineItem[] {
  return products.map((p, i) => ({
    product: p,
    qtyOrdered: qtys[i],
    qtyAvailable: Math.min(qtys[i], p.currentStock),
    lineTotal: p.unitPrice * qtys[i],
  }));
}

function makeAudit(orderId: string, hoursAgo: number, assignee: string, extra: string[] = []): AuditEntry[] {
  const entries: AuditEntry[] = [
    { timestamp: fmt(subHours(now, hoursAgo)), action: `Order ${orderId} received via EDI` },
    { timestamp: fmt(subHours(now, hoursAgo - 0.5)), action: `Priority score calculated` },
    { timestamp: fmt(subHours(now, hoursAgo - 1)), action: `Assigned to ${assignee}` },
  ];
  extra.forEach((e, i) => entries.push({ timestamp: fmt(subHours(now, hoursAgo - 1.5 - i * 0.5)), action: e }));
  return entries;
}

function buildOrder(
  id: string, accountId: string, status: OrderStatusT, products: Product[], qtys: number[],
  isUrgent: boolean, slaHoursRemaining: number, assignee: string, channel: OrderChannel,
  orderHoursAgo: number, extraAudit: string[] = []
): Order {
  const account = demoAccounts.find(a => a.id === accountId)!;
  const items = makeItems(products, qtys);
  const hasStockRisk = items.some(i => i.product.currentStock < i.product.reorderPoint || i.product.expiringWithin30Days);
  const priority = computePriorityScore({ isUrgent, slaHoursRemaining, hasStockRisk, customerTier: account.tier });
  const user = demoUsers.find(u => u.name === assignee);
  const pType: import('@/types').ProductType = products.some(p => p.category === 'Controlled') ? 'Controlled' : products.some(p => p.category === 'Device') ? 'Device' : 'OTC';
  const hasControlled = products.some(p => p.category === 'Controlled');
  return {
    id, accountId, account, productType: pType, items, itemCount: items.length,
    orderValue: items.reduce((s, i) => s + i.lineTotal, 0), status,
    assignedTo: assignee, assignedUser: user,
    orderDate: fmt(subHours(now, orderHoursAgo)),
    slaDeadline: fmt(addHours(now, slaHoursRemaining)),
    slaHoursRemaining, isUrgent, hasStockRisk, priority,
    auditLog: makeAudit(id, orderHoursAgo, assignee, extraAudit), channel,
    completeness: 'Complete',
    complianceStatus: hasControlled ? 'Pending' : 'Not Required',
  };
}

type OrderStatus = import('@/types').OrderStatus;

const p = demoProducts;

export const demoOrders: Order[] = [
  // CRITICAL (3)
  buildOrder('RX-2024-08841', 'a1', 'Compliance Check', [p[8], p[10]], [50, 30], true, 1.5, 'Sarah Chen', 'EDI', 6, ['Stock reserved for 2 of 2 items', 'Compliance check initiated — Schedule II verification', 'DEA CSOS validation pending']),
  buildOrder('RX-2024-08839', 'a2', 'Picking', [p[9], p[13]], [20, 40], true, 0.5, 'Marcus Thompson', 'Portal', 8, ['Stock reserved — low stock warning on Stimulant Schedule II', 'Escalated: SLA breach imminent']),
  buildOrder('RX-2024-08837', 'a1', 'Incoming', [p[14], p[16], p[17]], [100, 50, 25], true, -2, 'Sarah Chen', 'Phone', 10, ['STAT order flagged — hospital critical device shortage']),
  // HIGH (5)
  buildOrder('RX-2024-08835', 'a6', 'Verified', [p[0], p[1], p[4]], [200, 150, 100], false, 3, 'Marcus Thompson', 'EDI', 12, ['Bulk OTC order — SLA breaching today']),
  buildOrder('RX-2024-08833', 'a3', 'Picking', [p[11], p[12]], [60, 45], true, 8, 'Sarah Chen', 'Portal', 5, ['Controlled substance — active Rx verified']),
  buildOrder('RX-2024-08831', 'a7', 'Incoming', [p[2], p[5], p[7]], [300, 200, 150], false, 2.5, 'Marcus Thompson', 'EDI', 4, ['Low stock alert: Cetirizine, Guaifenesin']),
  buildOrder('RX-2024-08829', 'a4', 'Compliance Check', [p[8], p[23]], [25, 40], true, 12, 'Sarah Chen', 'Portal', 7, ['DEA compliance review queued']),
  buildOrder('RX-2024-08827', 'a2', 'Verified', [p[15], p[14], p[18]], [80, 60, 30], false, 5, 'Marcus Thompson', 'EDI', 9, ['Device order — SLA proximity alert']),
  // MEDIUM (8)
  buildOrder('RX-2024-08825', 'a5', 'Picking', [p[0], p[3]], [100, 80], false, 18, 'Sarah Chen', 'Portal', 14),
  buildOrder('RX-2024-08823', 'a3', 'Incoming', [p[6], p[4]], [50, 75], false, 24, 'Marcus Thompson', 'EDI', 3),
  buildOrder('RX-2024-08821', 'a8', 'Verified', [p[20], p[21]], [30, 40], false, 16, 'Sarah Chen', 'Phone', 6),
  buildOrder('RX-2024-08819', 'a4', 'Ready to Ship', [p[17], p[19]], [20, 15], false, 20, 'Marcus Thompson', 'EDI', 18),
  buildOrder('RX-2024-08817', 'a6', 'Picking', [p[1], p[5], p[24]], [120, 90, 60], false, 22, 'Sarah Chen', 'EDI', 10),
  buildOrder('RX-2024-08815', 'a7', 'Incoming', [p[3], p[6]], [60, 45], false, 28, 'Marcus Thompson', 'Portal', 2),
  buildOrder('RX-2024-08813', 'a1', 'Compliance Check', [p[12], p[13]], [35, 50], false, 14, 'Sarah Chen', 'EDI', 16, ['Routine controlled — compliance queued']),
  buildOrder('RX-2024-08811', 'a5', 'Picking', [p[22], p[15]], [40, 20], false, 19, 'Marcus Thompson', 'Portal', 8),
  // ROUTINE (4)
  buildOrder('RX-2024-08809', 'a8', 'Ready to Ship', [p[0], p[4]], [20, 30], false, 40, 'Sarah Chen', 'Phone', 20),
  buildOrder('RX-2024-08807', 'a3', 'Shipped', [p[1], p[6]], [50, 60], false, 46, 'Marcus Thompson', 'EDI', 48),
  buildOrder('RX-2024-08805', 'a5', 'Shipped', [p[3]], [25], false, 44, 'Sarah Chen', 'Portal', 52),
  buildOrder('RX-2024-08803', 'a4', 'Shipped', [p[20], p[24]], [15, 20], false, 42, 'Marcus Thompson', 'EDI', 56),
  // Extra for kanban fill
  buildOrder('RX-2024-08801', 'a6', 'Ready to Ship', [p[14], p[19]], [10, 12], false, 30, 'Sarah Chen', 'EDI', 24),
  buildOrder('RX-2024-08799', 'a7', 'Verified', [p[5], p[7]], [80, 60], false, 15, 'Marcus Thompson', 'Portal', 11),
  buildOrder('RX-2024-08797', 'a1', 'Ready to Ship', [p[17], p[18]], [25, 30], false, 26, 'Sarah Chen', 'EDI', 22),
  buildOrder('RX-2024-08795', 'a2', 'Incoming', [p[0], p[21], p[24]], [100, 50, 30], false, 36, 'Marcus Thompson', 'EDI', 1),
  buildOrder('RX-2024-08793', 'a3', 'Shipped', [p[4], p[6]], [40, 50], false, 50, 'Sarah Chen', 'Portal', 60),
  buildOrder('RX-2024-08791', 'a6', 'Shipped', [p[1], p[3]], [80, 70], false, 48, 'Marcus Thompson', 'EDI', 54),
  buildOrder('RX-2024-08789', 'a7', 'Shipped', [p[15], p[19]], [20, 15], false, 52, 'Sarah Chen', 'EDI', 58),
  buildOrder('RX-2024-08787', 'a8', 'Shipped', [p[20]], [10], false, 55, 'Marcus Thompson', 'Phone', 62),
  buildOrder('RX-2024-08785', 'a4', 'Shipped', [p[22], p[14]], [30, 25], false, 60, 'Sarah Chen', 'EDI', 66),
  buildOrder('RX-2024-08783', 'a5', 'Incoming', [p[11], p[4]], [20, 50], false, 32, 'Marcus Thompson', 'Portal', 2),
];

export const demoSLABreaches: SLABreach[] = [
  { orderId: 'RX-2024-08702', customer: 'Metro General Hospital', productType: 'Controlled', priorityAtBreach: 82, slaDeadline: fmt(subDays(now, 2)), actualFulfillment: fmt(subDays(now, 1.5)), delayHours: 4.2, rootCause: 'Compliance delay' },
  { orderId: 'RX-2024-08688', customer: 'CVS Health — Region NE', productType: 'OTC', priorityAtBreach: 71, slaDeadline: fmt(subDays(now, 3)), actualFulfillment: fmt(subDays(now, 2.8)), delayHours: 2.8, rootCause: 'Stock shortage' },
  { orderId: 'RX-2024-08675', customer: 'Beacon Hill Pharmacy', productType: 'Device', priorityAtBreach: 64, slaDeadline: fmt(subDays(now, 4)), actualFulfillment: fmt(subDays(now, 3.6)), delayHours: 6.1, rootCause: 'Carrier' },
  { orderId: 'RX-2024-08661', customer: 'Northeast Health System', productType: 'Controlled', priorityAtBreach: 88, slaDeadline: fmt(subDays(now, 5)), actualFulfillment: fmt(subDays(now, 4.7)), delayHours: 3.5, rootCause: 'Compliance delay' },
  { orderId: 'RX-2024-08648', customer: 'Harbor Drug Co.', productType: 'OTC', priorityAtBreach: 55, slaDeadline: fmt(subDays(now, 6)), actualFulfillment: fmt(subDays(now, 5.5)), delayHours: 8.0, rootCause: 'Staffing' },
  { orderId: 'RX-2024-08634', customer: 'Walgreens — Boston Metro', productType: 'OTC', priorityAtBreach: 62, slaDeadline: fmt(subDays(now, 7)), actualFulfillment: fmt(subDays(now, 6.6)), delayHours: 5.3, rootCause: 'System error' },
  { orderId: 'RX-2024-08620', customer: 'Metro General Hospital', productType: 'Device', priorityAtBreach: 78, slaDeadline: fmt(subDays(now, 8)), actualFulfillment: fmt(subDays(now, 7.4)), delayHours: 9.6, rootCause: 'Stock shortage' },
  { orderId: 'RX-2024-08609', customer: 'Cambridge Apothecary', productType: 'OTC', priorityAtBreach: 48, slaDeadline: fmt(subDays(now, 10)), actualFulfillment: fmt(subDays(now, 9.5)), delayHours: 7.2, rootCause: 'Staffing' },
  { orderId: 'RX-2024-08595', customer: 'Smith Family Pharmacy', productType: 'Controlled', priorityAtBreach: 73, slaDeadline: fmt(subDays(now, 12)), actualFulfillment: fmt(subDays(now, 11.2)), delayHours: 4.8, rootCause: 'Compliance delay' },
  { orderId: 'RX-2024-08580', customer: 'CVS Health — Region NE', productType: 'Device', priorityAtBreach: 59, slaDeadline: fmt(subDays(now, 14)), actualFulfillment: fmt(subDays(now, 13.3)), delayHours: 11.2, rootCause: 'Carrier' },
];

export const demoDailyVolume: DailyVolume[] = Array.from({ length: 30 }, (_, i) => {
  const date = format(subDays(now, 29 - i), 'MMM dd');
  const base = 30 + Math.floor(Math.random() * 15);
  return {
    date,
    otc: base + Math.floor(Math.random() * 10),
    controlled: 5 + Math.floor(Math.random() * 8),
    device: 3 + Math.floor(Math.random() * 6),
  };
});

export const roleLabels: Record<import('@/types').UserRole, string> = {
  pharmacy_staff: 'Pharmacy Staff',
  sales_rep: 'Sales Rep',
  operations: 'Operations Manager',
  procurement: 'Procurement',
};

export const roleDefaultPaths: Record<import('@/types').UserRole, string> = {
  pharmacy_staff: '/home',
  sales_rep: '/home',
  operations: '/home',
  procurement: '/home',
};
