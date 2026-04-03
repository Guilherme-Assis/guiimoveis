import { useMemo } from "react";
import { Home, DollarSign } from "lucide-react";
import { formatPrice } from "@/data/properties";

interface RentalCostCalculatorProps {
  rentalPrice: number;
  condominiumFee: number;
  iptu: number;
}

const RentalCostCalculator = ({ rentalPrice, condominiumFee, iptu }: RentalCostCalculatorProps) => {
  const totalMonthly = useMemo(() => rentalPrice + condominiumFee + iptu, [rentalPrice, condominiumFee, iptu]);
  const totalAnnual = useMemo(() => totalMonthly * 12, [totalMonthly]);

  return (
    <div className="border border-border bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <Home className="h-5 w-5 text-primary" />
        Custos Mensais
      </h3>

      <div className="space-y-3">
        {rentalPrice > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-muted-foreground">Aluguel</span>
            <span className="font-body text-sm font-semibold text-foreground">{formatPrice(rentalPrice)}</span>
          </div>
        )}
        {condominiumFee > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-muted-foreground">Condomínio</span>
            <span className="font-body text-sm text-foreground">{formatPrice(condominiumFee)}</span>
          </div>
        )}
        {iptu > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-muted-foreground">IPTU mensal</span>
            <span className="font-body text-sm text-foreground">{formatPrice(iptu)}</span>
          </div>
        )}

        <div className="luxury-divider" />

        <div className="flex items-center justify-between">
          <span className="font-body text-sm font-semibold text-muted-foreground">Total mensal</span>
          <span className="font-display text-xl font-bold text-gradient-gold">
            {formatPrice(totalMonthly)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-muted-foreground">Custo anual estimado</span>
          <span className="font-body text-xs text-foreground">{formatPrice(totalAnnual)}</span>
        </div>

        <p className="font-body text-[10px] text-muted-foreground">
          * Valores sujeitos a reajuste conforme contrato. IPTU pode variar.
        </p>
      </div>
    </div>
  );
};

export default RentalCostCalculator;
