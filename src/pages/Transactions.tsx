import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  ShoppingBag, 
  Car, 
  Home, 
  Utensils,
  TrendingDown,
  TrendingUp,
  Briefcase,
  DollarSign,
  Heart,
  GraduationCap,
  Lightbulb,
  Package,
  Laptop,
  TrendingUpIcon,
  Gift,
  TagIcon,
  Wallet,
  MoreVertical,
  Pencil,
  Trash2,
  Repeat,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { NewTransactionForm } from "@/components/forms/NewTransactionForm";
import { EditTransactionForm } from "@/components/forms/EditTransactionForm";
import { toast } from "sonner";

const categoryIcons: Record<string, any> = {
  // Gastos
  "alimentacion": Utensils,
  "transporte": Car,
  "vivienda": Home,
  "ocio": ShoppingBag,
  "salud": Heart,
  "educacion": GraduationCap,
  "servicios": Lightbulb,
  "otros": Package,
  // Ingresos
  "salario": Briefcase,
  "freelance": Laptop,
  "inversion": TrendingUpIcon,
  "regalo": Gift,
  "venta": TagIcon,
  "reembolso": Wallet,
};

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  type: "expense" | "income";
  notes?: string;
  isRecurring?: boolean;
  recurringPaymentDate?: string;
  recurringFrequency?: "semanal" | "quincenal" | "mensual" | "anual";
  recurringActive?: boolean;
  createdAt: any;
}

const frequencyLabels: Record<string, string> = {
  semanal: "Semanal",
  quincenal: "Quincenal",
  mensual: "Mensual",
  anual: "Anual",
};

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"expense" | "income">("expense");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Cargar transacciones desde Firestore en tiempo real
  useEffect(() => {
    const q = query(
      collection(db, 'transacciones'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const transactionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as Transaction));
        
        setTransactions(transactionsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error al cargar transacciones:", error);
        toast.error("Error al cargar las transacciones");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const calculateNextPayment = (paymentDate: string, frequency: string): string => {
    const date = new Date(paymentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Si la fecha ya pasó, calcular la siguiente
    while (date < today) {
      switch (frequency) {
        case 'semanal':
          date.setDate(date.getDate() + 7);
          break;
        case 'quincenal':
          date.setDate(date.getDate() + 15);
          break;
        case 'mensual':
          date.setMonth(date.getMonth() + 1);
          break;
        case 'anual':
          date.setFullYear(date.getFullYear() + 1);
          break;
      }
    }
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    toast.success("¡Transacción guardada correctamente!");
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setSelectedTransaction(null);
    toast.success("¡Transacción actualizada correctamente!");
  };

  const openDialog = (type: "expense" | "income") => {
    setDialogType(type);
    setIsDialogOpen(true);
  };

  const openEditDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;

    setDeletingId(selectedTransaction.id);
    
    try {
      await deleteDoc(doc(db, 'transacciones', selectedTransaction.id));
      toast.success("Transacción eliminada correctamente");
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Error al eliminar transacción:", error);
      toast.error("Error al eliminar la transacción");
    } finally {
      setDeletingId(null);
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      "alimentacion": "Alimentación",
      "transporte": "Transporte",
      "vivienda": "Vivienda",
      "ocio": "Ocio",
      "salud": "Salud",
      "educacion": "Educación",
      "servicios": "Servicios",
      "salario": "Salario",
      "freelance": "Freelance",
      "inversion": "Inversión",
      "regalo": "Regalo",
      "venta": "Venta",
      "reembolso": "Reembolso",
      "otros": "Otros"
    };
    return categoryMap[category] || category;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      "efectivo": "Efectivo",
      "debito": "Débito",
      "credito": "Crédito",
      "transferencia": "Transferencia"
    };
    return methodMap[method] || method;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando transacciones...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

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
              onClick={() => openDialog("income")}
              className="gap-2 bg-gradient-primary shadow-lg hover:opacity-90"
            >
              Registrar
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
                    {transactions.length === 0 
                      ? "No hay transacciones registradas. ¡Comienza agregando una!" 
                      : "No se encontraron transacciones con esos criterios"}
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const Icon = categoryIcons[transaction.category] || Package;
                    const isIncome = transaction.type === "income";
                    
                    return (
                      <div
                        key={transaction.id}
                        className="flex items-start justify-between p-4 transition-colors hover:bg-secondary/50"
                      >
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            isIncome ? 'bg-emerald-500/10' : 'bg-primary/10'
                          }`}>
                            <Icon className={`h-6 w-6 ${isIncome ? 'text-emerald-600' : 'text-primary'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-foreground truncate">{transaction.description}</p>
                              {transaction.isRecurring && (
                                <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                                  <Repeat className="h-3 w-3" />
                                  Recurrente
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={isIncome ? 'border-emerald-600/50 text-emerald-600' : ''}
                              >
                                {getCategoryLabel(transaction.category)}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(transaction.date)}
                              </span>
                            </div>

                            {/* Información de recurrencia */}
                            {transaction.isRecurring && transaction.recurringPaymentDate && transaction.recurringFrequency && (
                              <div className="mt-2 pt-2 border-t space-y-1">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>Próximo pago: {calculateNextPayment(transaction.recurringPaymentDate, transaction.recurringFrequency)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-muted-foreground">
                                    Frecuencia: {frequencyLabels[transaction.recurringFrequency]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {transaction.recurringActive ? (
                                    <Badge variant="default" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Activo
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="gap-1 text-xs">
                                      <XCircle className="h-3 w-3" />
                                      Inactivo
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4 ml-4 shrink-0">
                          <div className="text-right">
                            <p className={`text-xl font-bold ${
                              isIncome ? 'text-emerald-600' : 'text-destructive'
                            }`}>
                              {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getPaymentMethodLabel(transaction.paymentMethod)}
                            </p>
                          </div>
                          
                          {/* Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(transaction)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(transaction)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* New Transaction Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Registrar transacción
              </DialogTitle>
              <DialogDescription>
                Completa los detalles de tu transacción
              </DialogDescription>
            </DialogHeader>
            <NewTransactionForm 
              onSuccess={handleFormSuccess}
              defaultType={dialogType}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Transaction Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Editar transacción
              </DialogTitle>
              <DialogDescription>
                Modifica los detalles de tu transacción
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <EditTransactionForm 
                transaction={selectedTransaction}
                onSuccess={handleEditSuccess}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminará permanentemente la transacción
                {selectedTransaction && (
                  <span className="font-semibold"> "{selectedTransaction.description}"</span>
                )}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={!!deletingId}
              >
                {deletingId ? "Eliminando..." : "Eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
};

export default Transactions;