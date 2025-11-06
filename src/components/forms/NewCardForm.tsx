import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { toast } from "sonner";
import { CreditCard, Landmark } from "lucide-react";

const cardSchema = z.object({
  cardNumber: z.string()
    .min(13, "El número de tarjeta debe tener al menos 13 dígitos")
    .max(19, "El número de tarjeta no puede tener más de 19 dígitos")
    .refine((val) => /^\d+$/.test(val.replace(/\s/g, '')), {
      message: "Solo se permiten números en el número de tarjeta",
    }),
  bankName: z.string()
    .min(2, "El nombre del banco es requerido")
    .max(50, "El nombre es muy largo"),
  cardType: z.enum(["credito", "debito"], {
    required_error: "Selecciona el tipo de tarjeta",
  }),
  cardHolder: z.string()
    .min(3, "El nombre del titular es requerido")
    .max(50, "El nombre es muy largo"),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Formato: MM/YY"),
  // Hacer estos campos opcionales y validar condicionalmente
  billingDate: z.string().optional(),
  paymentDueDate: z.string().optional(),
  creditLimit: z.string().optional(),
  currentBalance: z.string().optional(),
  notes: z.string().max(500, "Las notas deben tener menos de 500 caracteres").optional(),
})
  .refine((data) => {
    // Solo validar fechas si es tarjeta de crédito
    if (data.cardType === "credito") {
      const billingNum = parseInt(data.billingDate || '');
      const paymentNum = parseInt(data.paymentDueDate || '');

      return !isNaN(billingNum) && billingNum >= 1 && billingNum <= 31 &&
        !isNaN(paymentNum) && paymentNum >= 1 && paymentNum <= 31;
    }
    return true;
  }, {
    message: "Para tarjetas de crédito, ingresa días válidos (1-31) para facturación y pago",
    path: ["billingDate"], // Esto mostrará el error en billingDate
  });

type CardFormValues = z.infer<typeof cardSchema>;

interface NewCardFormProps {
  onSuccess?: () => void;
}

export function NewCardForm({ onSuccess }: NewCardFormProps) {
  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      cardNumber: "",
      bankName: "",
      cardType: "credito",
      cardHolder: "",
      expiryDate: "",
      billingDate: "",
      paymentDueDate: "",
      creditLimit: "",
      currentBalance: "0",
      notes: "",
    },
  });

  const cardType = form.watch("cardType");

  const onSubmit = async (data: CardFormValues) => {
    try {
      const cardData = {
        cardNumber: data.cardNumber.replace(/\s/g, ''),
        bankName: data.bankName,
        cardType: data.cardType,
        cardHolder: data.cardHolder,
        expiryDate: data.expiryDate,
        billingDate: parseInt(data.billingDate),
        paymentDueDate: parseInt(data.paymentDueDate),
        creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : null,
        currentBalance: data.currentBalance ? parseFloat(data.currentBalance) : 0,
        notes: data.notes || "",
        createdAt: serverTimestamp(),
        timestamp: Date.now()
      };

      await addDoc(collection(db, 'tarjetas'), cardData);

      toast.success("¡Tarjeta registrada exitosamente!", {
        description: `${data.bankName} - ${data.cardType === "credito" ? "Crédito" : "Débito"}`,
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error al guardar la tarjeta:", error);
      toast.error("Error al guardar la tarjeta", {
        description: "Inténtalo de nuevo más tarde",
      });
    }
  };

  // Formatear número de tarjeta mientras se escribe
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, '');
    if (value.length > 16) value = value.slice(0, 16);

    // Agregar espacios cada 4 dígitos
    const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
    form.setValue('cardNumber', formatted);
  };

  // Formatear fecha de expiración
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);

    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }

    form.setValue('expiryDate', value);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Card Type */}
        <FormField
          control={form.control}
          name="cardType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Tarjeta *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="credito">💳 Tarjeta de Crédito</SelectItem>
                  <SelectItem value="debito">💳 Tarjeta de Débito</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bank Name */}
        <FormField
          control={form.control}
          name="bankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco / Entidad *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ej: Banco Nacional, BBVA, Santander"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Card Number */}
        <FormField
          control={form.control}
          name="cardNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de Tarjeta *</FormLabel>
              <FormControl>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="1234 5678 9012 3456"
                    className="pl-10 font-mono"
                    {...field}
                    onChange={handleCardNumberChange}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Los últimos 4 dígitos se mostrarán en la lista
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Card Holder */}
        <FormField
          control={form.control}
          name="cardHolder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titular de la Tarjeta *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre como aparece en la tarjeta"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Expiry Date */}
        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Expiración *</FormLabel>
              <FormControl>
                <Input
                  placeholder="MM/YY"
                  className="font-mono"
                  {...field}
                  onChange={handleExpiryDateChange}
                  maxLength={5}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Billing and Payment Dates - Solo para crédito */}
        {cardType === "credito" && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="billingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Día de Facturación *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ej: 15"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Día del mes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Día de Pago Límite *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Ej: 25"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Día del mes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}



        {/* Credit Limit and Current Balance (only for credit cards) */}
        {cardType === "credito" && (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Línea de Crédito</FormLabel>
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
              name="currentBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Actual</FormLabel>
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
          </div>
        )}

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Beneficios, recompensas, recordatorios..."
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
          {form.formState.isSubmitting ? "Guardando..." : "Guardar Tarjeta"}
        </Button>
      </form>
    </Form>
  );
}