import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const FinancialHealthScore = () => {
  const healthScore = 75; // 0-100
  const monthComparison = 8; // % change vs last month
  
  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Excelente", color: "bg-success text-success-foreground", icon: CheckCircle };
    if (score >= 60) return { label: "Bueno", color: "bg-primary text-primary-foreground", icon: TrendingUp };
    if (score >= 40) return { label: "Regular", color: "bg-warning text-warning-foreground", icon: AlertCircle };
    return { label: "Necesita Atención", color: "bg-destructive text-destructive-foreground", icon: TrendingDown };
  };

  const status = getHealthStatus(healthScore);
  const StatusIcon = status.icon;

  const insights = [
    { label: "Presupuesto cumplido", value: "85%", positive: true },
    { label: "Ahorro mensual", value: "$450", positive: true },
    { label: "Gastos innecesarios", value: "-$180", positive: false },
  ];

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow animate-scale-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">Salud Financiera</CardTitle>
          <Badge className={status.color}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-foreground">{healthScore}</span>
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {monthComparison > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-success font-medium">+{monthComparison}% vs mes anterior</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-destructive font-medium">{monthComparison}% vs mes anterior</span>
                </>
              )}
            </div>
          </div>
          
          {/* Circular Progress Representation */}
          <div className="relative h-32 w-32">
            <svg className="transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="12"
                strokeDasharray={`${(healthScore / 100) * 339.292} 339.292`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={healthScore} className="h-3" />
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          {insights.map((insight) => (
            <div key={insight.label} className="space-y-1">
              <p className="text-xs text-muted-foreground">{insight.label}</p>
              <p className={`text-lg font-bold ${insight.positive ? 'text-success' : 'text-destructive'}`}>
                {insight.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium text-foreground">💡 Recomendaciones</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Reduce gastos en entretenimiento en un 15%</li>
            <li>• Considera incrementar tu meta de ahorro</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
