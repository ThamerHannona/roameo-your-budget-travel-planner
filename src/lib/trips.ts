import { supabase } from "@/integrations/supabase/client";
import type { CategorySpend } from "./budget";

export type TripItemType = "flight" | "hotel" | "activity";

export interface TripItemInput {
  trip_id: string;
  item_type: TripItemType;
  provider?: string;
  external_id?: string;
  title?: string;
  price: number;
  currency?: string;
  meta?: Record<string, unknown>;
}

export async function addTripItem(input: TripItemInput) {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("trip_items")
    .insert([
      {
        trip_id: input.trip_id,
        user_id: uid,
        item_type: input.item_type,
        provider: input.provider,
        external_id: input.external_id,
        title: input.title,
        price: input.price,
        currency: input.currency ?? "USD",
        meta: (input.meta ?? {}) as never,
        searched_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listTripItems(tripId: string) {
  const { data, error } = await supabase
    .from("trip_items")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

const TYPE_TO_CATEGORY: Record<TripItemType, keyof CategorySpend> = {
  flight: "transport",
  hotel: "lodging",
  activity: "other",
};

export function itemsToSpend(
  items: Array<{ item_type: TripItemType; price: number | string }>
): CategorySpend {
  const acc: CategorySpend = { transport: 0, lodging: 0, other: 0 };
  for (const it of items) {
    const cat = TYPE_TO_CATEGORY[it.item_type];
    acc[cat] += Number(it.price) || 0;
  }
  return acc;
}
