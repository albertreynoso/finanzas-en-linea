import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Utensils, Car, Home, ShoppingBag, Heart, GraduationCap, Wallet } from "lucide-react";

const categories = [
  {
    id: 1,
    name: "Alimentación",
    icon: Utensils,
    budget: 500,
    spent: 450,
    color: "hsl(199 89% 48%)",
  },
  {
    id: 2,
    name: "Transporte",
    icon: Car,
    budget: 400,
    spent: 300,
    color: "hsl(158 64% 52%)",
  },
  {
    id: 3,
    name: "Vivienda",
    icon: Home,
    budget: 1000,
    spent: 800,
    color: "hsl(38 92% 50%)",
  },
  {
    id: 4,
    name: "Ocio",
    icon: ShoppingBag,
    budget: 300,
    spent: 200,
    color: "hsl(271 91% 65%)",
  },
  {
    id: 5,
    name: "Salud",
    icon: Heart,
    budget: 200,
    spent: 150,
    color: "hsl(0 84% 60%)",
  },
  {
    id: 6,
    name: "Educación",
    icon: GraduationCap,
    budget: 150,
    spent: 100,
    color: "hsl(217 91% 60%)",
  },
];

const Categories = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Categorías y Presupuestos</h1>
          <p className="mt-2 text-muted-foreground">
            Administra tus presupuestos por categoría
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const percentage = (category.spent / category.budget) * 100;
            const remaining = category.budget - category.spent;
            const isOverBudget = percentage > 100;
            const isWarning = percentage > 80 && percentage <= 100;

            return (
              <Card
                key={category.id}
                className="group p-6 shadow-card transition-all duration-300 hover:shadow-card-hover animate-scale-in"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: category.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${category.spent} / ${category.budget}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={isOverBudget ? "destructive" : isWarning ? "outline" : "secondary"}
                    >
                      {percentage.toFixed(0)}%
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className="h-2"
                      style={{
                        // @ts-ignore
                        '--progress-background': category.color
                      }}
                    />
                    <div className="flex justify-between text-sm">
                      <span className={remaining >= 0 ? "text-success" : "text-destructive"}>
                        {remaining >= 0 ? `Quedan $${remaining}` : `Excedido por $${Math.abs(remaining)}`}
                      </span>
                      <span className="text-muted-foreground">
                        {(100 - percentage).toFixed(0)}% disponible
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-card p-6 shadow-card animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-primary">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">Resumen Total</h3>
              <p className="text-sm text-muted-foreground">
                Presupuesto total mensual
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-foreground">
                ${categories.reduce((acc, cat) => acc + cat.spent, 0)}
              </p>
              <p className="text-sm text-muted-foreground">
                de ${categories.reduce((acc, cat) => acc + cat.budget, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Categories;
