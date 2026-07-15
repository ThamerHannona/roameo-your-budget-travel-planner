import { useEffect, useMemo, useState } from "react";
import { Plane, Hotel, Sparkles, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { computeBudgetEnvelope, tripTotalStatus, DEFAULT_SPLIT } from "@/lib/budget";
import { itemsToSpend, type TripItemType } from "@/lib/trips";
import { cn } from "@/lib/utils";

interface TripRow {
  budget_total: number;
  currency: string;
  split_transport: number;
  split_lodging: number;
  split_other: number;
}

interface Props {
  tripId: string;
  className?: string;
}

/**
 * Live budget bar for a trip. Reads `trips` + `trip_items` and enforces
 * the 40/35/25 caps from src/lib/budget.ts. Real prices only — populated
 * as the user picks flights/hotels/activities.
 */
export function TripBudgetBar({ tripId, className }: Props) {
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [items, setItems] = useState<Array<{ item_type: TripItemType; price: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [{ data: t }, { data: rows }] = await Promise.all([
        supabase
          .from("trips")
          .select("budget_total,currency,split_transport,split_lodging,split_other")
          .eq("id", tripId)
          .maybeSingle(),
        supabase.from("trip_items").select("item_type,price").eq("trip_id", tripId),
      ]);
      if (cancelled) return;
      setTrip(t as TripRow | null);
      setItems(
        (rows ?? []).map((r) => ({
          item_type: r.item_type as TripItemType,
          price: Number(r.price) || 0,
        }))
      );
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`trip-items-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_items", filter: `trip_id=eq.${tripId}` },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  const status = useMemo(() => {
    if (!trip) return null;
    const envelope = computeBudgetEnvelope(Number(trip.budget_total) || 0, {
      transport: Number(trip.split_transport) || DEFAULT_SPLIT.transport,
      lodging: Number(trip.split_lodging) || DEFAULT_SPLIT.lodging,
      other: Number(trip.split_other) || DEFAULT_SPLIT.other,
    });
    return { envelope, ...tripTotalStatus(envelope, itemsToSpend(items)) };
  }, [trip, items]);

  if (loading || !status) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: trip?.currency ?? "USD",
      maximumFractionDigits: 0,
    }).format(n);

  const cats: Array<{
    key: "transport" | "lodging" | "other";
    label: string;
    Icon: typeof Plane;
  }> = [
    { key: "transport", label: "Flights", Icon: Plane },
    { key: "lodging", label: "Hotels", Icon: Hotel },
    { key: "other", label: "Other", Icon: Sparkles },
  ];

  return (
    <div className={cn("glass rounded-xl p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">Trip budget</div>
        <div
          className={cn(
            "text-sm font-semibold flex items-center gap-1",
            status.overBudget ? "text-destructive" : "text-foreground"
          )}
        >
          {status.overBudget && <AlertTriangle className="h-4 w-4" />}
          {fmt(status.spent)} / {fmt(status.envelope.total)}
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            status.overBudget ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${Math.min(100, status.pctUsed)}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {cats.map(({ key, label, Icon }) => {
          const c = status.perCategory[key];
          const pct = c.cap > 0 ? Math.min(100, (c.spent / c.cap) * 100) : 0;
          return (
            <div key={key} className="rounded-lg border border-border/50 p-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
              <div
                className={cn(
                  "text-xs font-medium",
                  c.over ? "text-destructive" : "text-foreground"
                )}
              >
                {fmt(c.spent)}{" "}
                <span className="text-muted-foreground font-normal">/ {fmt(c.cap)}</span>
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full", c.over ? "bg-destructive" : "bg-primary/70")}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
