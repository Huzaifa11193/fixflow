import { Check, Crown, Sparkles } from "lucide-react";

import { AppShell, Panel } from "@/components/fixflow/app-shell";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    detail: "Paste errors, get explanations, ranked fixes, and prevention tips.",
    features: ["Basic analysis", "Last 5 cached results", "Copy fixes", "Learning mode"],
  },
  {
    name: "Premium",
    price: "$5/mo",
    detail: "For active developers who want faster fixes and deeper project context.",
    features: ["Advanced context scan", "Editor apply", "Priority responses", "Team sharing"],
  },
  {
    name: "Lifetime",
    price: "$39",
    detail: "Simple one-time plan for solo developers and learners.",
    features: ["Premium personal features", "Unlimited history", "Pattern insights", "Early integrations"],
  },
];

export default function PricingPage() {
  return (
    <AppShell
      active="Pricing"
      description="A simple free-first pricing model that matches the documentation: wide adoption, low monthly premium, and a lifetime option."
      title="Plans"
    >
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Panel className="p-5" key={plan.name}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">{plan.name}</h2>
              {plan.name === "Premium" ? (
                <Crown className="size-5 text-amber-300" />
              ) : (
                <Sparkles className="size-5 text-cyan-300" />
              )}
            </div>
            <p className="mt-4 break-words text-3xl font-semibold text-white sm:text-4xl">{plan.price}</p>
            <p className="mt-3 min-h-16 break-words text-sm leading-6 text-zinc-400">{plan.detail}</p>
            <Button className="mt-5 w-full bg-emerald-400 text-[#071015] hover:bg-emerald-300">
              Choose plan
            </Button>
            <div className="mt-5 space-y-3">
              {plan.features.map((feature) => (
                <div className="flex gap-3 text-sm leading-6 text-zinc-300" key={feature}>
                  <Check className="size-4 text-emerald-300" />
                  <span className="min-w-0 break-words">{feature}</span>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
