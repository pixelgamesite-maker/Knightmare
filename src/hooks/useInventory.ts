import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useInventory() {
  const qc = useQueryClient();
  const { data: inventory, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {};
      const { data, error } = await supabase
        .from("inventory").select("fragment_type, quantity").eq("player_id", user.id);
      if (error) throw error;
      const map: Record<string, number> = {};
      data?.forEach((r: any) => map[r.fragment_type] = r.quantity);
      return map;
    },
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["inventory"] });
  return { inventory: inventory || {}, isLoading, invalidate };
}
