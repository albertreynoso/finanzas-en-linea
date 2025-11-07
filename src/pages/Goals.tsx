import { MainLayout } from "@/components/layout/MainLayout";
import { BudgetByCategory } from "@/components/goals/BudgetByCategory";
import { SavingsGoals } from "@/components/goals/SavingsGoals";
import { BudgetRuleChart } from "@/components/goals/BudgetRuleChart";
import { FinancialHealthScore } from "@/components/goals/FinancialHealthScore";
import { ProjectionsSection } from "@/components/goals/ProjectionsSection";
import { Target } from "lucide-react";

const Goals = () => {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary">
              <Target className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Metas y Presupuestos</h1>
              <p className="mt-1 text-muted-foreground">
                Administra tus objetivos financieros y presupuestos mensuales
              </p>
            </div>
          </div>
        </div>

        {/* Financial Health Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FinancialHealthScore />
          </div>
          <div>
            <ProjectionsSection />
          </div>
        </div>

        {/* Budget Rule 50/30/20 */}
        <BudgetRuleChart />

        {/* Budget by Category */}
        <BudgetByCategory />

        {/* Savings Goals */}
        <SavingsGoals />
      </div>
    </MainLayout>
  );
};

export default Goals;
