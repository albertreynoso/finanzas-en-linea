import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
}

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  variant = "default" 
}: StatCardProps) => {
  const variantStyles = {
    default: "bg-gradient-primary",
    success: "bg-gradient-success",
    warning: "bg-gradient-to-br from-warning to-warning/80",
    destructive: "bg-gradient-to-br from-destructive to-destructive/80"
  };

  return (
    <Card className="group relative overflow-hidden bg-gradient-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover animate-scale-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}
            </p>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
          variantStyles[variant]
        )}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Card>
  );
};
