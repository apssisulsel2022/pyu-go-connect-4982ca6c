/**
 * PriceCalculator utility
 * Centralizes price calculation logic for reuse across app
 * Can be used in both backend services and frontend for preview
 */

export interface PricingRules {
    baseFareMultiplier: number;
    distanceCostPerKm: number;
    peakHoursMultiplier: number;
    rayonBaseSurcharge: number;
}

export class PriceCalculator {
    /**
     * Calculate base amount from route fare and service multiplier
     */
    static calculateBaseAmount(routeFare: number, multiplier: number = 1.0): number {
        return routeFare * multiplier;
    }

    /**
     * Calculate service premium (difference from standard)
     */
    static calculateServicePremium(routeFare: number, multiplier: number): number {
        return routeFare * (multiplier - 1.0);
    }

    /**
     * Calculate distance-based charge
     */
    static calculateDistanceCharge(
        distanceKm: number,
        costPerKm: number
    ): number {
        return distanceKm * costPerKm;
    }

    /**
     * Calculate rayon surcharge
     */
    static calculateRayonSurcharge(
        baseSurcharge: number,
        seatCount: number = 1
    ): number {
        return baseSurcharge * seatCount;
    }

    /**
     * Apply peak hours multiplier
     */
    static applyPeakHoursMultiplier(
        subtotal: number,
        multiplier: number = 1.0
    ): number {
        return subtotal * multiplier;
    }

    /**
     * Calculate total price with all components
     * Usage:
     *   const total = PriceCalculator.calculateTotal({
     *     routeFare: 150000,
     *     distanceKm: 50,
     *     seatCount: 2,
     *     ...pricingRules
     *   })
     */
    static calculateTotal({
        routeFare,
        distanceKm = 0,
        seatCount = 1,
        baseFareMultiplier = 1.0,
        distanceCostPerKm = 0,
        peakHoursMultiplier = 1.0,
        rayonBaseSurcharge = 0,
    }: {
        routeFare: number;
        distanceKm?: number;
        seatCount?: number;
        baseFareMultiplier?: number;
        distanceCostPerKm?: number;
        peakHoursMultiplier?: number;
        rayonBaseSurcharge?: number;
    }): {
        baseAmount: number;
        servicePremium: number;
        distanceAmount: number;
        rayonSurcharge: number;
        subtotal: number;
        peakMultiplier: number;
        totalAmount: number;
    } {
        const baseAmount = this.calculateBaseAmount(routeFare, baseFareMultiplier);
        const servicePremium = this.calculateServicePremium(routeFare, baseFareMultiplier);
        const distanceAmount = this.calculateDistanceCharge(distanceKm, distanceCostPerKm);
        const rayonSurcharge = this.calculateRayonSurcharge(rayonBaseSurcharge, seatCount);

        const subtotal = baseAmount + distanceAmount + rayonSurcharge;
        const totalAmount = this.applyPeakHoursMultiplier(subtotal, peakHoursMultiplier);

        return {
            baseAmount: Math.round(baseAmount * 100) / 100,
            servicePremium: Math.round(servicePremium * 100) / 100,
            distanceAmount: Math.round(distanceAmount * 100) / 100,
            rayonSurcharge: Math.round(rayonSurcharge * 100) / 100,
            subtotal: Math.round(subtotal * 100) / 100,
            peakMultiplier: peakHoursMultiplier,
            totalAmount: Math.round(totalAmount * 100) / 100,
        };
    }

    /**
     * Format price as Indonesian Rupiah
     */
    static formatPrice(amount: number, currency: boolean = true): string {
        const formatted = amount.toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
        return currency ? `Rp ${formatted}` : formatted;
    }

    /**
     * Verify if two prices are equivalent (within 1 rupiah tolerance)
     * Used to prevent price tampering
     */
    static verifyPrice(expectedPrice: number, actualPrice: number, tolerance: number = 1.0): boolean {
        return Math.abs(expectedPrice - actualPrice) <= tolerance;
    }

    /**
     * Calculate price breakdown for display
     */
    static getPriceBreakdown(calculatedPrice: {
        baseAmount: number;
        servicePremium: number;
        distanceAmount: number;
        rayonSurcharge: number;
        peakMultiplier: number;
        totalAmount: number;
    }): Array<{ label: string; amount: number }> {
        const breakdown: Array<{ label: string; amount: number }> = [];

        breakdown.push({
            label: 'Base Fare',
            amount: calculatedPrice.baseAmount,
        });

        if (calculatedPrice.servicePremium > 0) {
            breakdown.push({
                label: 'Service Premium',
                amount: calculatedPrice.servicePremium,
            });
        }

        if (calculatedPrice.distanceAmount > 0) {
            breakdown.push({
                label: 'Distance Charge',
                amount: calculatedPrice.distanceAmount,
            });
        }

        if (calculatedPrice.rayonSurcharge > 0) {
            breakdown.push({
                label: 'Rayon Surcharge',
                amount: calculatedPrice.rayonSurcharge,
            });
        }

        if (calculatedPrice.peakMultiplier > 1.0) {
            const peakPortion = (calculatedPrice.peakMultiplier - 1.0) * 
                (calculatedPrice.baseAmount + 
                 calculatedPrice.distanceAmount + 
                 calculatedPrice.rayonSurcharge);
            
            breakdown.push({
                label: 'Peak Hours Premium',
                amount: Math.round(peakPortion * 100) / 100,
            });
        }

        breakdown.push({
            label: 'TOTAL',
            amount: calculatedPrice.totalAmount,
        });

        return breakdown;
    }
}

export default PriceCalculator;
