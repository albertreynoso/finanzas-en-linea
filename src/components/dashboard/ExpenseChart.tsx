import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const data = [
  { name: "Alimentación", value: 450, color: "#0ea5e9" },
  { name: "Transporte", value: 300, color: "#10b981" },
  { name: "Vivienda", value: 800, color: "#f59e0b" },
  { name: "Ocio", value: 200, color: "#8b5cf6" },
  { name: "Salud", value: 150, color: "#ec4899" },
];

export const ExpenseChart = () => {
  return (
    <Card className="p-6 shadow-card animate-fade-in">
      <h3 className="mb-6 text-lg font-semibold text-foreground">Gastos por Categoría</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `$${value}`}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};
