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
  total_leads: number;
  today_leads: number;
  active_deals: number;
  completed_orders: number;
  sales_amount: number;
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
