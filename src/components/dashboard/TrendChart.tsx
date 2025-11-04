import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { mes: "Jun", gastos: 1200 },
  { mes: "Jul", gastos: 1400 },
  { mes: "Ago", gastos: 1100 },
  { mes: "Sep", gastos: 1600 },
  { mes: "Oct", gastos: 1300 },
  { mes: "Nov", gastos: 1900 },
];

export const TrendChart = () => {
  return (
    <Card className="p-6 shadow-card animate-fade-in">
      <h3 className="mb-6 text-lg font-semibold text-foreground">Tendencia de Gastos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="mes" 
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            formatter={(value) => [`$${value}`, "Gastos"]}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Line 
            type="monotone" 
            dataKey="gastos" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            dot={{ fill: "hsl(var(--primary))", r: 5 }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
