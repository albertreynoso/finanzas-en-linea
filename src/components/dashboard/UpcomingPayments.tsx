import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const payments = [
  { id: 1, name: "Netflix", amount: 15.99, dueDate: "25 Nov", status: "próximo" },
  { id: 2, name: "Internet", amount: 45.00, dueDate: "28 Nov", status: "próximo" },
  { id: 3, name: "Electricidad", amount: 67.50, dueDate: "30 Nov", status: "próximo" },
  { id: 4, name: "Teléfono", amount: 35.00, dueDate: "02 Dic", status: "próximo" },
];

export const UpcomingPayments = () => {
  return (
    <Card className="p-6 shadow-card animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Próximos Vencimientos</h3>
        <Badge variant="outline" className="gap-1">
          <Calendar className="h-3 w-3" />
          7 días
        </Badge>
      </div>
      <div className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{payment.name}</p>
                <p className="text-sm text-muted-foreground">{payment.dueDate}</p>
              </div>
            </div>
            <p className="text-lg font-bold text-foreground">${payment.amount}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
