import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Client, ClientCard, Dashboard, Deal, Meta, Task, User } from "./types";

const API_URL = "http://127.0.0.1:8000/api";

const emptyClient = {
  name: "",
  phone: "",
  address: "",
  source: "Instagram",
  comment: "",
};

const emptyDeal = {
  client_id: 0,
  net_type: "Обычная",
  windows_count: 1,
  amount: 0,
  status: "Новая заявка",
  comment: "",
};

type Tab = "dashboard" | "deals" | "kanban" | "clients" | "tasks";

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Backend недоступен. Запустите FastAPI на http://127.0.0.1:8000");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Ошибка API");
  }
  return response.json();
}

function money(value: number) {
  return new Intl.NumberFormat("ru-KZ", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(value);
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [login, setLogin] = useState({ username: "admin", password: "admin123" });
  const [tab, setTab] = useState<Tab>("dashboard");
  const [meta, setMeta] = useState<Meta>({ statuses: [], sources: [], net_types: [] });
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [clientForm, setClientForm] = useState(emptyClient);
  const [dealForm, setDealForm] = useState(emptyDeal);
  const [taskForm, setTaskForm] = useState({ deal_id: 0, manager_id: 0, measurement_date: "", installation_date: "" });
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientCard, setClientCard] = useState<ClientCard | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [editingDealId, setEditingDealId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadData() {
    const [metaData, clientData, dealData, taskData, userData, dashboardData] = await Promise.all([
      api<Meta>("/meta"),
      api<Client[]>("/clients"),
      api<Deal[]>("/deals"),
      api<Task[]>("/tasks"),
      api<User[]>("/users"),
      api<Dashboard>("/dashboard"),
    ]);
    setMeta(metaData);
    setClients(clientData);
    setDeals(dealData);
    setTasks(taskData);
    setUsers(userData);
    setDashboard(dashboardData);
    setDealForm((current) => ({ ...current, client_id: current.client_id || clientData[0]?.id || 0 }));
    setTaskForm((current) => ({
      ...current,
      deal_id: current.deal_id || dealData[0]?.id || 0,
      manager_id: current.manager_id || userData[0]?.id || 0,
    }));
  }

  useEffect(() => {
    loadData().catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    if (!selectedClientId) {
      setClientCard(null);
      return;
    }
    api<ClientCard>(`/clients/${selectedClientId}/card`)
      .then(setClientCard)
      .catch((error) => setMessage(error.message));
  }, [selectedClientId, deals, tasks]);

  const groupedDeals = useMemo(() => {
    return meta.statuses.map((status) => ({
      status,
      deals: deals.filter((deal) => deal.status === status),
    }));
  }, [deals, meta.statuses]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const loggedIn = await api<User>("/login", { method: "POST", body: JSON.stringify(login) });
      setUser(loggedIn);
      setMessage(`Добро пожаловать, ${loggedIn.full_name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  async function createClient(event: FormEvent) {
    event.preventDefault();
    const created = await api<Client>("/clients", { method: "POST", body: JSON.stringify(clientForm) });
    setClientForm(emptyClient);
    setSelectedClientId(created.id);
    await loadData();
    setMessage("Клиент создан");
  }

  function resetDealForm() {
    setEditingDealId(null);
    setDealForm({ ...emptyDeal, client_id: clients[0]?.id || 0 });
  }

  async function saveDeal(event: FormEvent) {
    event.preventDefault();
    const saved = editingDealId
      ? await api<Deal>(`/deals/${editingDealId}`, { method: "PUT", body: JSON.stringify(dealForm) })
      : await api<Deal>("/deals", { method: "POST", body: JSON.stringify(dealForm) });
    setSelectedDeal(saved);
    resetDealForm();
    await loadData();
    setMessage(editingDealId ? "Сделка обновлена" : "Сделка создана");
  }

  function editDeal(deal: Deal) {
    setSelectedDeal(deal);
    setEditingDealId(deal.id);
    setDealForm({
      client_id: deal.client_id,
      net_type: deal.net_type,
      windows_count: deal.windows_count,
      amount: deal.amount,
      status: deal.status,
      comment: deal.comment,
    });
  }

  async function deleteDeal(deal: Deal) {
    if (!window.confirm(`Удалить сделку #${deal.id}?`)) {
      return;
    }
    await api<{ ok: boolean }>(`/deals/${deal.id}`, { method: "DELETE" });
    if (selectedDeal?.id === deal.id) {
      setSelectedDeal(null);
    }
    await loadData();
    setMessage("Сделка удалена");
  }

  async function createTask(event: FormEvent) {
    event.preventDefault();
    await api<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify({
        ...taskForm,
        measurement_date: taskForm.measurement_date || null,
        installation_date: taskForm.installation_date || null,
      }),
    });
    await loadData();
    setMessage("Задача сохранена");
  }

  async function changeStatus(dealId: number, status: string) {
    await api<Deal>(`/deals/${dealId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, comment: "Изменено в CRM" }),
    });
    await loadData();
    setMessage("Статус обновлен");
  }

  function onDragStart(event: React.DragEvent, dealId: number) {
    event.dataTransfer.setData("dealId", String(dealId));
  }

  async function onDrop(event: React.DragEvent, status: string) {
    event.preventDefault();
    const dealId = Number(event.dataTransfer.getData("dealId"));
    if (dealId) {
      await changeStatus(dealId, status);
    }
  }

  if (!user) {
    return (
      <main className="login-shell">
        <section className="login-panel">
          <div>
            <p className="eyebrow">Антимошка KZ</p>
            <h1>CRM для заявок и монтажа</h1>
          </div>
          <form onSubmit={handleLogin} className="form">
            <label>
              Логин
              <input value={login.username} onChange={(event) => setLogin({ ...login, username: event.target.value })} />
            </label>
            <label>
              Пароль
              <input type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} />
            </label>
            <button disabled={loading}>{loading ? "Вход..." : "Войти"}</button>
            <p className="muted">admin / admin123, manager / manager123</p>
            {message && <p className="notice">{message}</p>}
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Антимошка KZ</p>
          <h1>CRM</h1>
        </div>
        <nav>
          {[
            ["dashboard", "Дашборд"],
            ["deals", "Сделки"],
            ["kanban", "Канбан"],
            ["clients", "Клиенты"],
            ["tasks", "Задачи"],
          ].map(([key, label]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key as Tab)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="profile">
          <strong>{user.full_name}</strong>
          <span>{user.role}</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h2>{tab === "dashboard" ? "Дашборд" : tab === "deals" ? "Сделки" : tab === "kanban" ? "Канбан" : tab === "clients" ? "Клиенты" : "Задачи"}</h2>
            <p>{new Date().toLocaleDateString("ru-KZ", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
          <button className="ghost" onClick={() => loadData()}>
            Обновить
          </button>
        </header>

        {message && <div className="toast">{message}</div>}

        {tab === "dashboard" && dashboard && (
          <section className="dashboard-grid">
            <Metric label="Всего клиентов" value={dashboard.total_clients} />
            <Metric label="Всего сделок" value={dashboard.total_deals} />
            <Metric label="Активных сделок" value={dashboard.active_deals} />
            <Metric label="Завершенных сделок" value={dashboard.completed_deals} />
            <Metric label="Замеров сегодня" value={dashboard.measurements_today} />
            <Metric label="Монтажей сегодня" value={dashboard.installations_today} />
            <Metric label="Продажи за месяц" value={money(dashboard.monthly_sales)} />
            <Metric label="Конверсия в продажу" value={`${dashboard.sales_conversion}%`} />
          </section>
        )}

        {tab === "deals" && (
          <section className="two-column wide-left">
            <div className="panel">
              <h3>{editingDealId ? `Сделка #${editingDealId}` : "Новая сделка"}</h3>
              <form className="form compact" onSubmit={saveDeal}>
                <select value={dealForm.client_id} onChange={(event) => setDealForm({ ...dealForm, client_id: Number(event.target.value) })}>
                  {clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
                </select>
                <select value={dealForm.net_type} onChange={(event) => setDealForm({ ...dealForm, net_type: event.target.value })}>
                  {meta.net_types.map((type) => <option key={type}>{type}</option>)}
                </select>
                <input type="number" min="1" value={dealForm.windows_count} onChange={(event) => setDealForm({ ...dealForm, windows_count: Number(event.target.value) })} />
                <input type="number" min="0" value={dealForm.amount} onChange={(event) => setDealForm({ ...dealForm, amount: Number(event.target.value) })} />
                <select value={dealForm.status} onChange={(event) => setDealForm({ ...dealForm, status: event.target.value })}>
                  {meta.statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
                <textarea placeholder="Комментарий" value={dealForm.comment} onChange={(event) => setDealForm({ ...dealForm, comment: event.target.value })} />
                <div className="button-row">
                  <button>{editingDealId ? "Сохранить" : "Создать сделку"}</button>
                  {editingDealId && <button type="button" className="secondary" onClick={resetDealForm}>Отмена</button>}
                </div>
              </form>
              {selectedDeal && (
                <article className="client-card">
                  <h3>Просмотр сделки #{selectedDeal.id}</h3>
                  <p><strong>{selectedDeal.client.name}</strong></p>
                  <p>{selectedDeal.client.phone}</p>
                  <p>{selectedDeal.net_type}, {selectedDeal.windows_count} ок.</p>
                  <p>{money(selectedDeal.amount)} · {selectedDeal.status}</p>
                  <p>{selectedDeal.comment || "Без комментария"}</p>
                </article>
              )}
            </div>
            <div className="panel table-panel">
              <h3>Сделки</h3>
              <table>
                <thead>
                  <tr><th>ID</th><th>Клиент</th><th>Телефон</th><th>Тип сетки</th><th>Окна</th><th>Сумма</th><th>Статус</th><th>Дата</th><th></th></tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr key={deal.id}>
                      <td>#{deal.id}</td>
                      <td>{deal.client.name}</td>
                      <td>{deal.client.phone}</td>
                      <td>{deal.net_type}</td>
                      <td>{deal.windows_count}</td>
                      <td>{money(deal.amount)}</td>
                      <td><span className="status-pill">{deal.status}</span></td>
                      <td>{new Date(deal.created_at).toLocaleDateString("ru-KZ")}</td>
                      <td>
                        <div className="table-actions">
                          <button type="button" className="secondary" onClick={() => setSelectedDeal(deal)}>Открыть</button>
                          <button type="button" className="secondary" onClick={() => editDeal(deal)}>Изменить</button>
                          <button type="button" className="danger" onClick={() => deleteDeal(deal)}>Удалить</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "kanban" && (
          <section className="kanban">
            {groupedDeals.map((column) => (
              <div className="kanban-column" key={column.status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDrop(event, column.status)}>
                <header>
                  <h3>{column.status}</h3>
                  <span>{column.deals.length}</span>
                </header>
                {column.deals.map((deal) => (
                  <article className="deal-card" key={deal.id} draggable onDragStart={(event) => onDragStart(event, deal.id)}>
                    <strong>{deal.client.name}</strong>
                    <span>{deal.net_type} · {deal.windows_count} ок.</span>
                    <b>{money(deal.amount)}</b>
                    <select value={deal.status} onChange={(event) => changeStatus(deal.id, event.target.value)}>
                      {meta.statuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </article>
                ))}
              </div>
            ))}
          </section>
        )}

        {tab === "clients" && (
          <section className="two-column">
            <div className="panel">
              <h3>Новый клиент</h3>
              <form className="form compact" onSubmit={createClient}>
                <input placeholder="Имя" required value={clientForm.name} onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })} />
                <input placeholder="Телефон" required value={clientForm.phone} onChange={(event) => setClientForm({ ...clientForm, phone: event.target.value })} />
                <input placeholder="Адрес" required value={clientForm.address} onChange={(event) => setClientForm({ ...clientForm, address: event.target.value })} />
                <select value={clientForm.source} onChange={(event) => setClientForm({ ...clientForm, source: event.target.value })}>
                  {meta.sources.map((source) => <option key={source}>{source}</option>)}
                </select>
                <textarea placeholder="Комментарий" value={clientForm.comment} onChange={(event) => setClientForm({ ...clientForm, comment: event.target.value })} />
                <button>Создать клиента</button>
              </form>
              <h3>Новая сделка</h3>
              <form className="form compact" onSubmit={saveDeal}>
                <select value={dealForm.client_id} onChange={(event) => setDealForm({ ...dealForm, client_id: Number(event.target.value) })}>
                  {clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
                </select>
                <select value={dealForm.net_type} onChange={(event) => setDealForm({ ...dealForm, net_type: event.target.value })}>
                  {meta.net_types.map((type) => <option key={type}>{type}</option>)}
                </select>
                <input type="number" min="1" value={dealForm.windows_count} onChange={(event) => setDealForm({ ...dealForm, windows_count: Number(event.target.value) })} />
                <input type="number" min="0" value={dealForm.amount} onChange={(event) => setDealForm({ ...dealForm, amount: Number(event.target.value) })} />
                <textarea placeholder="Комментарий" value={dealForm.comment} onChange={(event) => setDealForm({ ...dealForm, comment: event.target.value })} />
                <button>Создать сделку</button>
              </form>
            </div>

            <div className="panel">
              <h3>Клиенты</h3>
              <div className="client-list">
                {clients.map((client) => (
                  <button key={client.id} className={selectedClientId === client.id ? "client-row active" : "client-row"} onClick={() => setSelectedClientId(client.id)}>
                    <strong>{client.name}</strong>
                    <span>{client.phone}</span>
                  </button>
                ))}
              </div>
              {clientCard && (
                <article className="client-card">
                  <h3>{clientCard.client.name}</h3>
                  <p>{clientCard.client.phone}</p>
                  <p>{clientCard.client.address}</p>
                  <p>{clientCard.client.comment}</p>
                  <h4>Сделки</h4>
                  {clientCard.deals.map((deal) => (
                    <p key={deal.id}>{deal.status}: {deal.net_type}, {money(deal.amount)}</p>
                  ))}
                  <h4>История статусов</h4>
                  {clientCard.history.map((item) => (
                    <p key={item.id}>{item.old_status || "Старт"} → {item.new_status}</p>
                  ))}
                </article>
              )}
            </div>
          </section>
        )}

        {tab === "tasks" && (
          <section className="two-column">
            <div className="panel">
              <h3>Задача</h3>
              <form className="form compact" onSubmit={createTask}>
                <select value={taskForm.deal_id} onChange={(event) => setTaskForm({ ...taskForm, deal_id: Number(event.target.value) })}>
                  {deals.map((deal) => <option value={deal.id} key={deal.id}>{deal.client.name} · {deal.status}</option>)}
                </select>
                <select value={taskForm.manager_id} onChange={(event) => setTaskForm({ ...taskForm, manager_id: Number(event.target.value) })}>
                  {users.map((manager) => <option value={manager.id} key={manager.id}>{manager.full_name}</option>)}
                </select>
                <label>Дата замера<input type="date" value={taskForm.measurement_date} onChange={(event) => setTaskForm({ ...taskForm, measurement_date: event.target.value })} /></label>
                <label>Дата монтажа<input type="date" value={taskForm.installation_date} onChange={(event) => setTaskForm({ ...taskForm, installation_date: event.target.value })} /></label>
                <button>Сохранить задачу</button>
              </form>
            </div>
            <div className="panel table-panel">
              <h3>План работ</h3>
              <table>
                <thead>
                  <tr><th>Сделка</th><th>Замер</th><th>Монтаж</th><th>Менеджер</th></tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const deal = deals.find((item) => item.id === task.deal_id);
                    return (
                      <tr key={task.id}>
                        <td>{deal?.client.name || `#${task.deal_id}`}</td>
                        <td>{task.measurement_date || "—"}</td>
                        <td>{task.installation_date || "—"}</td>
                        <td>{task.manager.full_name}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
