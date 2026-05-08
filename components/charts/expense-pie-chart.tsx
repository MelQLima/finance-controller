"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#64748b", "#0ea5e9", "#a855f7", "#f59e0b", "#ef4444", "#22c55e", "#14b8a6"];

interface ExpensePieChartProps {
  data: { name: string; value: number }[];
}

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  return (
    <div className="h-60 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82}>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
