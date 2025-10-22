import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  Pencil,
  Trash2,
  Search,
  Mail,
  ShieldCheck,
  Loader2,
  X,
  Check,
  Info,
  Link as LinkIcon,
  Wallet,
  MapPin,
  Paperclip,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * AcertÔ – Grupos (CRUD completo + Convite por Link + Despesas + Log amigável + Countdown + Comprovante PIX)
 *
 * ✔ Corrige erro: expressão regular não finalizada no split dos e‑mails
 * ✔ Cards compactos com “Ver detalhes” (Despesas e Atividades)
 * ✔ Fechamento correto de todos os JSX/motion.div
 */

// ===== Tipos =====
export type Group = {
  id: string;
  name: string;
  description?: string;
  ownerId: string; // admin do grupo
  members: { email: string; invited?: boolean }[];
  roleDateISO?: string; // data/hora do rolê (countdown)
  createdAt: string;
  updatedAt: string;
};

export type Invite = { id: string; groupId: string; token: string; createdAt: string; expiresAt?: string };

export type SplitMode = "equal_all" | "equal_selected"; // equal_all = todos do grupo; equal_selected = apenas marcados

export type Expense = {
  id: string;
  groupId: string;
  title: string;
  amount: number; // reais (no backend usar centavos)
  buyer: string; // quem comprou/lançou
  payer: string; // quem pagou
  split: SplitMode; // divisão
  participants?: string[]; // para equal_selected e equal_all (lista usada p/ preview/acertos)
  category?: string; // ex.: Transporte, Alimentação, Estadia, Ingressos, Diversos
  subcategory?: string; // ex.: Gasolina, Comida, Bebida, Acomodação
  pixKey?: string;
  location?: string;
  dateISO: string;
  proofUrl?: string; // data URL ou caminho do comprovante PIX
  paid?: boolean; // true se pagamento confirmado
  createdAt: string;
};

export type LogEntry = { id: string; groupId: string; message: string; createdAt: string };

// ===== Utils =====
const emailRegex = /[^@]+@[^.]+\..+/;
const uid = () => Math.random().toString(36).slice(2);
const nowISO = () => new Date().toISOString();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const formatBRL = (n: number) => `R$ ${n.toFixed(2)}`;
const relTime = (iso: string) => {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  const abs = Math.abs(d);
  const unit = abs < 60 ? ["s", 1] : abs < 3600 ? ["m", 60] : abs < 86400 ? ["h", 3600] : ["d", 86400];
  const val = Math.floor(abs / (unit[1] as number));
  return d >= 0 ? `${val}${unit[0]} atrás` : `em ${val}${unit[0]}`;
};
const initials = (email: string) => email.split("@")[0].slice(0, 2).toUpperCase();

// Map de categorias → subcategorias
const CATEGORY_MAP: Record<string, string[]> = {
  Transporte: ["Gasolina", "Pedágio", "Estacionamento", "Uber/Taxi", "Ônibus/Metrô"],
  Alimentação: ["Comida", "Bebida", "Mercado"],
  Estadia: ["Acomodação", "Taxas"],
  Ingressos: ["Show/Evento", "Passeio", "Museu"],
  Diversos: ["Outros"],
};
const CATEGORY_LIST = Object.keys(CATEGORY_MAP);

// ===== Mock DB (trocar por API/MySQL depois) =====
const mockDB: { groups: Group[]; invites: Invite[]; expenses: Expense[]; logs: LogEntry[] } = {
  groups: [],
  invites: [],
  expenses: [],
  logs: [],
};

function dedupeEmails(members: { email: string; invited?: boolean }[]) {
  const set = new Set<string>();
  const out: { email: string; invited?: boolean }[] = [];
  for (const m of members) {
    const e = m.email.trim().toLowerCase();
    if (!emailRegex.test(e)) continue;
    if (set.has(e)) continue;
    set.add(e);
    out.push({ email: e, invited: !!m.invited });
  }
  return out;
}

function sorter(a: Group, b: Group) {
  return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
}

