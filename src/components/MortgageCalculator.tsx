import { useState, useMemo } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatPrice } from "@/data/properties";

interface MortgageCalculatorProps {
  propertyPrice: number;
}

const MortgageCalculator = ({ propertyPrice }: MortgageCalculatorProps) => {
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(9.5);
  const [termYears, setTermYears] = useState(30);

  const result = useMemo(() => {
    const downPayment = (propertyPrice * downPaymentPercent) / 100;
    const loanAmount = propertyPrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = termYears * 12;

    if (monthlyRate === 0) {
      return {
        monthlyPayment: loanAmount / totalPayments,
        totalPaid: loanAmount,
        totalInterest: 0,
        downPayment,
        loanAmount,
      };
    }

    const monthlyPayment =
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
      (Math.pow(1 + monthlyRate, totalPayments) - 1);
    const totalPaid = monthlyPayment * totalPayments;
    const totalInterest = totalPaid - loanAmount;

    return { monthlyPayment, totalPaid, totalInterest, downPayment, loanAmount };
  }, [propertyPrice, downPaymentPercent, interestRate, termYears]);

  return (
    <div className="border border-border bg-card p-6">
      <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <Calculator className="h-5 w-5 text-primary" />
        Simulador de Financiamento
      </h3>

      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label className="font-body text-sm text-muted-foreground">Entrada</Label>
            <span className="font-body text-sm font-semibold text-primary">{downPaymentPercent}% — {formatPrice(result.downPayment)}</span>
          </div>
          <Slider
            value={[downPaymentPercent]}
            onValueChange={([v]) => setDownPaymentPercent(v)}
            min={10}
            max={80}
            step={5}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="font-body text-xs text-muted-foreground">Taxa de Juros (% a.a.)</Label>
            <Input
              type="number"
              step={0.1}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="mt-1 border-border bg-secondary text-sm"
            />
          </div>
          <div>
            <Label className="font-body text-xs text-muted-foreground">Prazo (anos)</Label>
            <Input
              type="number"
              value={termYears}
              onChange={(e) => setTermYears(Number(e.target.value))}
              min={1}
              max={35}
              className="mt-1 border-border bg-secondary text-sm"
            />
          </div>
        </div>

        <div className="luxury-divider" />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-body text-sm text-muted-foreground">Parcela mensal</span>
            <span className="font-display text-xl font-bold text-gradient-gold">{formatPrice(result.monthlyPayment)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-muted-foreground">Valor financiado</span>
            <span className="font-body text-xs text-foreground">{formatPrice(result.loanAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-muted-foreground">Total de juros</span>
            <span className="font-body text-xs text-destructive">{formatPrice(result.totalInterest)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-xs text-muted-foreground">Total pago</span>
            <span className="font-body text-xs text-foreground">{formatPrice(result.totalPaid)}</span>
          </div>
        </div>

        <p className="font-body text-[10px] text-muted-foreground">
          * Simulação com base no Sistema Price (parcelas fixas). Valores aproximados, sujeitos a análise de crédito.
        </p>
      </div>
    </div>
  );
};

export default MortgageCalculator;
