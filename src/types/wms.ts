export type NavSection =
  | 'dashboard'
  | 'inventory'
  | 'inbound'
  | 'outbound'
  | 'quantum'
  | 'catalog'
  | 'locations'
  | 'returns'
  | 'ai-debugger';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'quantum';
  title: string;
  description?: string;
}

export interface WmsStatePayload {
  persistence: {
    mode: 'TEST' | 'DEVELOP' | 'DEPLOY';
    engine: string;
    storageLocation: string;
    supabaseCloudProject: {
      ref: string;
      name: string;
      region: string;
      schemaMirrored: boolean;
    };
    features: string[];
  };
  warehouses: any[];
  kpis: {
    totalSkus: number;
    totalOnHand: number;
    totalReserved: number;
    totalAvailable: number;
    totalValuation: number;
    openPurchaseOrders: number;
    activeSalesOrders: number;
    openPickTasks: number;
    quantumSpeedupPct: number;
    shipmentsCount: number;
  };
  skus: any[];
  suppliers: any[];
  customers: any[];
  carriers: any[];
  locations: any[];
  zoneUtilization: any[];
  balances: any[];
  ledger: any[];
  transfers: any[];
  replenishmentTasks: any[];
  purchaseOrders: any[];
  receipts: any[];
  waves: any[];
  salesOrders: any[];
  pickTasks: any[];
  cartons: any[];
  shipments: any[];
  rmas: any[];
  outboxEvents: any[];
  auditLogs: any[];
  backups: any[];
  aiInsights: any[];
}
