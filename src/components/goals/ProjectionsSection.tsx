import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, TrendingUp, AlertTriangle, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ProjectionsSection = () => {
  const projections = [
    {
      title: "Fin de mes",
      value: "$420",
      description: "A este ritmo, terminarás con",
      icon: TrendingUp,
      color: "text-success",
    },
  ];

  const alerts = [
    {
      type: "warning",
      message: "Presupuesto de restaurantes al 92%",
      daysLeft: "5 días restantes",
    },
    {
      type: "info",
      message: "Próximo vencimiento: Netflix",
      daysLeft: "en 2 días",
    },
  ];

  const insights = [
    "Gastas más en restaurantes los fines de semana",
    "Tus gastos en transporte han aumentado 15%",
  ];

  return (
    <div className="space-y-6">
      {/* Projections Card */}
      <Card className="shadow-card animate-scale-in">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Proyecciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projections.map((projection) => {
            const Icon = projection.icon;
            return (
              <div key={projection.title} className="rounded-lg bg-gradient-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${projection.color}`} />
                  <p className="text-xs text-muted-foreground">{projection.title}</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{projection.value}</p>
                <p className="text-xs text-muted-foreground">{projection.description}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Alerts Card */}
      <Card className="shadow-card animate-scale-in">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Bell className="h-5 w-5 text-warning" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert, index) => (
            <Alert key={index} className={alert.type === "warning" ? "border-warning/50 bg-warning/5" : "border-primary/50 bg-primary/5"}>
              <AlertTriangle className={`h-4 w-4 ${alert.type === "warning" ? "text-warning" : "text-primary"}`} />
              <AlertDescription className="text-sm">
                <p className="font-medium">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.daysLeft}</p>
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* Insights Card */}
      <Card className="shadow-card animate-scale-in">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Patrones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="mt-0.5 shrink-0">
                  {index + 1}
                </Badge>
                <span className="text-muted-foreground">{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
