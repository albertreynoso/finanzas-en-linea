import { useState, useEffect, useMemo } from "react";
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Wallet, TrendingDown, TrendingUp, Calendar, Target, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: "expense" | "income";
  paymentMethod: string;
}

const categoryColors: Record<string, string> = {
  alimentacion: "#0ea5e9",
  transporte: "#10b981",
  vivienda: "#f59e0b",
  ocio: "#8b5cf6",
  salud: "#ec4899",
  educacion: "#06b6d4",
  servicios: "#84cc16",
  otros: "#6366f1",
};

const categoryLabels: Record<string, string> = {
  alimentacion: "Alimentación",
  transporte: "Transporte",
  vivienda: "Vivienda",
  ocio: "Ocio",
  salud: "Salud",
  educacion: "Educación",
  servicios: "Servicios",
  otros: "Otros",
};

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Cargar transacciones
  useEffect(() => {
    const q = query(collection(db, 'transacciones'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));
      
      setTransactions(transactionsData);
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar transacciones:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calcular datos del mes seleccionado
  const currentMonthData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date + 'T00:00:00');
      return tDate.getFullYear() === year && tDate.getMonth() + 1 === month;
    });

    const expenses = filtered.filter(t => t.type === 'expense');
    const income = filtered.filter(t => t.type === 'income');
    
    return {
      expenses,
      income,
      totalExpenses: expenses.reduce((sum, t) => sum + t.amount, 0),
      totalIncome: income.reduce((sum, t) => sum + t.amount, 0),
      transactionCount: filtered.length,
    };
  }, [transactions, selectedMonth]);

  // Calcular datos del mes anterior
  const previousMonthData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;

    const filtered = transactions.filter(t => {
      const tDate = new Date(t.date + 'T00:00:00');
      return tDate.getFullYear() === prevYear && tDate.getMonth() + 1 === prevMonth;
    });

    const expenses = filtered.filter(t => t.type === 'expense');
    
    return {
      totalExpenses: expenses.reduce((sum, t) => sum + t.amount, 0),
    };
  }, [transactions, selectedMonth]);

  // Calcular porcentaje de cambio
  const expenseChange = useMemo(() => {
    if (previousMonthData.totalExpenses === 0) return 0;
    return ((currentMonthData.totalExpenses - previousMonthData.totalExpenses) / previousMonthData.totalExpenses) * 100;
  }, [currentMonthData.totalExpenses, previousMonthData.totalExpenses]);

  // Balance actual
  const balance = currentMonthData.totalIncome - currentMonthData.totalExpenses;

  // Datos para gráfico de pastel (gastos por categoría)
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    
    currentMonthData.expenses.forEach(t => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = 0;
      }
      categoryTotals[t.category] += t.amount;
    });

    return Object.entries(categoryTotals)
      .map(([category, value]) => ({
        name: categoryLabels[category] || category,
        value: Number(value.toFixed(2)),
        color: categoryColors[category] || "#6366f1",
      }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthData.expenses]);

  // Datos para gráfico de tendencias (últimos 6 meses)
  const trendData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const data = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date + 'T00:00:00');
        return tDate.getFullYear() === y && tDate.getMonth() + 1 === m && t.type === 'expense';
      });

      const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      data.push({
        mes: d.toLocaleDateString('es-ES', { month: 'short' }),
        gastos: Number(total.toFixed(2)),
      });
    }

    return data;
  }, [transactions, selectedMonth]);

  // Generar opciones de meses disponibles
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      const date = new Date(t.date + 'T00:00:00');
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    
    // Agregar mes actual si no hay transacciones
    if (months.size === 0) {
      const now = new Date();
      months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }
    
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Promedio de gasto diario
  const dailyAverage = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    return currentMonthData.totalExpenses / daysInMonth;
  }, [currentMonthData.totalExpenses, selectedMonth]);

  // Categoría con mayor gasto
  const topCategory = useMemo(() => {
    if (categoryData.length === 0) return null;
    return categoryData[0];
  }, [categoryData]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header con selector de mes */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Resumen de tus finanzas personales
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => {
                  const [year, monthNum] = month.split('-');
                  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
                  const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
                  return (
                    <SelectItem key={month} value={month}>
                      {label.charAt(0).toUpperCase() + label.slice(1)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-scale-in">
          {/* Gastos del mes */}
          <Card className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Gastos del Mes</p>
                <p className="text-2xl font-bold text-destructive mt-1">
                  ${currentMonthData.totalExpenses.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {expenseChange !== 0 && (
                    <>
                      {expenseChange > 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-destructive" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-success" />
                      )}
                      <span className={`text-xs font-medium ${expenseChange > 0 ? 'text-destructive' : 'text-success'}`}>
                        {Math.abs(expenseChange).toFixed(1)}% vs mes anterior
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </Card>

          {/* Ingresos del mes */}
          <Card className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
                <p className="text-2xl font-bold text-success mt-1">
                  ${currentMonthData.totalIncome.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {currentMonthData.income.length} transacciones
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </Card>

          {/* Balance */}
          <Card className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${balance.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {balance >= 0 ? 'Superávit' : 'Déficit'} mensual
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${balance >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <Wallet className={`h-6 w-6 ${balance >= 0 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </div>
          </Card>

          {/* Promedio diario */}
          <Card className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Promedio Diario</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  ${dailyAverage.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Gasto promedio por día
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Segunda fila de stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-scale-in">
          {/* Gastos mes anterior */}
          <Card className="p-4 shadow-card">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Mes Anterior</p>
              </div>
              <p className="text-xl font-bold text-foreground">
                ${previousMonthData.totalExpenses.toFixed(2)}
              </p>
            </div>
          </Card>

          {/* Total transacciones */}
          <Card className="p-4 shadow-card">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Transacciones</p>
              </div>
              <p className="text-xl font-bold text-foreground">
                {currentMonthData.transactionCount}
              </p>
            </div>
          </Card>

          {/* Categoría principal */}
          <Card className="p-4 shadow-card">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Mayor Gasto</p>
              {topCategory ? (
                <>
                  <p className="text-xl font-bold text-foreground">{topCategory.name}</p>
                  <p className="text-sm text-muted-foreground">${topCategory.value.toFixed(2)}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sin datos</p>
              )}
            </div>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico de Gastos por Categoría */}
          <Card className="p-6 shadow-card animate-fade-in">
            <h3 className="mb-6 text-lg font-semibold text-foreground">Gastos por Categoría</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
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
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No hay gastos registrados este mes</p>
              </div>
            )}
          </Card>

          {/* Gráfico de Tendencia */}
          <Card className="p-6 shadow-card animate-fade-in">
            <h3 className="mb-6 text-lg font-semibold text-foreground">Tendencia de Gastos (6 meses)</h3>
            {trendData.some(d => d.gastos > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
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
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No hay datos suficientes para mostrar tendencias</p>
              </div>
            )}
          </Card>
        </div>

        {/* Lista de categorías detallada */}
        {categoryData.length > 0 && (
          <Card className="p-6 shadow-card animate-fade-in">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Detalle por Categoría</h3>
            <div className="space-y-4">
              {categoryData.map((cat, index) => {
                const percentage = (cat.value / currentMonthData.totalExpenses) * 100;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                        <span className="font-bold">${cat.value.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: cat.color 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;