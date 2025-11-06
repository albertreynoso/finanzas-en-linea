import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, query, onSnapshot } from 'firebase/firestore';
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
import { TrendingDown, TrendingUp, Repeat } from "lucide-react";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";

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
  isRecurring: z.boolean().default(false),
  recurringPaymentDate: z.string().optional(),
  recurringFrequency: z.enum(["semanal", "quincenal", "mensual", "anual"]).optional(),
  recurringActive: z.boolean().default(true),
}).refine((data) => {
  if (data.isRecurring) {
    return data.recurringPaymentDate && data.recurringFrequency;
  }
  return true;
}, {
  message: "Completa todos los campos de recurrencia",
  path: ["recurringFrequency"],
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface Card {
  id: string;
  bankName: string;
  cardType: "credito" | "debito";
  cardNumber: string;
  currentBalance?: number;
}

interface NewTransactionFormProps {
  onSuccess?: () => void;
  defaultType?: "expense" | "income";
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

const frequencyOptions = [
  { value: "semanal", label: "📅 Semanal" },
  { value: "quincenal", label: "📅 Quincenal (cada 15 días)" },
  { value: "mensual", label: "📅 Mensual" },
  { value: "anual", label: "📅 Anual" },
];

export function NewTransactionForm({ onSuccess, defaultType = "expense" }: NewTransactionFormProps) {
  const [transactionType, setTransactionType] = useState<"expense" | "income">(defaultType);
  const [cards, setCards] = useState<Card[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      amount: "",
      description: "",
      category: "",
      paymentMethod: "",
      cardId: "",
      date: new Date().toISOString().split('T')[0],
      notes: "",
      isRecurring: false,
      recurringPaymentDate: "",
      recurringFrequency: undefined,
      recurringActive: true,
    },
  });

  const paymentMethod = form.watch("paymentMethod");
  const isRecurring = form.watch("isRecurring");

  // Cargar tarjetas desde Firestore
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
      const amount = parseFloat(data.amount);
      
      // Si es un gasto con tarjeta, actualizar el saldo de la tarjeta
      if (data.type === "expense" && data.cardId && (data.paymentMethod === "credito" || data.paymentMethod === "debito")) {
        const cardRef = doc(db, 'tarjetas', data.cardId);
        await updateDoc(cardRef, {
          currentBalance: increment(amount)
        });
      }

      const transactionData = {
        type: data.type,
        amount: amount,
        description: data.description,
        category: data.category,
        paymentMethod: data.paymentMethod,
        cardId: data.cardId || null,
        date: data.date,
        notes: data.notes || "",
        isRecurring: data.isRecurring,
        recurringPaymentDate: data.isRecurring ? data.recurringPaymentDate : null,
        recurringFrequency: data.isRecurring ? data.recurringFrequency : null,
        recurringActive: data.isRecurring ? data.recurringActive : null,
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      };
      
      // Guardar en Firestore
      await addDoc(collection(db, 'transacciones'), transactionData);
      
      const typeLabel = data.type === "expense" ? "Gasto" : "Ingreso";
      const recurringLabel = data.isRecurring ? " recurrente" : "";
      toast.success(`${typeLabel}${recurringLabel} registrado exitosamente`, {
        description: `${data.description} - $${data.amount}`,
      });
      
      form.reset({
        type: transactionType,
        amount: "",
        description: "",
        category: "",
        paymentMethod: "",
        cardId: "",
        date: new Date().toISOString().split('T')[0],
        notes: "",
        isRecurring: false,
        recurringPaymentDate: "",
        recurringFrequency: undefined,
        recurringActive: true,
      });
      
      onSuccess?.();
    } catch (error) {
      console.error("Error al guardar la transacción:", error);
      toast.error("Error al guardar la transacción", {
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
        <Tabs value={transactionType} onValueChange={handleTypeChange} className="w-full" defaultValue={defaultType}>
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

        {/* Toggle para transacción recurrente */}
        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/50">
              <div className="space-y-0.5">
                <FormLabel className="text-base flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Transacción Recurrente
                </FormLabel>
                <div className="text-sm text-muted-foreground">
                  Programa pagos o ingresos automáticos
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Campos adicionales para transacciones recurrentes */}
        {isRecurring && (
          <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              Configuración de Recurrencia
            </h3>

            <FormField
              control={form.control}
              name="recurringPaymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Pago *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recurringFrequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la frecuencia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {frequencyOptions.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
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
              name="recurringActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Estado Activo</FormLabel>
                    <div className="text-xs text-muted-foreground">
                      La transacción se procesará automáticamente
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}

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
          {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </form>
    </Form>
  );
}