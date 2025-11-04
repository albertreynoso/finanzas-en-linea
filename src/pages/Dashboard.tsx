import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import { Wallet, TrendingDown, Calendar, Target } from "lucide-react";

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Resumen de tus finanzas personales
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Gastos del Mes"
            value="$1,900"
            icon={Wallet}
            trend={{ value: "12% vs mes anterior", isPositive: false }}
            variant="default"
          />
          <StatCard
            title="Presupuesto Restante"
            value="$600"
            icon={TrendingDown}
            trend={{ value: "24% del total", isPositive: true }}
            variant="success"
          />
          <StatCard
            title="Próximo Vencimiento"
            value="Netflix"
            icon={Calendar}
            trend={{ value: "en 2 días", isPositive: true }}
            variant="warning"
          />
          <StatCard
            title="Meta de Ahorro"
            value="65%"
            icon={Target}
            trend={{ value: "$1,300 / $2,000", isPositive: true }}
            variant="success"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ExpenseChart />
          <TrendChart />
        </div>

        {/* Upcoming Payments */}
        <UpcomingPayments />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
