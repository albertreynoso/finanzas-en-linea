import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  CreditCard,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  Building2,
  TrendingUp,
  Wallet
} from "lucide-react";
import { NewCardForm } from "@/components/forms/NewCardForm";
import { EditCardForm } from "@/components/forms/EditCardForm";
import { toast } from "sonner";

interface CreditCardData {
  id: string;
  cardNumber: string;
  bankName: string;
  cardType: "credito" | "debito";
  billingDate: number;
  paymentDueDate: number;
  creditLimit?: number;
  currentBalance?: number;
  cardHolder: string;
  expiryDate: string;
  notes?: string;
  createdAt: any;
}

const Cards = () => {
  const [cards, setCards] = useState<CreditCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCardData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Cargar tarjetas desde Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'tarjetas'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const cardsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as CreditCardData));
        
        setCards(cardsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error al cargar tarjetas:", error);
        toast.error("Error al cargar las tarjetas");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    toast.success("¡Tarjeta guardada correctamente!");
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setSelectedCard(null);
    toast.success("¡Tarjeta actualizada correctamente!");
  };

  const openEditDialog = (card: CreditCardData) => {
    setSelectedCard(card);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (card: CreditCardData) => {
    setSelectedCard(card);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCard) return;

    setDeletingId(selectedCard.id);
    
    try {
      await deleteDoc(doc(db, 'tarjetas', selectedCard.id));
      toast.success("Tarjeta eliminada correctamente");
      setIsDeleteDialogOpen(false);
      setSelectedCard(null);
    } catch (error) {
      console.error("Error al eliminar tarjeta:", error);
      toast.error("Error al eliminar la tarjeta");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredCards = cards.filter((card) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      card.bankName.toLowerCase().includes(searchLower) ||
      card.cardHolder.toLowerCase().includes(searchLower) ||
      card.cardNumber.includes(searchQuery)
    );
  });

  // Calcular estadísticas
  const totalCreditCards = cards.filter(c => c.cardType === "credito").length;
  const totalDebitCards = cards.filter(c => c.cardType === "debito").length;
  const totalCreditLimit = cards
    .filter(c => c.cardType === "credito" && c.creditLimit)
    .reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const totalCurrentBalance = cards
    .filter(c => c.currentBalance)
    .reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const availableCredit = totalCreditLimit - totalCurrentBalance;

  // Formatear número de tarjeta (ocultar dígitos del medio)
  const formatCardNumber = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length === 16) {
      return `•••• •••• •••• ${cleaned.slice(-4)}`;
    }
    return cardNumber;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando tarjetas...</p>
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
            <h1 className="text-3xl font-bold text-foreground">Mis Tarjetas</h1>
            <p className="mt-2 text-muted-foreground">
              Gestiona tus tarjetas de crédito y débito
            </p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 bg-gradient-primary shadow-lg hover:opacity-90"
          >
            <CreditCard className="h-4 w-4" />
            Agregar Tarjeta
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-scale-in">
          <Card className="p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tarjetas</p>
                <p className="text-2xl font-bold text-foreground">{cards.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Crédito / Débito</p>
                <p className="text-2xl font-bold text-foreground">{totalCreditCards} / {totalDebitCards}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Línea Total</p>
                <p className="text-2xl font-bold text-emerald-600">${totalCreditLimit.toFixed(2)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Crédito Disponible</p>
                <p className="text-2xl font-bold text-blue-600">${availableCredit.toFixed(2)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="p-4 shadow-card animate-scale-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por banco, titular o número..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {filteredCards.length === 0 ? (
            <div className="col-span-full p-12 text-center">
              <CreditCard className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {cards.length === 0 
                  ? "No hay tarjetas registradas" 
                  : "No se encontraron tarjetas"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {cards.length === 0 && "Comienza agregando tu primera tarjeta"}
              </p>
            </div>
          ) : (
            filteredCards.map((card) => {
              const isCredit = card.cardType === "credito";
              const utilizationRate = isCredit && card.creditLimit 
                ? ((card.currentBalance || 0) / card.creditLimit) * 100 
                : 0;
              
              return (
                <Card 
                  key={card.id} 
                  className="p-6 shadow-card hover:shadow-lg transition-all relative overflow-hidden group"
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 opacity-5 ${
                    isCredit ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'
                  }`}></div>
                  
                  {/* Content */}
                  <div className="relative">
                    {/* Header with menu */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          isCredit ? 'bg-purple-500/10' : 'bg-emerald-500/10'
                        }`}>
                          <CreditCard className={`h-6 w-6 ${
                            isCredit ? 'text-purple-600' : 'text-emerald-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-foreground">{card.bankName}</h3>
                          <Badge variant={isCredit ? "default" : "secondary"} className="mt-1">
                            {isCredit ? "Crédito" : "Débito"}
                          </Badge>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(card)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(card)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Card Number */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-1">Número de Tarjeta</p>
                      <p className="text-lg font-mono font-semibold tracking-wider">
                        {formatCardNumber(card.cardNumber)}
                      </p>
                    </div>

                    {/* Card Holder */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-1">Titular</p>
                      <p className="font-medium">{card.cardHolder}</p>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Facturación</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm font-medium">Día {card.billingDate}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Pago Límite</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm font-medium">Día {card.paymentDueDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Credit Info (only for credit cards) */}
                    {isCredit && card.creditLimit && (
                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-muted-foreground">Línea de Crédito</p>
                          <p className="text-sm font-bold text-emerald-600">
                            ${card.creditLimit.toFixed(2)}
                          </p>
                        </div>
                        {card.currentBalance !== undefined && (
                          <>
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm text-muted-foreground">Saldo Actual</p>
                              <p className="text-sm font-bold text-destructive">
                                ${card.currentBalance.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-sm text-muted-foreground">Disponible</p>
                              <p className="text-sm font-bold text-blue-600">
                                ${(card.creditLimit - card.currentBalance).toFixed(2)}
                              </p>
                            </div>
                            {/* Progress bar */}
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Utilización</span>
                                <span>{utilizationRate.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    utilizationRate > 80 ? 'bg-destructive' : 
                                    utilizationRate > 50 ? 'bg-yellow-500' : 
                                    'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* New Card Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Tarjeta</DialogTitle>
              <DialogDescription>
                Completa los detalles de tu tarjeta
              </DialogDescription>
            </DialogHeader>
            <NewCardForm onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>

        {/* Edit Card Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Tarjeta</DialogTitle>
              <DialogDescription>
                Modifica los detalles de tu tarjeta
              </DialogDescription>
            </DialogHeader>
            {selectedCard && (
              <EditCardForm 
                card={selectedCard}
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
                Esta acción no se puede deshacer. Se eliminará permanentemente la tarjeta
                {selectedCard && (
                  <span className="font-semibold"> {selectedCard.bankName} ({formatCardNumber(selectedCard.cardNumber)})</span>
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

export default Cards;