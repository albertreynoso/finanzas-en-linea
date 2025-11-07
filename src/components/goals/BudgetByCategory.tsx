import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Utensils, 
  Car, 
  ShoppingBag, 
  Home, 
  Heart, 
  Gamepad,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

export const BudgetByCategory = () => {
  const categories = [
    {
      name: "Alimentación",
      icon: Utensils,
      budget: 800,
      spent: 650,
      color: "hsl(var(--primary))",
      trend: "on-track",
    },
    {
      name: "Transporte",
      icon: Car,
      budget: 400,
      spent: 380,
      color: "hsl(var(--accent))",
      trend: "on-track",
    },
    {
      name: "Compras",
      icon: ShoppingBag,
      budget: 300,
      spent: 285,
      color: "hsl(var(--warning))",
      trend: "warning",
    },
    {
      name: "Vivienda",
      icon: Home,
      budget: 1200,
      spent: 1200,
      color: "hsl(var(--success))",
      trend: "completed",
    },
    {
      name: "Salud",
      icon: Heart,
      budget: 250,
      spent: 120,
      color: "hsl(199 89% 58%)",
      trend: "on-track",
    },
    {
      name: "Entretenimiento",
      icon: Gamepad,
      budget: 200,
      spent: 195,
      color: "hsl(var(--destructive))",
      trend: "danger",
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "danger":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendBadge = (trend: string, percentage: number) => {
    if (trend === "completed") {
      return <Badge variant="outline" className="border-success text-success">Completado</Badge>;
    }
    if (percentage >= 90) {
      return <Badge variant="outline" className="border-destructive text-destructive">Cerca del límite</Badge>;
    }
    if (percentage >= 80) {
      return <Badge variant="outline" className="border-warning text-warning">Precaución</Badge>;
    }
    return <Badge variant="outline" className="border-success text-success">En objetivo</Badge>;
  };

  const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const overallPercentage = (totalSpent / totalBudget) * 100;

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow animate-scale-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Presupuestos por Categoría</CardTitle>
            <CardDescription className="mt-2">
              Total: ${totalSpent.toLocaleString()} / ${totalBudget.toLocaleString()} ({overallPercentage.toFixed(0)}%)
            </CardDescription>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const percentage = (category.spent / category.budget) * 100;
            const remaining = category.budget - category.spent;

            return (
              <Card 
                key={category.name} 
                className="shadow-sm hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: category.color, opacity: 0.1 }}
                      >
                        <Icon 
                          className="h-5 w-5" 
                          style={{ color: category.color }}
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{category.name}</h4>
                      </div>
                    </div>
                    {getTrendIcon(category.trend)}
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-foreground">
                        ${category.spent}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        de ${category.budget}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {remaining > 0 
                        ? `${remaining > 0 ? '$' + remaining : '$0'} disponible`
                        : 'Presupuesto alcanzado'
                      }
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <Progress 
                      value={percentage} 
                      className="h-2"
                      style={{ 
                        '--progress-background': category.color 
                      } as React.CSSProperties}
                    />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        {percentage.toFixed(0)}%
                      </span>
                      {getTrendBadge(category.trend, percentage)}
                    </div>
                  </div>

                  {/* Alert for near limit */}
                  {percentage >= 90 && percentage < 100 && (
                    <div className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                      ⚠️ Te quedan solo ${remaining} del presupuesto
                    </div>
                  )}
                  {percentage >= 100 && (
                    <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      🚫 Presupuesto alcanzado
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
