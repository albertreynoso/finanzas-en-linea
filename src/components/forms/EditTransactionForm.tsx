import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, updateDoc, collection, query, where, onSnapshot, getDocs, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";

const transactionSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.string()
    .min(1, "El monto es requerido")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Ingresa un monto válido mayor a 0",
    }),
  description: z.string()
    .trim()
    .min(3, "La descripción debe tener al menos 3 caracteres")
    .max(100, "La descripción debe tener menos de 100 caracteres"),
  category: z.string().min(1, "Selecciona una categoría"),
  paymentMethod: z.string().min(1, "Selecciona un método de pago"),
  cardId: z.string().optional(),
  date: z.string().min(1, "La fecha es requerida"),
  notes: z.string().max(500, "Las notas deben tener menos de 500 caracteres").optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  type: "expense" | "income";
  notes?: string;
  cardId?: string;
}

interface Card {
  id: string;
  bankName: string;
  cardType: "credito" | "debito";
  cardNumber: string;
  currentBalance?: number;
}

interface EditTransactionFormProps {
  transaction: Transaction;
  onSuccess?: () => void;
}

const expenseCategories = [
  { value: "alimentacion", label: "🍽️ Alimentación" },
  { value: "transporte", label: "🚗 Transporte" },
  { value: "vivienda", label: "🏠 Vivienda" },
  { value: "ocio", label: "🎮 Ocio" },
  { value: "salud", label: "⚕️ Salud" },
  { value: "educacion", label: "📚 Educación" },
  { value: "servicios", label: "💡 Servicios" },
  { value: "otros", label: "📦 Otros" },
];

const incomeCategories = [
  { value: "salario", label: "💼 Salario" },
  { value: "freelance", label: "💻 Freelance" },
  { value: "inversion", label: "📈 Inversión" },
  { value: "regalo", label: "🎁 Regalo" },
  { value: "venta", label: "🏷️ Venta" },
  { value: "reembolso", label: "💰 Reembolso" },
  { value: "otros", label: "📦 Otros" },
];

export function EditTransactionForm({ transaction, onSuccess }: EditTransactionFormProps) {
  const [transactionType, setTransactionType] = useState<"expense" | "income">(transaction.type);
  const [cards, setCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      paymentMethod: transaction.paymentMethod,
      cardId: transaction.cardId || "",
      date: transaction.date,
      notes: transaction.notes || "",
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  // Cargar tarjetas
  useEffect(() => {
    const q = query(collection(db, 'tarjetas'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cardsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as Card));
      setCards(cardsData);
      setLoadingCards(false);
    });

    return () => unsubscribe();
  }, []);

  const onSubmit = async (data: TransactionFormValues) => {
    try {
      const newAmount = parseFloat(data.amount);
      const oldAmount = transaction.amount;
      const amountDifference = newAmount - oldAmount;

      // Si cambió la tarjeta o el monto, actualizamos los saldos
      if (transaction.cardId && transaction.cardId !== data.cardId) {
        // Revertir el cargo de la tarjeta anterior
        const oldCardRef = doc(db, 'tarjetas', transaction.cardId);
        if (transaction.type === "expense") {
          await updateDoc(oldCardRef, {
            currentBalance: increment(-oldAmount)
          });
        }
      }

      // Actualizar la nueva tarjeta si aplica
      if (data.cardId && (data.paymentMethod === "credito" || data.paymentMethod === "debito")) {
        const cardRef = doc(db, 'tarjetas', data.cardId);
        
        if (data.type === "expense") {
          // Si es la misma tarjeta, solo sumamos la diferencia
          if (transaction.cardId === data.cardId) {
            await updateDoc(cardRef, {
              currentBalance: increment(amountDifference)
            });
          } else {
            // Si es tarjeta nueva, sumamos el monto completo
            await updateDoc(cardRef, {
              currentBalance: increment(newAmount)
            });
          }
        }
      }

      const transactionData = {
        type: data.type,
        amount: newAmount,
        description: data.description,
        category: data.category,
        paymentMethod: data.paymentMethod,
        cardId: data.cardId || null,
        date: data.date,
        notes: data.notes || "",
      };
      
      // Actualizar en Firestore
      const transactionRef = doc(db, 'transacciones', transaction.id);
      await updateDoc(transactionRef, transactionData);
      
      const typeLabel = data.type === "expense" ? "Gasto" : "Ingreso";
      toast.success(`${typeLabel} actualizado exitosamente`, {
        description: `${data.description} - $${data.amount}`,
      });
      
      onSuccess?.();
    } catch (error) {
      console.error("Error al actualizar la transacción:", error);
      toast.error("Error al actualizar la transacción", {
        description: "Inténtalo de nuevo más tarde",
      });
    }
  };

  const handleTypeChange = (value: string) => {
    const newType = value as "expense" | "income";
    setTransactionType(newType);
    form.setValue("type", newType);
    form.setValue("category", "");
  };

  const categories = transactionType === "expense" ? expenseCategories : incomeCategories;

  // Filtrar tarjetas según el método de pago
  const filteredCards = cards.filter(card => {
    if (paymentMethod === "credito") return card.cardType === "credito";
    if (paymentMethod === "debito") return card.cardType === "debito";
    return false;
  });

  const formatCardNumber = (cardNumber: string) => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (cleaned.length >= 4) {
      return `•••• ${cleaned.slice(-4)}`;
    }
    return cardNumber;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={transactionType} onValueChange={handleTypeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="expense" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Gasto
            </TabsTrigger>
            <TabsTrigger value="income" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Ingreso
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto *</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción *</FormLabel>
              <FormControl>
                <Input 
                  placeholder={transactionType === "expense" ? "Ej: Supermercado del mes" : "Ej: Pago de salario"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pago *</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("cardId", "");
                }} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona método de pago" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="efectivo">💵 Efectivo</SelectItem>
                  <SelectItem value="debito">💳 Débito</SelectItem>
                  <SelectItem value="credito">💳 Crédito</SelectItem>
                  <SelectItem value="transferencia">🏦 Transferencia</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selector de tarjeta (solo si es crédito o débito) */}
        {(paymentMethod === "credito" || paymentMethod === "debito") && (
          <FormField
            control={form.control}
            name="cardId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seleccionar Tarjeta *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una tarjeta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingCards ? (
                      <SelectItem value="loading" disabled>Cargando tarjetas...</SelectItem>
                    ) : filteredCards.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No hay tarjetas de {paymentMethod === "credito" ? "crédito" : "débito"}
                      </SelectItem>
                    ) : (
                      filteredCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.bankName} - {formatCardNumber(card.cardNumber)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Agrega notas adicionales..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full bg-gradient-primary shadow-lg hover:opacity-90"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Actualizando..." : "Actualizar"}
        </Button>
      </form>
    </Form>
  );
}