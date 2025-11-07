import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plane, 
  PiggyBank, 
  Home, 
  GraduationCap,
  Plus,
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react";

export const SavingsGoals = () => {
  const goals = [
    {
      name: "Fondo de Emergencia",
      icon: PiggyBank,
      target: 5000,
      current: 3250,
      deadline: "2025-12-31",
      monthlyContribution: 250,
      color: "hsl(var(--success))",
    },
    {
      name: "Vacaciones Europa",
      icon: Plane,
      target: 3000,
      current: 1800,
      deadline: "2025-08-15",
      monthlyContribution: 200,
      color: "hsl(var(--primary))",
    },
    {
      name: "Enganche Casa",
      icon: Home,
      target: 15000,
      current: 4500,
      deadline: "2026-06-30",
      monthlyContribution: 500,
      color: "hsl(var(--accent))",
    },
    {
      name: "Curso Especialización",
      icon: GraduationCap,
      target: 2000,
      current: 800,
      deadline: "2025-03-01",
      monthlyContribution: 150,
      color: "hsl(var(--warning))",
    },
  ];

  const calculateProjection = (current: number, monthly: number, target: number, deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const monthsLeft = Math.max(
      Math.floor((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)),
      0
    );
    
    const projectedAmount = current + (monthly * monthsLeft);
    const willReach = projectedAmount >= target;
    
    const monthsNeeded = Math.ceil((target - current) / monthly);
    
    return {
      monthsLeft,
      willReach,
      monthsNeeded,
      projectedAmount,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow animate-scale-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Metas de Ahorro</CardTitle>
            <CardDescription>
              Objetivos financieros y progreso de ahorro
            </CardDescription>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Meta
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {goals.map((goal) => {
            const Icon = goal.icon;
            const percentage = (goal.current / goal.target) * 100;
            const remaining = goal.target - goal.current;
            const projection = calculateProjection(
              goal.current,
              goal.monthlyContribution,
              goal.target,
              goal.deadline
            );

            return (
              <Card 
                key={goal.name} 
                className="shadow-sm hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20"
              >
                <CardContent className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{ backgroundColor: goal.color, opacity: 0.15 }}
                      >
                        <Icon 
                          className="h-6 w-6" 
                          style={{ color: goal.color }}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">{goal.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Meta: ${goal.target.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline"
                      className="border-primary text-primary"
                    >
                      {percentage.toFixed(0)}%
                    </Badge>
                  </div>

                  {/* Amount Progress */}
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-bold text-foreground">
                        ${goal.current.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        de ${goal.target.toLocaleString()}
                      </span>
                    </div>
                    
                    <Progress 
                      value={percentage} 
                      className="h-3"
                      style={{ 
                        '--progress-background': goal.color 
                      } as React.CSSProperties}
                    />

                    <p className="text-sm text-muted-foreground">
                      ${remaining.toLocaleString()} restantes
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Fecha límite</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {formatDate(goal.deadline)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>Aporte mensual</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        ${goal.monthlyContribution}
                      </p>
                    </div>
                  </div>

                  {/* Projection */}
                  <div 
                    className={`rounded-lg p-3 ${
                      projection.willReach 
                        ? 'bg-success/10 border border-success/20' 
                        : 'bg-warning/10 border border-warning/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <TrendingUp className={`h-4 w-4 mt-0.5 ${projection.willReach ? 'text-success' : 'text-warning'}`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-medium text-foreground">
                          Proyección
                        </p>
                        <p className={`text-xs ${projection.willReach ? 'text-success' : 'text-warning'}`}>
                          {projection.willReach 
                            ? `✓ Alcanzarás tu meta en ${projection.monthsLeft} meses` 
                            : `⚠️ Necesitas ${projection.monthsNeeded} meses (${projection.monthsNeeded - projection.monthsLeft} más)`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
