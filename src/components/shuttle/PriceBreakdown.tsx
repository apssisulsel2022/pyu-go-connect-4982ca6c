import { PriceBreakdown as PriceBreakdownType } from '@/services/ShuttleService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface PriceBreakdownProps {
  breakdown: PriceBreakdownType;
  compact?: boolean;
}

export function PriceBreakdown({ breakdown, compact = false }: PriceBreakdownProps) {
  const formatPrice = (amount: number) =>
    amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (compact) {
    // Compact version for summary
    return (
      <div className="space-y-2 py-2">
        {breakdown.breakdown
          .filter(item => item.label !== 'TOTAL')
          .slice(0, 2)
          .map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.label}</span>
              <span>Rp {formatPrice(item.amount)}</span>
            </div>
          ))}
        {breakdown.breakdown.length > 2 && (
          <p className="text-xs text-muted-foreground">+{breakdown.breakdown.length - 3} more items</p>
        )}
      </div>
    );
  }

  // Full version for detailed view
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Price Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Breakdown Items */}
        {breakdown.breakdown
          .filter(item => item.label !== 'TOTAL')
          .map((item, index) => (
            <div key={index}>
              <div className="flex justify-between py-2 px-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium">Rp {formatPrice(item.amount)}</span>
              </div>
              {index < breakdown.breakdown.length - 2 && (
                <Separator className="my-0" />
              )}
            </div>
          ))}

        {/* Separator */}
        <Separator className="my-3" />

        {/* Total */}
        <div className="flex justify-between items-center bg-primary/5 rounded-lg p-3">
          <span className="font-semibold text-primary">TOTAL</span>
          <span className="text-2xl font-bold text-primary">
            Rp {formatPrice(breakdown.totalAmount)}
          </span>
        </div>

        {/* Peak Hours Indicator */}
        {breakdown.peakHoursMultiplier > 1.0 && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
            ⏰ Peak hours surcharge applied ({breakdown.peakHoursMultiplier}x)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
