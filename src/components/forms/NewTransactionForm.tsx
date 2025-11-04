import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useState } from "react";

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
  date: z.string().min(1, "La fecha es requerida"),
  notes: z.string().max(500, "Las notas deben tener menos de 500 caracteres").optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

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

export function NewTransactionForm({ onSuccess, defaultType = "expense" }: NewTransactionFormProps) {
  const [transactionType, setTransactionType] = useState<"expense" | "income">(defaultType);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      amount: "",
      description: "",
      category: "",
      paymentMethod: "",
      date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const onSubmit = (data: TransactionFormValues) => {
    console.log("Transaction data:", data);
    
    const typeLabel = data.type === "expense" ? "Gasto" : "Ingreso";
    toast.success(`${typeLabel} registrado exitosamente`, {
      description: `${data.description} - $${data.amount}`,
    });
    
    form.reset({
      type: transactionType,
      amount: "",
      description: "",
      category: "",
      paymentMethod: "",
      date: new Date().toISOString().split('T')[0],
      notes: "",
    });
    onSuccess?.();
  };

  const handleTypeChange = (value: string) => {
    const newType = value as "expense" | "income";
    setTransactionType(newType);
    form.setValue("type", newType);
    form.setValue("category", "");
  };

  const categories = transactionType === "expense" ? expenseCategories : incomeCategories;

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
              <Select onValueChange={field.onChange} value={field.value}>
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
          {form.formState.isSubmitting 
            ? "Guardando..." 
            : transactionType === "expense" 
              ? "Guardar Gasto" 
              : "Guardar Ingreso"}
        </Button>
      </form>
    </Form>
  );
}
