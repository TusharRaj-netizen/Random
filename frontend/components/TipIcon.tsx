"use client";

import {
  Droplet,
  Footprints,
  Pill,
  Salad,
  HeartPulse,
  PiggyBank,
  Shield,
  Users,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  droplet: Droplet,
  footprints: Footprints,
  pill: Pill,
  salad: Salad,
  "heart-pulse": HeartPulse,
  "piggy-bank": PiggyBank,
  shield: Shield,
  users: Users,
};

export default function TipIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? HelpCircle;
  return <Icon className={className} aria-hidden />;
}