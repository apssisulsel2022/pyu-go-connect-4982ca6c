import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GuestAccessCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  features?: string[];
  ctaText?: string;
  ctaLink?: string;
}

/**
 * Attractive guest access error card
 * Displayed when unauthenticated users try to access protected pages
 */
export default function GuestAccessCard({
  icon,
  title,
  description,
  features,
  ctaText = "Sign In",
  ctaLink = "/auth",
}: GuestAccessCardProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md p-8 shadow-lg border-0 bg-white dark:bg-slate-900">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full">
            <div className="text-primary text-4xl">{icon}</div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-3 text-slate-900 dark:text-white">
          {title}
        </h1>

        {/* Description */}
        <p className="text-center text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          {description}
        </p>

        {/* Features List */}
        {features && features.length > 0 && (
          <div className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <Button
          onClick={() => navigate(ctaLink)}
          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-semibold py-2.5 rounded-lg transition-all hover:shadow-md"
        >
          {ctaText}
        </Button>

        {/* Footer */}
        <p className="text-xs text-center text-slate-500 dark:text-slate-500 mt-4">
          Secure • Fast • Easy
        </p>
      </Card>
    </div>
  );
}
