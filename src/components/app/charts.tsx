import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@/lib/finance";
import { Empty } from "./cards";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];
const tip = { contentStyle: { borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }, formatter: (v: number) => formatINR(v) };
const short = (v: number) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`);

export function IncomeExpenseBars({ data }: { data: { month: string; income: number; expense: number }[] }) {
  if (!data.some((d) => d.income || d.expense)) return <Empty title="No data yet" />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickFormatter={short} tickLine={false} axisLine={false} fontSize={12} width={48} />
        <Tooltip {...tip} cursor={{ fill: "var(--muted)" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill="var(--income)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="expense" name="Expenses" fill="var(--expense)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) return <Empty title="Nothing to show for this period" />;
  const top = data.slice(0, 5);
  const rest = data.slice(5).reduce((a, b) => a + b.value, 0);
  const d = rest > 0 ? [...top, { name: "Others", value: rest }] : top;
  const total = d.reduce((a, b) => a + b.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={d} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
              {d.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip {...tip} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {d.map((x, i) => (
          <li key={x.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="flex-1 truncate">{x.name}</span>
            <span className="text-muted-foreground">{Math.round((x.value / total) * 100)}%</span>
            <span className="w-24 text-right font-medium">{formatINR(x.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrendArea({ data, dataKey, color = "var(--expense)", xKey = "month" }: { data: Record<string, unknown>[]; dataKey: string; color?: string; xKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickFormatter={short} tickLine={false} axisLine={false} fontSize={12} width={48} />
        <Tooltip {...tip} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#g-${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MultiLine({ data, keys }: { data: Record<string, unknown>[]; keys: string[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickFormatter={short} tickLine={false} axisLine={false} fontSize={12} width={48} />
        <Tooltip {...tip} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        {keys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HBars({ data, color = "var(--primary)" }: { data: { name: string; value: number }[]; color?: string }) {
  if (!data.length) return <Empty title="Nothing to show" />;
  const max = Math.max(...data.map((d) => d.value));
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.name}>
          <div className="mb-1 flex justify-between text-sm"><span>{d.name}</span><span className="font-medium">{formatINR(d.value)}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: color }} /></div>
        </li>
      ))}
    </ul>
  );
}
