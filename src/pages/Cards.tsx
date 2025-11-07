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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CreditCard,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  Wallet,
  Activity
} from "lucide-react";
import { NewCardForm } from "@/components/forms/NewCardForm";
import { EditCardForm } from "@/components/forms/EditCardForm";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';

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

interface Transaction {
  id: string;
  amount: number;
  date: string;
  cardId?: string;
  type: "expense" | "income";
  description: string;
}

const Cards = () => {
  const [cards, setCards] = useState<CreditCardData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCardData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estado para tarjeta seleccionada en el gráfico
  const [selectedCardForChart, setSelectedCardForChart] = useState<CreditCardData | null>(null);

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

  // Cargar transacciones
  useEffect(() => {
    const q = query(collection(db, 'transacciones'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as Transaction));
      setTransactions(transactionsData);
    });

    return () => unsubscribe();
  }, []);

  // Inicializar tarjeta seleccionada cuando las tarjetas se cargan
  useEffect(() => {
    if (cards.length > 0 && !selectedCardForChart) {
      const firstCreditCard = cards.find(c => c.cardType === "credito");
      setSelectedCardForChart(firstCreditCard || cards[0]);
    }
  }, [cards, selectedCardForChart]);

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

  // Preparar datos para el gráfico (vista de -30 a +30 días)
  const prepareChartData = () => {
    if (!selectedCardForChart) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const data = [];
    
    // Encontrar el inicio del período de facturación actual
    const findCurrentBillingDate = () => {
      let billingDate = new Date(today.getFullYear(), today.getMonth(), selectedCardForChart.billingDate);
      if (billingDate <= today) {
        return billingDate;
      }
      billingDate.setMonth(billingDate.getMonth() - 1);
      return billingDate;
    };
    
    const currentBillingStart = findCurrentBillingDate();
    
    // Filtrar solo las transacciones de esta tarjeta
    const cardTransactions = transactions.filter(t => 
      t.cardId === selectedCardForChart.id && t.type === "expense"
    );
    
    // Crear rango de -30 a +30 días desde hoy
    for (let i = -30; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dayData = {
        day: i,
        date: date.toISOString().split('T')[0],
        dateLabel: date.getDate(),
        month: date.toLocaleString('es', { month: 'short' }),
        fullDate: date,
        isToday: i === 0,
        isNewMonth: date.getDate() === 1,
        cumulativeAmount: null as number | null
      };
      
      // Calcular consumo acumulado para días pasados y el día de hoy
      if (i <= 0) {
        // Determinar el inicio del período para este día específico
        let periodStart = new Date(date.getFullYear(), date.getMonth(), selectedCardForChart.billingDate);
        
        // Si la fecha de facturación del mes actual aún no ha llegado, usar el mes anterior
        if (periodStart > date) {
          periodStart.setMonth(periodStart.getMonth() - 1);
        }
        
        // Calcular el consumo acumulado desde el inicio del período hasta este día
        const relevantTransactions = cardTransactions.filter(t => {
          // Convertir la fecha string a Date
          const tDate = new Date(t.date + 'T00:00:00');
          
          // La transacción debe estar entre el inicio del período y el día actual del loop
          return tDate >= periodStart && tDate <= date;
        });
        
        dayData.cumulativeAmount = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
      }
      
      data.push(dayData);
    }
    
    return data;
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.cumulativeAmount === null) return null;
      
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-4">
          <p className="font-semibold text-sm mb-2">
            {data.dateLabel} de {data.month}
          </p>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span className="text-lg font-bold text-primary">
              ${data.cumulativeAmount.toFixed(2)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Formatear número de tarjeta
  const formatCardNumber = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length === 16) {
      return `•••• •••• •••• ${cleaned.slice(-4)}`;
    }
    return cardNumber;
  };

  const chartData = prepareChartData();
  const hasTransactions = transactions.some(t => t.cardId && t.type === "expense");

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

        {/* Gráfico de Consumo por Tarjeta */}
        {cards.length > 0 && hasTransactions && selectedCardForChart && (
          <Card className="p-6 shadow-card animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Análisis de Consumo - Períodos de Facturación</h2>
              </div>
              
              {/* Selector de Tarjeta */}
              <Select 
                value={selectedCardForChart.id} 
                onValueChange={(value) => {
                  const card = cards.find(c => c.id === value);
                  if (card) setSelectedCardForChart(card);
                }}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cards.filter(c => c.cardType === "credito").map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.bankName} (••{card.cardNumber.slice(-4)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Leyenda Integrada */}
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 rounded bg-primary"></div>
                  <span className="text-xs text-muted-foreground">Consumo Real</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-4 rounded bg-primary/20"></div>
                  <span className="text-xs text-muted-foreground">Periodo de Facturación</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-blue-500 rounded"></div>
                  <span className="text-xs text-muted-foreground">Fecha Facturación</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-red-500 rounded"></div>
                  <span className="text-xs text-muted-foreground">Fecha Pago</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-400"></div>
                  <span className="text-xs text-muted-foreground">Hoy</span>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <defs>
                  <linearGradient id="gradient-primary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                
                {/* Áreas de períodos de facturación */}
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  // Función para encontrar el período actual
                  const findCurrentBillingDate = () => {
                    let billingDate = new Date(today.getFullYear(), today.getMonth(), selectedCardForChart.billingDate);
                    if (billingDate <= today) {
                      return billingDate;
                    }
                    billingDate.setMonth(billingDate.getMonth() - 1);
                    return billingDate;
                  };
                  
                  const currentBillingDate = findCurrentBillingDate();
                  const periods = [];
                  
                  // Crear 3 períodos
                  for (let i = -1; i <= 1; i++) {
                    const periodStart = new Date(currentBillingDate);
                    periodStart.setMonth(periodStart.getMonth() + i);
                    
                    const periodEnd = new Date(periodStart);
                    periodEnd.setMonth(periodEnd.getMonth() + 1);
                    periodEnd.setDate(periodEnd.getDate() - 1);
                    
                    const paymentDate = new Date(periodEnd);
                    paymentDate.setMonth(paymentDate.getMonth() + 1);
                    paymentDate.setDate(selectedCardForChart.paymentDueDate);
                    
                    // Calcular días desde hoy - convertir a número con .getTime()
                    const startDay = Math.floor((periodStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    const endDay = Math.floor((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    periods.push({
                      start: periodStart,
                      end: periodEnd,
                      startDay,
                      endDay,
                      paymentDate,
                      isCurrent: i === 0
                    });
                  }
                  
                  return (
                    <>
                      {periods.map((period, idx) => (
                        <ReferenceArea
                          key={`period-${idx}`}
                          x1={period.startDay}
                          x2={period.endDay}
                          fill="hsl(var(--primary))"
                          fillOpacity={period.isCurrent ? 0.15 : 0.05}
                          stroke="hsl(var(--primary))"
                          strokeOpacity={0.3}
                          strokeWidth={1}
                        />
                      ))}
                    </>
                  );
                })()}

                {/* Líneas de separación de meses */}
                {chartData.filter(d => d.isNewMonth).map((d, idx) => (
                  <ReferenceLine
                    key={`month-${idx}`}
                    x={d.day}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    label={{
                      value: d.month.toUpperCase(),
                      position: 'top',
                      fill: 'hsl(var(--muted-foreground))',
                      fontSize: 11,
                      fontWeight: 'bold'
                    }}
                  />
                ))}

                {/* Línea de "Hoy" */}
                <ReferenceLine
                  x={0}
                  stroke="#f59e0b"
                  strokeWidth={3}
                  label={{
                    value: 'HOY',
                    position: 'top',
                    fill: '#f59e0b',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}
                />

                {/* Líneas de fechas de facturación */}
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const findCurrentBillingDate = () => {
                    let billingDate = new Date(today.getFullYear(), today.getMonth(), selectedCardForChart.billingDate);
                    if (billingDate <= today) return billingDate;
                    billingDate.setMonth(billingDate.getMonth() - 1);
                    return billingDate;
                  };
                  
                  const currentBillingDate = findCurrentBillingDate();
                  const billingLines = [];
                  
                  for (let i = -1; i <= 1; i++) {
                    const billingDate = new Date(currentBillingDate);
                    billingDate.setMonth(billingDate.getMonth() + i);
                    const billingDay = Math.floor((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (billingDay >= -30 && billingDay <= 30) {
                      billingLines.push(
                        <ReferenceLine
                          key={`billing-${i}`}
                          x={billingDay}
                          stroke="#3b82f6"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          label={{
                            value: '📅 Facturación',
                            position: 'insideBottomLeft',
                            fill: '#3b82f6',
                            fontSize: 10,
                            offset: 10
                          }}
                        />
                      );
                    }
                  }
                  
                  return billingLines;
                })()}

                {/* Líneas de fechas de pago */}
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const findCurrentBillingDate = () => {
                    let billingDate = new Date(today.getFullYear(), today.getMonth(), selectedCardForChart.billingDate);
                    if (billingDate <= today) return billingDate;
                    billingDate.setMonth(billingDate.getMonth() - 1);
                    return billingDate;
                  };
                  
                  const currentBillingDate = findCurrentBillingDate();
                  const paymentLines = [];
                  
                  for (let i = -1; i <= 1; i++) {
                    const periodStart = new Date(currentBillingDate);
                    periodStart.setMonth(periodStart.getMonth() + i);
                    
                    const periodEnd = new Date(periodStart);
                    periodEnd.setMonth(periodEnd.getMonth() + 1);
                    periodEnd.setDate(periodEnd.getDate() - 1);
                    
                    const paymentDate = new Date(periodEnd);
                    paymentDate.setMonth(paymentDate.getMonth() + 1);
                    paymentDate.setDate(selectedCardForChart.paymentDueDate);
                    
                    const paymentDay = Math.floor((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (paymentDay >= -30 && paymentDay <= 30) {
                      paymentLines.push(
                        <ReferenceLine
                          key={`payment-${i}`}
                          x={paymentDay}
                          stroke="#ef4444"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          label={{
                            value: '💳 Pago',
                            position: 'insideBottomRight',
                            fill: '#ef4444',
                            fontSize: 10,
                            offset: 10
                          }}
                        />
                      );
                    }
                  }
                  
                  return paymentLines;
                })()}

                <XAxis
                  dataKey="day"
                  tickFormatter={(value) => {
                    const item = chartData.find(d => d.day === value);
                    return item ? item.dateLabel : value;
                  }}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Días (centrado en HOY)', position: 'insideBottom', offset: -45, fontSize: 12 }}
                />

                <YAxis
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Consumo Acumulado ($)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  domain={[0, 'auto']}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* Línea de consumo real */}
                <Line
                  type="monotone"
                  dataKey="cumulativeAmount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

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