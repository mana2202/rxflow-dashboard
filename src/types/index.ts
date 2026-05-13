import type { PriorityBreakdown } from '@/utils/priorityScore';

export type UserRole = 'pharmacy_staff' | 'sales_rep' | 'operations' | 'procurement';
export type ProductType = 'OTC' | 'Controlled' | 'Device';
export type OrderStatus = 'Incoming' | 'Verified' | 'Picking' | 'Compliance Check' | 'Ready to Ship' | 'Shipped';
export type PipelineStage = 'Intake' | 'Compliance Check' | 'Fulfillment' | 'Dispatch';
export type CustomerTier = 1 | 2 | 3;
export type DEASchedule = 'II' | 'III' | 'IV' | 'V';
export type OrderChannel = 'WhatsApp' | 'Call' | 'Email' | 'EDI' | 'Portal' | 'Phone';
export type Completeness = 'Complete' | 'Needs Clarification';
export type StockState = 'In Stock' | 'Low Stock' | 'At Risk' | 'Out of Stock';
export type StockConfidence = 'High' | 'Medium' | 'Low';
export type ComplianceStatus = 'Not Required' | 'Pending' | 'Passed' | 'Blocked';

export interface User {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  email: string;
}

export interface Account {
  id: string;
  name: string;
  tier: CustomerTier;
  address: string;
  accountManager: string;
  totalOrdersYTD: number;
  avgOrderValue: number;
}

export interface Product {
  sku: string;
  name: string;
  category: ProductType;
  schedule?: DEASchedule;
  unitPrice: number;
  currentStock: number;
  reorderPoint: number;
  daysOfSupply: number;
  expiringWithin30Days: boolean;
  stockLastUpdatedHours?: number;
  stockConfidence?: StockConfidence;
}

export interface OrderLineItem {
  product: Product;
  qtyOrdered: number;
  qtyAvailable: number;
  lineTotal: number;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
}

export interface Order {
  id: string;
  accountId: string;
  account: Account;
  productType: ProductType;
  items: OrderLineItem[];
  itemCount: number;
  orderValue: number;
  status: OrderStatus;
  assignedTo: string;
  assignedUser?: User;
  orderDate: string;
  slaDeadline: string;
  slaHoursRemaining: number;
  isUrgent: boolean;
  hasStockRisk: boolean;
  priority: PriorityBreakdown;
  auditLog: AuditEntry[];
  channel: OrderChannel;
  completeness: Completeness;
  missingFields?: string[];
  duplicateOfId?: string;
  complianceStatus: ComplianceStatus;
  complianceBlockReason?: string;
}

export interface SLABreach {
  orderId: string;
  customer: string;
  productType: ProductType;
  priorityAtBreach: number;
  slaDeadline: string;
  actualFulfillment: string;
  delayHours: number;
  rootCause: string;
}

export interface DailyVolume {
  date: string;
  otc: number;
  controlled: number;
  device: number;
}
