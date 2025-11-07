import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export const BudgetRuleChart = () => {
  const idealDistribution = [
    { name: "Necesidades", value: 50, color: "hsl(var(--primary))" },
    { name: "Gustos", value: 30, color: "hsl(var(--accent))" },
    { name: "Ahorros", value: 20, color: "hsl(var(--success))" },
  ];

  const currentDistribution = [
    { name: "Necesidades", current: 55, ideal: 50, color: "hsl(var(--primary))" },
    { name: "Gustos", current: 35, ideal: 30, color: "hsl(var(--accent))" },
    { name: "Ahorros", current: 10, ideal: 20, color: "hsl(var(--success))" },
  ];

  const currentData = [
    { name: "Necesidades", value: 55, color: "hsl(var(--primary))" },
    { name: "Gustos", value: 35, color: "hsl(var(--accent))" },
    { name: "Ahorros", value: 10, color: "hsl(var(--success))" },
  ];

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-shadow animate-scale-in">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Regla 50/30/20</CardTitle>
        <CardDescription>
          Distribución ideal: 50% necesidades, 30% gustos, 20% ahorros
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Charts */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                Distribución Ideal
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={idealDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {idealDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                Tu Distribución Actual
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={currentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {currentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison Bars */}
          <div className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm font-medium mb-4">Comparación con el ideal</p>
              <div className="space-y-6">
                {currentDistribution.map((item) => {
                  const difference = item.current - item.ideal;
                  const isOver = difference > 0;

                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {item.current}% / {item.ideal}%
                          </span>
                          {difference !== 0 && (
                            <span className={`text-xs font-medium ${isOver ? 'text-destructive' : 'text-success'}`}>
                              {isOver ? '+' : ''}{difference}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Progress 
                          value={item.current} 
                          className="h-2"
                          style={{ 
                            '--progress-background': item.color 
                          } as React.CSSProperties}
                        />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <div 
                            className="h-1.5 rounded-full"
                            style={{ 
                              width: `${item.ideal}%`,
                              backgroundColor: item.color,
                              opacity: 0.3
                            }}
                          />
                          <span>Meta</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-lg bg-gradient-primary p-4 text-primary-foreground">
              <p className="text-sm font-medium mb-2">📊 Análisis</p>
              <ul className="space-y-1 text-sm opacity-90">
                <li>• Estás gastando 5% más en necesidades</li>
                <li>• Reduce gustos en 5% para mejorar</li>
                <li>• Duplica tu porcentaje de ahorro</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
