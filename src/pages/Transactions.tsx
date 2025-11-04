import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Search, Filter, ShoppingBag, Car, Home, Utensils } from "lucide-react";
import { NewExpenseForm } from "@/components/forms/NewExpenseForm";

const categoryIcons = {
  "Alimentación": Utensils,
  "Transporte": Car,
  "Vivienda": Home,
  "Ocio": ShoppingBag,
};

const mockTransactions = [
  { id: 1, description: "Supermercado", amount: 85.50, category: "Alimentación", date: "2024-11-20", method: "Débito" },
  { id: 2, description: "Gasolina", amount: 45.00, category: "Transporte", date: "2024-11-19", method: "Efectivo" },
  { id: 3, description: "Alquiler", amount: 800.00, category: "Vivienda", date: "2024-11-15", method: "Transferencia" },
  { id: 4, description: "Cine", amount: 25.00, category: "Ocio", date: "2024-11-18", method: "Crédito" },
];

const Transactions = () => {
  const [transactions] = useState(mockTransactions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transacciones</h1>
            <p className="mt-2 text-muted-foreground">
              Gestiona todos tus gastos e ingresos
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary shadow-lg hover:opacity-90">
                <PlusCircle className="h-5 w-5" />
                Nuevo Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Gasto</DialogTitle>
                <DialogDescription>
                  Completa los detalles de tu transacción
                </DialogDescription>
              </DialogHeader>
              <NewExpenseForm onSuccess={handleFormSuccess} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="p-4 shadow-card animate-scale-in">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar transacciones..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </Card>

        {/* Transactions List */}
        <Card className="shadow-card animate-fade-in">
          <div className="divide-y divide-border">
            {transactions.map((transaction) => {
              const Icon = categoryIcons[transaction.category as keyof typeof categoryIcons];
              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <div className="mt-1 flex gap-2">
                        <Badge variant="outline">{transaction.category}</Badge>
                        <span className="text-sm text-muted-foreground">{transaction.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">-${transaction.amount}</p>
                    <p className="text-sm text-muted-foreground">{transaction.method}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Transactions;
