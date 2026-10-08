export type CurrencyCode = "EUR" | "BRL" | "USD";

export interface TenantSettings {
  currency: CurrencyCode;
  currencySymbol: string;
  locale: string;
  defaultVatRate: number; // Ex: 23% em Portugal, 10% Espanha/França
  businessCountry: string; // PT, ES, FR, DE, BR, etc.
}

export type UserRole = "owner" | "manager" | "waiter" | "kitchen" | "guest";

export interface SubscriptionInfo {
  status: "trial" | "active" | "expired" | "canceled";
  plan: "trial" | "starter" | "pro" | "enterprise";
  createdAt: string;
  expiresAt: string;
  daysRemaining: number;
}

export interface TenantProfile {
  tenantId: string;
  businessName: string;
  ownerEmail: string;
  ownerUid: string;
  subscription: SubscriptionInfo;
  settings?: TenantSettings;
}

export interface MenuItem {
  id: string;
  name: string;
  category: "entradas" | "pratos" | "lanches" | "combos" | "bebidas" | "sobremesas" | string;
  price: number;
  description: string;
  popular?: boolean;
  vatRate?: number; // Alíquota de IVA (%)
  allergens?: string[]; // Ex: ["Glúten", "Lactose"]
  estimatedPrepMinutes?: number;
}

export interface TechnicalSheetItem {
  ingredientId: string;
  ingredientName: string;
  quantityNeeded: number;
  unit?: string;
  unitCost?: number;
  inventoryUnit?: string;
}

export interface TechnicalSheet {
  id?: string;
  tenant_id?: string;
  menuItemId: string;
  menuItemName: string;
  category?: string;
  salePrice?: number;
  estimatedPrepMinutes?: number;
  estimatedCost?: number;
  vatRate?: number;
  items: TechnicalSheetItem[];
}

export interface ComandaItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  notes?: string;
  sentToKitchen: boolean;
  addedAt: string;
  vatRate?: number;
}

export type TableStatus = "livre" | "ocupada" | "fechamento" | "chamando_garcom";

export interface TableItem {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: TableStatus;
  customerName?: string;
  customerPhone?: string;
  customerNif?: string; // NIF / VAT ID europeu para emissão fiscal
  openedAt?: string;
  items: ComandaItem[];
  totalAmount: number;
  waiterCalledAt?: string;
}

export type OrderStatus = "pendente" | "preparando" | "pronto" | "entregue";
export type OrderType = "local" | "viagem" | "qrcode_mesa";

export interface OrderItem {
  name: string;
  category?: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  order_number: number;
  customer_name: string;
  table_number?: number;
  order_type: OrderType;
  payment_method?: string;
  items: OrderItem[];
  total_price: number;
  status: OrderStatus;
  estimated_minutes?: number;
  is_fast_track?: boolean;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  delivered_at?: string;
}

export interface InventoryItem {
  id?: string;
  tenant_id: string;
  name: string;
  lote: string;
  quantity: number;
  unit: "un" | "kg" | "g" | "l" | "ml" | "pct";
  days_to_expire: number;
  locator?: string;
  cost_price: number;
  supplier?: string;
}

export interface FinancialTransaction {
  id?: string;
  tenant_id: string;
  type: "income" | "expense";
  category: "sales" | "cmv" | "loss" | "operations";
  amount: number;
  vat_amount?: number;
  description: string;
  payment_method?: string;
  date: string;
}
