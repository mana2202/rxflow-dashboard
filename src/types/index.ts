import type { PriorityBreakdown } from '@/utils/priorityScore';

export type UserRole = 'sales_rep' | 'operations' | 'procurement';
export type ProductType = 'OTC' | 'Controlled' | 'Device';
export type OrderStatus = 'Incoming' | 'Verified' | 'Picking' | 'Compliance Check' | 'Ready to Ship' | 'Shipped';
export type PipelineStage = 'Intake' | 'Compliance Check' | 'Fulfillment' | 'Dispatch';
export type CustomerTier = 1 | 2 | 3;
export type DEASchedule = 'II' | 'III' | 'IV' | 'V';
export type OrderChannel = 'WhatsApp' | 'Phone' | 'Email' | 'Walk-in';
export type Completeness = 'Complete' | 'Needs Clarification';
export type StockState = 'In Stock' | 'Low Stock' | 'At Risk' | 'Out of Stock';
export type StockConfidence = 'High' | 'Medium' | 'Low';
export type ComplianceStatus = 'Not Required' | 'Pending' | 'Passed' | 'Blocked';

export type OverrideDirection = 'escalate' | 'deescalate';
export type OverrideReason = 'client_relationship' | 'stock_emergency' | 'compliance_exception' | 'ops_judgment';

export interface OverrideRecord {
  id: string;
  timestamp: string;
  changedBy: string;
  fromScore: number;
  fromLevel: string;
  toScore: number;
  toLevel: string;
  direction: OverrideDirection;
  reasonCode: OverrideReason;
  impact: string;
}

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
  deliveryDate?: string;
  deliveryAddress?: string;
  slaDeadline: string;
  slaHoursRemaining: number;
  isUrgent: boolean;
  hasStockRisk: boolean;
  priority: PriorityBreakdown;
  auditLog: AuditEntry[];
  overrides?: OverrideRecord[];
  channel: OrderChannel;
  completeness: Completeness;
  missingFields?: string[];
  duplicateOfId?: string;
  complianceStatus: ComplianceStatus;
  complianceBlockReason?: string;
  stockConflict?: boolean;
  enteredQueueAt?: string;
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