// ===== Serviços (mock) =====
const GroupService = {
  async list(ownerId: string, search = ""): Promise<Group[]> {
    await wait(80);
    const base = mockDB.groups.filter((g) => g.ownerId === ownerId);
    const s = search.trim().toLowerCase();
    return (s ? base.filter((g) => g.name.toLowerCase().includes(s)) : base).sort(sorter);
  },
  async create(ownerId: string, data: Omit<Group, "id" | "ownerId" | "createdAt" | "updatedAt">): Promise<Group> {
    await wait(120);
    if (!data.name.trim()) throw new Error("Informe o nome do grupo.");
    if (mockDB.groups.some((g) => g.ownerId === ownerId && g.name.toLowerCase() === data.name.trim().toLowerCase())) {
      throw new Error("Já existe um grupo com este nome.");
    }
    const members = dedupeEmails(data.members);
    if (members.length < 1) throw new Error("Adicione pelo menos 1 membro por e‑mail.");

    const g: Group = {
      id: uid(),
      ownerId,
      name: data.name.trim(),
      description: data.description?.trim(),
      members,
      roleDateISO: data.roleDateISO,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    mockDB.groups.push(g);
    mockDB.logs.unshift({ id: uid(), groupId: g.id, message: `Grupo criado: ${g.name}.`, createdAt: nowISO() });
    return g;
  },
  async update(ownerId: string, id: string, patch: Partial<Omit<Group, "id" | "ownerId" | "createdAt">>): Promise<Group> {
    await wait(100);
    const idx = mockDB.groups.findIndex((g) => g.ownerId === ownerId && g.id === id);
    if (idx < 0) throw new Error("Grupo não encontrado.");
    if (patch.name) {
      const name = patch.name.trim().toLowerCase();
      const exists = mockDB.groups.some((g) => g.ownerId === ownerId && g.name.toLowerCase() === name && g.id !== id);
      if (exists) throw new Error("Já existe um grupo com este nome.");
    }
    const prev = mockDB.groups[idx];
    const next: Group = {
      ...prev,
      ...patch,
      name: patch.name?.trim() ?? prev.name,
      description: patch.description?.trim() ?? prev.description,
      members: patch.members ? dedupeEmails(patch.members) : prev.members,
      roleDateISO: patch.roleDateISO ?? prev.roleDateISO,
      updatedAt: nowISO(),
    };
    mockDB.groups[idx] = next;
    mockDB.logs.unshift({ id: uid(), groupId: id, message: `Grupo atualizado: ${next.name}.`, createdAt: nowISO() });
    return next;
  },
  async remove(ownerId: string, id: string) {
    await wait(80);
    const before = mockDB.groups.length;
    mockDB.groups = mockDB.groups.filter((g) => !(g.ownerId === ownerId && g.id === id));
    if (mockDB.groups.length === before) throw new Error("Grupo não encontrado.");
    mockDB.expenses = mockDB.expenses.filter((e) => e.groupId !== id);
    mockDB.invites = mockDB.invites.filter((i) => i.groupId !== id);
    mockDB.logs = mockDB.logs.filter((l) => l.groupId !== id);
  },
};

const InviteService = {
  async create(groupId: string): Promise<Invite> {
    await wait(60);
    const inv: Invite = { id: uid(), groupId, token: uid(), createdAt: nowISO() };
    mockDB.invites.push(inv);
    mockDB.logs.unshift({ id: uid(), groupId, message: "Convite gerado.", createdAt: nowISO() });
    return inv;
  },
  async list(groupId: string) {
    await wait(40);
    return mockDB.invites.filter((i) => i.groupId === groupId);
  },
};

const ExpenseService = {
  async list(groupId: string): Promise<Expense[]> {
    await wait(60);
    return mockDB.expenses
      .filter((e) => e.groupId === groupId)
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  },
  async create(groupId: string, data: Omit<Expense, "id" | "groupId" | "createdAt">): Promise<Expense> {
    await wait(100);
    if (!data.title.trim()) throw new Error("Informe o título da despesa.");
    if (!isFinite(data.amount) || data.amount <= 0) throw new Error("Valor inválido.");
    const group = mockDB.groups.find((g) => g.id === groupId);
    const allEmails = new Set(group ? group.members.map((m) => m.email) : []);
    if (!allEmails.has(data.buyer)) throw new Error("Comprador não faz parte do grupo.");
    if (!allEmails.has(data.payer)) throw new Error("Pagador não faz parte do grupo.");

    // se split for equal_selected, deve haver pelo menos 1 participante marcado
    if (data.split === "equal_selected") {
      if (!data.participants || data.participants.length === 0) {
        throw new Error("Selecione ao menos 1 participante para dividir.");
      }
      for (const p of data.participants) {
        if (!allEmails.has(p)) throw new Error("Participante inválido na divisão.");
      }
    }

    const exp: Expense = {
      id: uid(),
      groupId,
      createdAt: nowISO(),
      proofUrl: data.proofUrl,
      paid: !!data.paid,
      ...data,
    } as Expense;
    mockDB.expenses.push(exp);

    const cat = exp.category ? ` [${exp.category}${exp.subcategory ? `/${exp.subcategory}` : ""}]` : "";
    const price = formatBRL(exp.amount);
    const loc = exp.location ? ` no ${exp.location}` : "";
    const status = exp.paid ? "(pago)" : "— pendente";
    const splitLabel = exp.split === "equal_selected" ? ` entre ${exp.participants?.length} participante(s)` : " entre todos";
    const msg = `${exp.buyer} comprou "${exp.title}"${cat}${loc} por ${price} ${status} para ${exp.payer}${splitLabel}.`;
    mockDB.logs.unshift({ id: uid(), groupId, message: msg, createdAt: nowISO() });
    if (exp.paid)
      mockDB.logs.unshift({ id: uid(), groupId, message: `Pagamento confirmado para "${exp.title}".`, createdAt: nowISO() });

    return exp;
  },
  async remove(id: string) {
    await wait(60);
    const exp = mockDB.expenses.find((e) => e.id === id);
    mockDB.expenses = mockDB.expenses.filter((e) => e.id !== id);
    if (exp)
      mockDB.logs.unshift({ id: uid(), groupId: exp.groupId, message: `Despesa removida: ${exp.title}.`, createdAt: nowISO() });
  },
  async markPaid(id: string, by: string) {
    await wait(40);
    const exp = mockDB.expenses.find((e) => e.id === id);
    if (!exp) throw new Error("Despesa não encontrada");
    exp.paid = true;
    mockDB.logs.unshift({ id: uid(), groupId: exp.groupId, message: `${by} marcou como pago: ${exp.title}.`, createdAt: nowISO() });
    return exp;
  },
  async updateProof(id: string, fileDataUrl: string, by: string) {
    await wait(60);
    const exp = mockDB.expenses.find((e) => e.id === id);
    if (!exp) throw new Error("Despesa não encontrada");
    exp.proofUrl = fileDataUrl;
    exp.paid = true;
    mockDB.logs.unshift({ id: uid(), groupId: exp.groupId, message: `${by} anexou comprovante PIX para "${exp.title}" (pagamento confirmado).`, createdAt: nowISO() });
    return exp;
  },
};

// ===== Página principal =====
export default function GroupsPageAcerto() {
  const ownerId = "admin@acerto.app"; // substituir pelo id/email autenticado
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Group[]>([]);

  // Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await GroupService.list(ownerId, "");
        setItems(data);
      } catch (e: any) {
        setError(e.message || "Falha ao carregar grupos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter((g) => g.name.toLowerCase().includes(s));
  }, [items, search]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(g: Group) {
    setEditing(g);
    setModalOpen(true);
  }

  async function handleSave(payload: { name: string; description?: string; emails: string[]; roleDateISO?: string }) {
    try {
      setError(null);
      const members = payload.emails.map((e) => ({ email: e }));
      if (editing) {
        const u = await GroupService.update(ownerId, editing.id, {
          name: payload.name,
          description: payload.description,
          members,
          roleDateISO: payload.roleDateISO,
        });
        setItems((prev) => prev.map((x) => (x.id === u.id ? u : x)));
      } else {
        const created = await GroupService.create(ownerId, {
          name: payload.name,
          description: payload.description,
          members,
          roleDateISO: payload.roleDateISO,
        });
        setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setModalOpen(false);
      setEditing(null);
    } catch (e: any) {
      setError(e.message || "Erro ao salvar grupo");
    }
  }

  async function handleDelete(id: string) {
    try {
      await GroupService.remove(ownerId, id);
      setItems((prev) => prev.filter((g) => g.id !== id));
      setConfirm(null);
    } catch (e: any) {
      setError(e.message || "Erro ao excluir grupo");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f2a24] text-white p-4 md:p-8 relative overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="text-emerald-300">AcertÔ</span> <span className="text-emerald-100/80">— Grupos</span>
          </h1>
          <p className="text-sm text-emerald-200/80 mt-1 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Crie, convide e registre despesas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreate} className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> Criar grupo
          </Button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto mt-6">
        <div className="flex items-center gap-2 bg-emerald-900/50 border border-emerald-800/60 rounded-xl p-2">
          <Search className="h-5 w-5 text-emerald-200/80 ml-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar grupos…"
            className="bg-transparent outline-none w-full text-emerald-50 placeholder:text-emerald-200/60"
          />
        </div>
      </section>

      <main className="max-w-6xl mx-auto mt-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-800/60 bg-red-900/40 p-3 text-sm text-red-100 flex items-center gap-2">
            <Info className="h-4 w-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-emerald-100/80">
            <Loader2 className="h-6 w-6 mr-2 animate-spin" /> Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onCreate={openCreate} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((g) => (
              <GroupCard
                key={g.id}
                g={g}
                ownerId={ownerId}
                onEdit={() => openEdit(g)}
                onDelete={() => setConfirm({ id: g.id, name: g.name })}
              />
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {modalOpen && (
          <GroupModal
            key={editing?.id || "create"}
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditing(null);
            }}
            initial={editing}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirm && (
          <ConfirmDeleteModal
            name={confirm.name}
            onCancel={() => setConfirm(null)}
            onConfirm={() => handleDelete(confirm.id)}
          />
        )}
      </AnimatePresence>

      {/* Placeholder de integração MySQL */}
      <section className="max-w-6xl mx-auto mt-10">
        <Card className="bg-emerald-900/40 border-emerald-800/60 text-emerald-100">
          <CardContent className="p-4 text-xs">
            <p className="font-semibold mb-1">MySQL — ponto de integração</p>
            <p>
              Endpoints: <code>GET /api/groups</code>, <code>POST /api/groups</code>,
              <code> PATCH /api/groups/:id</code>, <code>DELETE /api/groups/:id</code>.
            </p>
            <p>
              Extras: <code>POST /api/groups/:id/invites</code>, <code>GET /api/groups/:id/expenses</code>,
              <code> POST /api/groups/:id/expenses</code>, <code>GET /api/groups/:id/logs</code>.
            </p>
            <p>
              Schema: <code>groups</code>, <code>group_members</code>, <code>group_invites</code>, <code>expenses</code>,
              <code> group_logs</code>.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-20 text-emerald-100/80">
      <Users className="h-12 w-12 mx-auto mb-3 opacity-80" />
      <p className="text-lg">Você ainda não tem grupos.</p>
      <p className="text-sm mt-1">Crie um grupo e convide amigos para dividir despesas.</p>
      <Button onClick={onCreate} className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-xl">
        <Plus className="h-4 w-4 mr-2" /> Criar grupo
      </Button>
    </div>
  );
}

function GroupCard({ g, ownerId, onEdit, onDelete }: { g: Group; ownerId: string; onEdit: () => void; onDelete: () => void }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [exps, setExps] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expOpen, setExpOpen] = useState(false);
  const isAdmin = g.ownerId === ownerId; // controla UI/permite ações

  useEffect(() => {
    (async () => {
      setInvites(await InviteService.list(g.id));
      setExps(await ExpenseService.list(g.id));
      setLogs(mockDB.logs.filter((l) => l.groupId === g.id).slice(0, 6));
    })();
  }, [g.id]);

  async function newInvite() {
    if (!isAdmin) return alert("Somente o administrador pode gerar convites.");
    const inv = await InviteService.create(g.id);
    setInvites((prev) => [inv, ...prev]);
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inv.token}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link de convite copiado!\n" + url);
    } catch {
      prompt("Copie o link de convite:", url);
    }
  }

  async function handleExpenseCreate(data: Omit<Expense, "id" | "groupId" | "createdAt">) {
    try {
      const exp = await ExpenseService.create(g.id, data);
      setExps((p) => [exp, ...p]);
      setLogs(mockDB.logs.filter((l) => l.groupId === g.id).slice(0, 6));
      setExpOpen(false);
    } catch (e: any) {
      alert(e.message || "Erro ao criar despesa");
    }
  }

  const members = g.members.map((m) => m.email).join(", ");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-800/60 bg-emerald-900/50 overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-center justify-between text-xs text-emerald-100/70 mb-2">
          <span>
            Admin: <span className="font-semibold">{g.ownerId}</span>
          </span>
          {g.roleDateISO && <CountdownBadge dateISO={g.roleDateISO} />}
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-emerald-50">{g.name}</h3>
            {g.description && (
              <p className="text-sm text-emerald-100/80 mt-0.5">{g.description}</p>
            )}
            <p className="text-xs text-emerald-100/70 mt-2">
              <Users className="inline-block h-4 w-4 mr-1" /> {g.members.length} membro(s)
            </p>
            <div className="mt-2 text-xs text-emerald-100/80">
              {members || "Sem membros além do admin"}
            </div>
          </div>

          <div className="flex gap-1">
            {isAdmin && (
              <>
                <Button
                  variant="ghost"
                  className="bg-transparent hover:bg-emerald-800/40"
                  onClick={newInvite}
                  title="Gerar link de convite"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="bg-transparent hover:bg-emerald-800/40"
                  onClick={() => setExpOpen(true)}
                  title="Adicionar despesa"
                >
                  <Wallet className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="bg-transparent hover:bg-emerald-800/40"
                  onClick={onEdit}
                  title="Editar grupo"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="bg-transparent hover:bg-red-900/30"
                  onClick={onDelete}
                  title="Excluir grupo"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {exps.length > 0 && (
          <div className="mt-4 border-t border-emerald-800/60 pt-3">
            <p className="text-sm font-semibold text-emerald-50 mb-2">Últimas despesas</p>
            <ul className="space-y-2">
              {exps.slice(0, 3).map((e) => (
                <ExpenseRow
                  key={e.id}
                  e={e}
                  ownerId={ownerId}
                  groupId={g.id}
                  isAdmin={isAdmin}
                  onChanged={async () => {
                    const list = await ExpenseService.list(g.id);
                    setExps(list);
                    setLogs(mockDB.logs.filter((l) => l.groupId === g.id).slice(0, 6));
                  }}
                />
              ))}
            </ul>
          </div>
        )}

        {invites.length > 0 && (
          <div className="mt-3 text-xs text-emerald-100/70">
            <p className="font-semibold mb-1">Convites</p>
            {invites.slice(0, 2).map((i) => (
              <div key={i.id} className="truncate">
                {typeof window !== "undefined" ? `${window.location.origin}/invite/${i.token}` : `/invite/${i.token}`}
              </div>
            ))}
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-4 border-t border-emerald-800/60 pt-3">
            <p className="text-sm font-semibold text-emerald-50 mb-2">Atividades</p>
            <ul className="space-y-2 text-xs text-emerald-100/90">
              {logs.map((l) => (
                <LogItem key={l.id} log={l} />
              ))}
            </ul>
          </div>
        )}

        <AnimatePresence>
          {expOpen && (
            <ExpenseModal
              open={true}
              onClose={() => setExpOpen(false)}
              group={g}
              onSave={handleExpenseCreate}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function GroupModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: Group | null;
  onSave: (p: { name: string; description?: string; emails: string[]; roleDateISO?: string }) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [emails, setEmails] = useState<string>(
    initial ? initial.members.map((m) => m.email).join(", ") : ""
  );
  const [dateValue, setDateValue] = useState<string>(
    initial?.roleDateISO ? initial.roleDateISO.slice(0, 16) : ""
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initial?.name || "");
    setDescription(initial?.description || "");
    setEmails(initial ? initial.members.map((m) => m.email).join(", ") : "");
    setDateValue(initial?.roleDateISO ? initial.roleDateISO.slice(0, 16) : "");
  }, [initial]);

  function submit() {
    setError(null);
    const uniqueEmails = Array.from(
      new Set(
        emails
          .split(/[;,\s]+/) // ✅ corrigido: fecha regex e aceita ; , e espaços
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      )
    );

    if (!name.trim()) {
      setError("Informe o nome do grupo.");
      return;
    }
    if (uniqueEmails.length < 1) {
      setError("Adicione pelo menos 1 e‑mail de membro.");
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      emails: uniqueEmails,
      roleDateISO: dateValue ? new Date(dateValue).toISOString() : undefined,
    });
  }

  if (!open) return null;

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.98, y: 8, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.98, y: 8, opacity: 0 }}
        className="relative w-full max-w-xl rounded-2xl border border-emerald-800/60 bg-emerald-900/90 backdrop-blur p-5"
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-semibold text-emerald-50">{initial ? "Editar grupo" : "Novo grupo"}</h3>
            <p className="text-xs text-emerald-100/70">Convide membros por e‑mail e (opcional) defina a data do rolê.</p>
          </div>
          <Button variant="ghost" className="hover:bg-emerald-800/40" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="g-name">Nome do grupo</Label>
            <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Viagem SP, República 204, Rolê sexta" className="bg-emerald-950/40 border-emerald-800/70" />
          </div>
          <div>
            <Label htmlFor="g-desc">Descrição (opcional)</Label>
            <Input id="g-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Amigos da facul" className="bg-emerald-950/40 border-emerald-800/70" />
          </div>
          <div>
            <Label htmlFor="g-emails">Membros por e‑mail (separar por vírgula, ponto e vírgula ou espaço)</Label>
            <Input id="g-emails" value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="gabi@email.com; miguel@email.com" className="bg-emerald-950/40 border-emerald-800/70" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="g-date">Data do rolê (opcional)</Label>
              <input id="g-date" type="datetime-local" value={dateValue} onChange={(e) => setDateValue(e.target.value)} className="w-full rounded-md bg-emerald-950/40 border border-emerald-800/70 p-2 text-emerald-50" />
            </div>
          </div>

          {error && <div className="text-sm text-red-200/90 bg-red-900/40 border border-red-800/50 rounded-lg p-3">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="border-emerald-700/60 bg-transparent hover:bg-emerald-800/40" onClick={onClose}>Cancelar</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950" onClick={submit}>{initial ? "Salvar" : "Criar grupo"}</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ConfirmDeleteModal({ name, onCancel, onConfirm }: { name: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <motion.div initial={{ scale: 0.98, y: 8, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.98, y: 8, opacity: 0 }} className="relative w-full max-w-md rounded-2xl border border-emerald-800/60 bg-emerald-900/90 backdrop-blur p-5">
        <h3 className="text-lg font-semibold text-emerald-50">Excluir grupo</h3>
        <p className="text-sm text-emerald-100/80 mt-1">Tem certeza que deseja excluir <strong>{name}</strong>? Esta ação não pode ser desfeita.</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" className="border-emerald-700/60 bg-transparent hover:bg-emerald-800/40" onClick={onCancel}>Cancelar</Button>
          <Button className="bg-red-600 hover:bg-red-500 text-white" onClick={onConfirm}><Trash2 className="h-4 w-4 mr-2"/>Excluir</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ====== Expense (Modal) ======
function ExpenseModal({
  open,
  onClose,
  group,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  group: Group;
  onSave: (e: Omit<Expense, "id" | "groupId" | "createdAt">) => void;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0");
  const [buyer, setBuyer] = useState(group.members[0]?.email || "");
  const [payer, setPayer] = useState(group.members[0]?.email || "");
  const [pixKey, setPixKey] = useState("");
  const [location, setLocation] = useState("");
  const [dateISO, setDateISO] = useState(new Date().toISOString().slice(0, 10));
  const [err, setErr] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofName, setProofName] = useState<string>("");

  // Categoria/Subcategoria + Divisão
  const [category, setCategory] = useState<string>(CATEGORY_LIST[0]);
  const [subcategory, setSubcategory] = useState<string>(CATEGORY_MAP[CATEGORY_LIST[0]][0]);
  const [split, setSplit] = useState<SplitMode>("equal_all");
  const [participantsSelected, setParticipantsSelected] = useState<string[]>(group.members.map((m) => m.email));

  useEffect(() => {
    setSubcategory(CATEGORY_MAP[category]?.[0] || "Outros");
  }, [category]);

  function toggleParticipant(email: string) {
    setParticipantsSelected((prev) => (prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]));
  }

  const effectiveParticipants = useMemo(() => {
    return split === "equal_all" ? group.members.map((m) => m.email) : participantsSelected;
  }, [split, participantsSelected, group.members]);

  const preview = useMemo(() => {
    const value = Number(String(amount).replace(",", "."));
    const list = effectiveParticipants;
    if (!isFinite(value) || value <= 0 || list.length === 0) return { perHead: 0, items: [] as { email: string; share: number }[] };
    const perHead = Number((value / list.length).toFixed(2));
    return { perHead, items: list.map((email) => ({ email, share: perHead })) };
  }, [amount, effectiveParticipants]);

  function submit() {
    setErr(null);
    const value = Number(String(amount).replace(",", "."));
    if (!title.trim()) return setErr("Informe o título da despesa.");
    if (!isFinite(value) || value <= 0) return setErr("Valor inválido.");
    if (!emailRegex.test(buyer)) return setErr("Comprador inválido.");
    if (!emailRegex.test(payer)) return setErr("Pagador inválido.");
    if (split === "equal_selected" && effectiveParticipants.length === 0) return setErr("Selecione ao menos 1 participante para dividir.");

    const proceed = (proofUrl?: string) => {
      const payload: Omit<Expense, "id" | "groupId" | "createdAt"> = {
        title: title.trim(),
        amount: Number(value.toFixed(2)),
        buyer: buyer.toLowerCase(),
        payer: payer.toLowerCase(),
        split,
        participants: effectiveParticipants,
        category,
        subcategory,
        pixKey: pixKey.trim() || undefined,
        location: location.trim() || undefined,
        dateISO: new Date(dateISO).toISOString(),
        proofUrl,
        paid: !!proofUrl,
      };
      onSave(payload);
    };

    if (proofFile) {
      const fr = new FileReader();
      fr.onload = () => proceed(String(fr.result));
      fr.readAsDataURL(proofFile);
    } else {
      proceed();
    }
  }

  if (!open) return null;

  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div initial={{ scale: 0.98, y: 8, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.98, y: 8, opacity: 0 }} className="relative w-full max-w-lg rounded-2xl border border-emerald-800/60 bg-emerald-900/90 backdrop-blur p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-semibold text-emerald-50">Nova despesa</h3>
            <p className="text-xs text-emerald-100/70">Divisão igual entre todos os membros por padrão.</p>
          </div>
          <Button variant="ghost" className="hover:bg-emerald-800/40" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="exp-title">Título</Label>
            <Input id="exp-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Coca, gasolina, ingresso" className="bg-emerald-950/40 border-emerald-800/70" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="exp-amount">Valor (R$)</Label>
              <Input id="exp-amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="bg-emerald-950/40 border-emerald-800/70" />
            </div>
            <div>
              <Label htmlFor="exp-date">Data</Label>
              <Input id="exp-date" type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} className="bg-emerald-950/40 border-emerald-800/70" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md bg-emerald-950/40 border border-emerald-800/70 p-2 text-emerald-50">
                {CATEGORY_LIST.map((c) => (
                  <option key={c} value={c} className="bg-emerald-900">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Subcategoria</Label>
              <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="w-full rounded-md bg-emerald-950/40 border border-emerald-800/70 p-2 text-emerald-50">
                {(CATEGORY_MAP[category] || ["Outros"]).map((s) => (
                  <option key={s} value={s} className="bg-emerald-900">{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="exp-buyer">Quem comprou</Label>
            <select id="exp-buyer" value={buyer} onChange={(e) => setBuyer(e.target.value)} className="w-full rounded-md bg-emerald-950/40 border border-emerald-800/70 p-2 text-emerald-50 mb-3">
              {group.members.map((m) => (
                <option key={m.email} value={m.email} className="bg-emerald-900">{m.email}</option>
              ))}
            </select>
            <Label htmlFor="exp-payer">Quem pagou</Label>
            <select id="exp-payer" value={payer} onChange={(e) => setPayer(e.target.value)} className="w-full rounded-md bg-emerald-950/40 border border-emerald-800/70 p-2 text-emerald-50">
              {group.members.map((m) => (
                <option key={m.email} value={m.email} className="bg-emerald-900">{m.email}</option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Divisão</Label>
              <select value={split} onChange={(e) => setSplit(e.target.value as SplitMode)} className="w-full rounded-md bg-emerald-950/40 border border-emerald-800/70 p-2 text-emerald-50">
                <option value="equal_all" className="bg-emerald-900">Igual entre TODOS</option>
                <option value="equal_selected" className="bg-emerald-900">Igual entre SELECIONADOS</option>
              </select>
              <p className="text-xs text-emerald-100/70 mt-1">Para gasolina/caronas, use "selecionados".</p>
            </div>
            <div>
              <Label htmlFor="exp-pix">Chave PIX do pagador (opcional)</Label>
              <Input id="exp-pix" value={pixKey} onChange={(e) => setPixKey(e.target.value)} placeholder="CPF, e‑mail, aleatória…" className="bg-emerald-950/40 border-emerald-800/70" />
            </div>
          </div>

          {split === "equal_selected" && (
            <div>
              <Label>Participantes da divisão</Label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.members.map((m) => (
                  <label key={m.email} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={participantsSelected.includes(m.email)} onChange={() => toggleParticipant(m.email)} />
                    {m.email}
                  </label>
                ))}
              </div>
              <p className="text-xs text-emerald-100/70 mt-1">Marcados dividirão igualmente o valor.</p>
            </div>
          )}

          {/* Prévia automática da divisão */}
          <div className="rounded-xl border border-emerald-800/60 bg-emerald-900/40 p-3">
            <div className="text-sm font-semibold text-emerald-50">Prévia de divisão</div>
            <div className="text-xs text-emerald-100/80">{effectiveParticipants.length} participante(s) • {preview.perHead > 0 ? `≈ ${formatBRL(preview.perHead)} por pessoa` : "valor/participantes pendentes"}</div>
            {preview.items.length > 0 && (
              <ul className="mt-2 max-h-32 overflow-auto space-y-1 text-xs">
                {preview.items.map((it) => (
                  <li key={it.email} className="flex justify-between">
                    <span className="truncate mr-2">{it.email}</span>
                    <span className="font-medium">{formatBRL(it.share)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <Label htmlFor="exp-loc">Local do rolê (opcional)</Label>
            <div className="relative">
              <Input id="exp-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex.: Azeitona Bar, Ibirapuera…" className="bg-emerald-950/40 border-emerald-800/70 pl-9" />
              <MapPin className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-emerald-200/80" />
            </div>
          </div>

          <div>
            <Label htmlFor="exp-proof">Comprovante PIX (opcional)</Label>
            <div className="flex items-center gap-3">
              <input id="exp-proof" type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0] ?? null; setProofFile(f); setProofName(f ? f.name : ""); }} />
              <Button type="button" variant="outline" className="border-emerald-700/60 bg-transparent hover:bg-emerald-800/40" onClick={() => document.getElementById("exp-proof")?.click()}>
                <Paperclip className="h-4 w-4 mr-2" /> Selecionar arquivo
              </Button>
              <span className="text-xs text-emerald-200 truncate max-w-[220px]">{proofName || "Nenhum arquivo selecionado"}</span>
            </div>
            <p className="text-xs text-emerald-200 mt-1">Se anexar, a despesa será marcada como paga automaticamente.</p>
          </div>

          {err && <div className="text-sm text-red-200/90 bg-red-900/40 border border-red-800/50 rounded-lg p-3">{err}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" className="border-emerald-700/60 bg-transparent hover:bg-emerald-800/40" onClick={onClose}>Cancelar</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950" onClick={submit}><Wallet className="h-4 w-4 mr-2" /> Salvar despesa</Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ====== Itens compactos (Log + Despesa) ======
function LogItem({ log }: { log: LogEntry }) {
  const [open, setOpen] = useState(false);
  const when = relTime(log.createdAt);
  const msg = log.message || "";

  const compra = msg.match(/^(?<buyer>[^\s]+) comprou "(?<title>[^"]+)"(?<loc>[^p]*) por R\$ (?<amount>[0-9.,]+).* para (?<payer>[^.]+)\./);
  const pago = msg.match(/^Pagamento confirmado para "(?<title>[^"]+)"\./);
  const remov = msg.match(/^Despesa removida: (?<title>.+)\./);
  const convite = /Convite gerado/.test(msg);
  const gCreated = /Grupo criado/.test(msg);
  const gUpdated = /Grupo atualizado/.test(msg);

  let icon: JSX.Element = <Info className="h-3.5 w-3.5" />;
  let title = msg;
  let chips: { label: string }[] = [];
  let avatar = "LG";

  if (compra?.groups) {
    icon = <Wallet className="h-3.5 w-3.5" />;
    title = `Compra: ${compra.groups.title}`;
    const amount = Number((compra.groups.amount || "0").replace(",", "."));
    const loc = (compra.groups.loc || "").trim();
    chips = [
      { label: `Valor ${formatBRL(amount)}` },
      ...(loc ? [{ label: loc.replace(/\s*no\s*/, "📍 ") }] : []),
      { label: `Comprou ${compra.groups.buyer}` },
      { label: `Para ${compra.groups.payer}` },
    ];
    avatar = initials(compra.groups.buyer);
  } else if (pago?.groups) {
    icon = <Check className="h-3.5 w-3.5" />;
    title = `Pagamento confirmado: ${pago.groups.title}`;
    chips = [{ label: "PIX" }];
    avatar = "OK";
  } else if (remov?.groups) {
    icon = <Trash2 className="h-3.5 w-3.5" />;
    title = `Despesa removida: ${remov.groups.title}`;
    avatar = "RM";
  } else if (convite) {
    icon = <LinkIcon className="h-3.5 w-3.5" />;
    title = "Convite gerado";
    avatar = "IN";
  } else if (gCreated) {
    icon = <ShieldCheck className="h-3.5 w-3.5" />;
    title = "Grupo criado";
    avatar = "GP";
  } else if (gUpdated) {
    icon = <Pencil className="h-3.5 w-3.5" />;
    title = "Grupo atualizado";
    avatar = "GP";
  }

  return (
    <li className="flex items-start gap-3">
      <div className="h-6 w-6 rounded-full bg-emerald-700/40 text-emerald-100 grid place-items-center text-[10px] font-bold">{avatar}</div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="font-medium text-emerald-50">{title}</span>
          <span className="text-emerald-200/70">• {when}</span>
          <button className="ml-auto inline-flex items-center gap-1 text-emerald-200/80 hover:text-emerald-100 text-[11px]" onClick={() => setOpen((v) => !v)}>
            Detalhes
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`} />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              {chips.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {chips.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-emerald-800/40 border border-emerald-700/50 text-[11px]">{c.label}</span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-emerald-100/80">{msg}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

function ExpenseRow({
  e,
  ownerId,
  groupId,
  isAdmin,
  onChanged,
}: {
  e: Expense;
  ownerId: string;
  groupId: string;
  isAdmin: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className="text-sm">
      <div className="flex items-center gap-2">
        <div className="font-medium text-emerald-50">
          {e.title} • {formatBRL(e.amount)}
          {e.paid ? (
            <span className="ml-2 text-xs bg-emerald-700/60 px-2 py-0.5 rounded">Pago</span>
          ) : (
            <span className="ml-2 text-xs text-amber-300">Pendente</span>
          )}
        </div>
        <span className="text-emerald-100/70 text-xs">• {new Date(e.dateISO).toLocaleDateString()}</span>
        <button className="ml-auto inline-flex items-center gap-1 text-emerald-200/80 hover:text-emerald-100 text-[11px]" onClick={() => setOpen((v) => !v)}>
          Ver detalhes
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`} />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="text-emerald-100/75 mt-2">
              {e.category && (
                <span className="mr-2 text-xs bg-emerald-800/40 border border-emerald-700/50 px-2 py-0.5 rounded-full">
                  {e.category}{e.subcategory ? `/${e.subcategory}` : ''}
                </span>
              )}
              <div className="mt-1">Comprou: {e.buyer} • Pagou: {e.payer} {e.location ? `• ${e.location}` : ''}</div>
              {e.participants && e.participants.length > 0 && (
                <div className="mt-1 text-xs">
                  <span className="opacity-80">Divisão: {e.split === 'equal_selected' ? 'selecionados' : 'todos'}</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {e.participants.map((p) => (
                      <span key={p} className="px-2 py-0.5 rounded-full bg-emerald-800/30 border border-emerald-700/40">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {e.proofUrl && (
                <div className="mt-2">
                  <a className="text-xs underline inline-flex items-center gap-1" href={e.proofUrl} target="_blank" rel="noreferrer">
                    <Paperclip className="h-3 w-3" /> Ver comprovante
                  </a>
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => ExpenseService.remove(e.id).then(async () => { await onChanged(); })} className="text-emerald-200/70 hover:text-red-300 text-xs">Excluir</button>
                {!e.paid && (
                  <>
                    {!e.proofUrl && (
                      <>
                        <label htmlFor={`proof-${e.id}`} className="text-emerald-200/70 hover:text-emerald-100 text-xs cursor-pointer inline-flex items-center gap-1">
                          <Paperclip className="h-3 w-3" /> Adicionar comprovante
                        </label>
                        <input id={`proof-${e.id}`} type="file" accept="image/*,application/pdf" className="hidden" onChange={async (ev) => { const file = ev.target.files?.[0]; if (!file) return; const fr = new FileReader(); fr.onload = async () => { const dataUrl = String(fr.result); await ExpenseService.updateProof(e.id, dataUrl, ownerId); await onChanged(); }; fr.readAsDataURL(file); }} />
                      </>
                    )}
                    <button onClick={() => ExpenseService.markPaid(e.id, ownerId).then(async () => { await onChanged(); })} className="text-emerald-200/70 hover:text-emerald-100 text-xs">Marcar como pago</button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function CountdownBadge({ dateISO }: { dateISO: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const target = new Date(dateISO).getTime();
  const diff = target - now;
  const past = diff <= 0;
  const abs = Math.abs(diff) / 1000;
  const d = Math.floor(abs / 86400);
  const h = Math.floor((abs % 86400) / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.floor(abs % 60);
  const label = past ? `rolê começou há ${d}d ${h}h ${m}m ${s}s` : `falta ${d}d ${h}h ${m}m ${s}s`;
  return (
    <span className={`px-2 py-1 rounded text-[11px] ${past ? 'bg-emerald-800/40' : 'bg-emerald-700/50'} border border-emerald-600/40`}>
      {label}
    </span>
  );
}
