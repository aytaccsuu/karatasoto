export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  total_debt: number;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number | null;
  km?: number | null;
  chassis_number?: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface Product {
  id: string;
  name: string;
  unit_price: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PaymentType = 'nakit' | 'kredi_karti' | 'veresiye';

export interface ServiceLineItem {
  id: string;
  service_record_id: string;
  product_id?: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
  created_at: string;
}

export interface ServiceRecord {
  id: string;
  vehicle_id: string;
  customer_id: string;
  service_date: string;
  km_at_service?: number | null;
  labor_cost: number;
  parts_total: number;
  grand_total: number;
  payment_type: PaymentType;
  amount_paid: number;
  debt_added: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: Vehicle;
  customer?: Customer;
  line_items?: ServiceLineItem[];
}

export type DebtTransactionType = 'veresiye' | 'odeme' | 'duzeltme';

export interface DebtTransaction {
  id: string;
  customer_id: string;
  service_record_id?: string | null;
  transaction_type: DebtTransactionType;
  amount: number;
  description?: string | null;
  balance_after: number;
  created_at: string;
}

export interface DashboardStats {
  total_customers: number;
  total_vehicles: number;
  todays_vehicle_count: number;
  todays_revenue: number;
  total_credit_debt: number;
}

export type CustomerInput = {
  first_name: string;
  last_name: string;
  phone?: string;
};

export type VehicleInput = {
  customer_id: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  km?: number;
  chassis_number?: string;
};

export type ProductInput = {
  name: string;
  unit_price: number;
  unit: string;
};

export interface ServiceLineItemInput {
  product_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface ServiceRecordInput {
  vehicle_id: string;
  customer_id: string;
  service_date: string;
  km_at_service?: number;
  labor_cost: number;
  payment_type: PaymentType;
  notes?: string;
  line_items: ServiceLineItemInput[];
}
