import useSWR from "swr";
import { supabase } from "@/lib/supabase";

export function usePlayer() {
  const { data, mutate } = useSWR("player", async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: player } = await supabase
      .from("players")
      .select("*")
      .eq("id", user.id)
      .single();
    return player;
  }, { refreshInterval: 5000 });

  return { player: data, mutate };
}

// hooks/useInventory.ts
import useSWR from "swr";
import { supabase } from "@/lib/supabase";

export function useInventory() {
  const { data, mutate } = useSWR("inventory", async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};
    const { data: rows } = await supabase
      .from("inventory")
      .select("fragment_type, quantity")
      .eq("player_id", user.id);
    
    const map: Record<string, number> = {};
    rows?.forEach(r => map[r.fragment_type] = r.quantity);
    return map;
  });

  return { inventory: data || {}, mutate };
}
