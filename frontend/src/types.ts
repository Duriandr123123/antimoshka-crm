export type User = {
  id: number;
  username: string;
  role: "admin" | "manager";
  full_name: string;
};

export type Client = {
  id: number;
  name: string;
  phone: string;
  address: string;
  source: string;
  comment: string;
  created_at: string;
};

export type Deal = {
  id: number;
  client_id: number;
  net_type: string;
  windows_count: number;
  amount: number;
  status: string;
  comment: string;
  created_at: string;
  client: Client;
};

export type Task = {
  id: number;
  deal_id: number;
  manager_id: number;
  measurement_date: string | null;
  installation_date: string | null;
  manager: User;
  deal: Deal;
};

export type StatusHistory = {
  id: number;
  deal_id: number;
  old_status: string | null;
  new_status: string;
  comment: string;
  changed_at: string;
};

export type Dashboard = {
  total_clients: number;
  total_deals: number;
  total_leads: number;
  today_leads: number;
  active_deals: number;
  completed_deals: number;
  completed_orders: number;
  measurements_today: number;
  installations_today: number;
  monthly_sales: number;
  sales_amount: number;
  sales_conversion: number;
  conversion: number;
};

export type Meta = {
  statuses: string[];
  sources: string[];
  net_types: string[];
};

export type ClientCard = {
  client: Client;
  deals: Deal[];
  tasks: Task[];
  history: StatusHistory[];
};
