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

export type CourseStage = "bebida" | "entrada" | "principal" | "sobremesa";
export type MarchingStatus = "aguardar" | "marchar" | "servido";

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
  courseStage?: CourseStage;
  marchingStatus?: MarchingStatus;
}

export type TableStatus = "livre" | "ocupada" | "fechamento" | "chamando_garcom";

export interface TableItem {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: TableStatus;
  area?: "salao" | "esplanada" | "balcao" | string;
  customerName?: string;
  customerPhone?: string;
  customerNif?: string; // NIF / VAT ID europeu para emissão fiscal
  openedAt?: string;
  items: ComandaItem[];
  totalAmount: number;
  waiterCalledAt?: string;
  waiterName?: string;
  estimatedDepartureTime?: string; // Previsão de liberação calculada pelo algoritmo de permanência
}

export type OrderStatus = "pendente" | "preparando" | "pronto" | "entregue";
export type OrderType = "local" | "viagem" | "qrcode_mesa" | "delivery" | "takeaway";

export interface OrderItem {
  name: string;
  category?: string;
  quantity: number;
  price: number;
  notes?: string;
  courseStage?: CourseStage;
  marchingStatus?: MarchingStatus;
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
  delivery_address?: string;
  delivery_phone?: string;
  delivery_fee?: number;
  pacing_priority?: "prioridade_salao" | "padrao_delivery" | "takeaway";
  created_at: string;
  started_at?: string;
  completed_at?: string;
  delivered_at?: string;
  waiterName?: string;
}

// ==========================================
// TIPOS: ENGENHARIA DE CUSTOS & ESCANDALLO
// ==========================================

export interface RecipeIngredientCost {
  ingredientId: string;
  name: string;
  purchasePackagePrice: number; // Ex: €20.00
  purchasePackageQty: number; // Ex: 1.0 (1kg)
  purchaseUnit: "kg" | "g" | "l" | "ml" | "un";
  portionQty: number; // Ex: 50 (50g)
  portionUnit: "g" | "kg" | "ml" | "l" | "un";
  portionCost: number; // Ex: €1.00
}

export interface DishCostBreakdown {
  dishName: string;
  category: string;
  ingredients: RecipeIngredientCost[];
  directFoodCost: number; // CMV Direto dos insumos (€)
  indirectOverheadPercent: number; // Rateio operacional: luz, gás, equipe (ex: 25%)
  indirectOverheadCost: number; // Valor do rateio (€)
  totalProductionCost: number; // Custo Total Base (€)
  targetVatRate: number; // Taxa de IVA (ex: 13%)
  breakEvenPrice: number; // Preço Mínimo de Equilíbrio sem prejuízo (€)
  currentSalePrice: number; // Preço Atual (€)
  suggestedMarginPercent: number; // Margem Alvo (ex: 65%)
  suggestedSalePrice: number; // Preço de Venda Otimizado para 65% (€)
  netProfitUnit: number; // Lucro Líquido Unitário estimado (€)
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

// ==========================================
// TIPOS AVANÇADOS ERP: ARQUEO DE CAIXA (TURNOS)
// ==========================================

export type ShiftType = "almoco" | "jantar" | "geral";

export interface CashRegisterShift {
  id: string;
  tenant_id: string;
  openedAt: string;
  closedAt?: string;
  status: "aberto" | "fechado";
  operatorName: string;
  shiftType: ShiftType;
  initialFloat: number; // Fundo de troco (€)
  sangrias: { amount: number; reason: string; time: string }[];
  suprimentos: { amount: number; reason: string; time: string }[];
  expectedCash: number;
  declaredCash?: number;
  difference?: number;
  cardTotal: number;
  mbwayTotal: number;
  totalSales: number;
  notes?: string;
}

// ==========================================
// TIPOS AVANÇADOS ERP: BUSINESS INTELLIGENCE (BI)
// ==========================================

export type BcgCategory = "estrela" | "burro_de_carga" | "puzzle" | "cao";

export interface MenuEngineeringItem {
  id: string;
  name: string;
  category: string;
  salesCount: number;
  revenue: number;
  costPrice: number;
  unitMargin: number;
  marginPercent: number;
  popularityRank: "alta" | "baixa";
  profitabilityRank: "alta" | "baixa";
  bcgCategory: BcgCategory;
}

export interface HourlySalesData {
  hour: string;
  sales: number;
  ordersCount: number;
  shift: ShiftType;
}

export interface WaiterPerformance {
  waiterName: string;
  tablesServed: number;
  totalRevenue: number;
  averageTicket: number;
}

export interface MiseEnPlacePrediction {
  dishName: string;
  category: string;
  predictedDemandNextShift: number;
  suggestedThawPrep: number; // Qtd para descongelar / preparar
  unit: string;
  criticalAllergens: string[];
}

export interface FefoPushAlert {
  id: string;
  ingredientName: string;
  lote: string;
  daysToExpire: number;
  quantity: number;
  unit: string;
  affectedDishName?: string;
  suggestedDiscountPercent: number;
  urgencyLevel: "critico" | "alto" | "moderado";
}
