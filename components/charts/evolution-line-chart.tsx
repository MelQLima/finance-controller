"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface EvolutionPoint {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export function EvolutionLineChart({ data }: { data: EvolutionPoint[] }) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={2} />
          <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2} />
          <Line type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
