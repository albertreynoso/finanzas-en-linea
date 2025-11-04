import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  PlusCircle, 
  Search, 
  Filter, 
  ShoppingBag, 
  Car, 
  Home, 
  Utensils,
  TrendingDown,
  TrendingUp,
  Briefcase,
  DollarSign
} from "lucide-react";
import { NewTransactionForm } from "@/components/forms/NewTransactionForm";

const categoryIcons: Record<string, any> = {
  "Alimentación": Utensils,
  "Transporte": Car,
  "Vivienda": Home,
  "Ocio": ShoppingBag,
  "Salario": Briefcase,
  "Freelance": DollarSign,
};

interface Transaction {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
  method: string;
  type: "expense" | "income";
}

const mockTransactions: Transaction[] = [
  { id: 1, description: "Supermercado", amount: 85.50, category: "Alimentación", date: "2024-11-20", method: "Débito", type: "expense" },
  { id: 2, description: "Salario mensual", amount: 3000.00, category: "Salario", date: "2024-11-20", method: "Transferencia", type: "income" },
  { id: 3, description: "Gasolina", amount: 45.00, category: "Transporte", date: "2024-11-19", method: "Efectivo", type: "expense" },
  { id: 4, description: "Proyecto freelance", amount: 500.00, category: "Freelance", date: "2024-11-18", method: "Transferencia", type: "income" },
  { id: 5, description: "Alquiler", amount: 800.00, category: "Vivienda", date: "2024-11-15", method: "Transferencia", type: "expense" },
  { id: 6, description: "Cine", amount: 25.00, category: "Ocio", date: "2024-11-18", method: "Crédito", type: "expense" },
];

const Transactions = () => {
  const [transactions] = useState(mockTransactions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"expense" | "income">("expense");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
  };

  const openDialog = (type: "expense" | "income") => {
    setDialogType(type);
    setIsDialogOpen(true);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "expenses" && transaction.type === "expense") ||
      (activeTab === "income" && transaction.type === "income");
    
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

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
          <div className="flex gap-2">
            <Button 
              onClick={() => openDialog("expense")}
              variant="outline"
              className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <TrendingDown className="h-5 w-5" />
              Gasto
            </Button>
            <Button 
              onClick={() => openDialog("income")}
              className="gap-2 bg-gradient-primary shadow-lg hover:opacity-90"
            >
              <TrendingUp className="h-5 w-5" />
              Ingreso
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3 animate-scale-in">
          <Card className="p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos</p>
                <p className="text-2xl font-bold text-emerald-600">+${totalIncome.toFixed(2)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gastos</p>
                <p className="text-2xl font-bold text-destructive">-${totalExpenses.toFixed(2)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  ${balance.toFixed(2)}
                </p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${balance >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                <DollarSign className={`h-6 w-6 ${balance >= 0 ? 'text-emerald-600' : 'text-destructive'}`} />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 shadow-card animate-scale-in">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar transacciones..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </Card>

        {/* Transactions List with Tabs */}
        <Card className="shadow-card animate-fade-in">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-4">
              <TabsList className="h-12 w-full justify-start rounded-none border-0 bg-transparent p-0">
                <TabsTrigger 
                  value="all" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Todas ({transactions.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="income"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent data-[state=active]:text-emerald-600"
                >
                  Ingresos ({transactions.filter(t => t.type === "income").length})
                </TabsTrigger>
                <TabsTrigger 
                  value="expenses"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-destructive data-[state=active]:bg-transparent data-[state=active]:text-destructive"
                >
                  Gastos ({transactions.filter(t => t.type === "expense").length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="m-0">
              <div className="divide-y divide-border">
                {filteredTransactions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No se encontraron transacciones
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const Icon = categoryIcons[transaction.category] || ShoppingBag;
                    const isIncome = transaction.type === "income";
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                            isIncome ? 'bg-emerald-500/10' : 'bg-primary/10'
                          }`}>
                            <Icon className={`h-6 w-6 ${isIncome ? 'text-emerald-600' : 'text-primary'}`} />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{transaction.description}</p>
                            <div className="mt-1 flex gap-2">
                              <Badge 
                                variant="outline" 
                                className={isIncome ? 'border-emerald-600/50 text-emerald-600' : ''}
                              >
                                {transaction.category}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{transaction.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            isIncome ? 'text-emerald-600' : 'text-destructive'
                          }`}>
                            {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">{transaction.method}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Registrar {dialogType === "expense" ? "Gasto" : "Ingreso"}
              </DialogTitle>
              <DialogDescription>
                Completa los detalles de tu {dialogType === "expense" ? "gasto" : "ingreso"}
              </DialogDescription>
            </DialogHeader>
            <NewTransactionForm 
              onSuccess={handleFormSuccess}
              defaultType={dialogType}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Transactions;
