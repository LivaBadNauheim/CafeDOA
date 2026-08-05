import type { ComponentType } from "react";
import {
  AcaiBowlIcon,
  AvocadoToastIcon,
  CoffeeCupIcon,
  MatchaGlassIcon,
  PendantLampIcon,
  PlantBranchIcon,
} from "./icons";

type Variant = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  bg: string;
};

export const GALLERY_PLACEHOLDERS: Variant[] = [
  { key: "coffee", label: "Kaffeespezialitäten", icon: CoffeeCupIcon, bg: "bg-ink text-cream" },
  { key: "matcha", label: "Matcha & Iced Drinks", icon: MatchaGlassIcon, bg: "bg-green text-cream" },
  { key: "toast", label: "Avocado Bread", icon: AvocadoToastIcon, bg: "bg-cream-deep text-ink" },
  { key: "bowl", label: "Acai & Sweet Bowls", icon: AcaiBowlIcon, bg: "bg-terracotta text-cream" },
  { key: "interior", label: "Café-Atmosphäre", icon: PendantLampIcon, bg: "bg-cream-soft text-ink" },
  { key: "plant", label: "Grüne Deko-Ecken", icon: PlantBranchIcon, bg: "bg-green-light text-cream" },
];

export function PlaceholderTile({ variant }: { variant: Variant }) {
  const Icon = variant.icon;
  return (
    <div
      className={`relative flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl ${variant.bg}`}
    >
      <span className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rotate-12 border border-current/25" />
      <span className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 -rotate-6 border border-current/15" />
      <Icon className="h-11 w-11 opacity-90" />
      <span className="px-4 text-center text-xs font-medium tracking-wide opacity-80">
        {variant.label}
      </span>
    </div>
  );
}
