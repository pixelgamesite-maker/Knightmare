import { useState } from "react";
import { motion } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { useInventory } from "@/hooks/useInventory";
import { useTrades } from "@/hooks/useTrades";
import { supabase } from "@/lib/supabase";
import { FRAGMENTS, CDN } from "@/lib/fragments";
import TopBar from "@/components/layout/TopBar";

export default function Trades() {
  const { player } = usePlayer();
  const { inventory, invalidate: refreshInv } = useInventory();
  const { trades, invalidate: refreshTrades } = useTrades();
  const [tab, setTab] = useState<"incoming" | "outgoing" | "new">("incoming");

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [toPlayer, setToPlayer] = useState<string | null>(null);

  const [offerFrag, setOfferFrag] = useState("");
  const [offerQty, setOfferQty] = useState(1);
  const [reqFrag, setReqFrag] = useState("");
  const [reqQty, setReqQty] = useState(1);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const incoming = trades.filter((t: any) => t.to_player_id === player?.id && t.status === "pending");
  const outgoing = trades.filter((t: any) => t.from_player_id === player?.id && t.status === "pending");

  const searchPlayers = async (q: string) => {
    setSearch(q);
    setToPlayer(null);
    setErrorMsg(null);
    if (q.length < 2) { setResults([]); return; }
    const { data, error } = await supabase
      .from("players")
      .select("id, username, display_name")
      .ilike("username", `%${q}%`)
      .limit(5);
    if (error) console.error("Search error:", error.message);
    setResults(data || []);
  };

  const selectPlayer = (r: any) => {
    setToPlayer(r.id);
    setSearch(r.username);
    setResults([]);
    setErrorMsg(null);
  };

  const create = async () => {
    setErrorMsg(null);

    if (!toPlayer) {
      setErrorMsg("Select a player from the search results");
      return;
    }
    if (!offerFrag) {
      setErrorMsg("Select what you're offering");
      return;
    }
    if (offerQty < 1) {
      setErrorMsg("Offer quantity must be at least 1");
      return;
    }
    if ((inventory[offerFrag] || 0) < offerQty) {
      setErrorMsg(`You only have ${inventory[offerFrag] || 0} ${FRAGMENTS[offerFrag].name}`);
      return;
    }

    setSending(true);
    const { data, error: rpcError } = await supabase.rpc("create_trade", {
      p_to_player_id: toPlayer,
      p_offered_fragment: offerFrag,
      p_offered_qty: offerQty,
      p_requested_fragment: reqFrag || null,
      p_requested_qty: reqFrag ? reqQty : 0,
    });
    setSending(false);

    if (rpcError) {
      setErrorMsg(rpcError.message);
      return;
    }
    if (!data?.success) {
      setErrorMsg(data?.error || "Trade failed");
      return;
    }

    refreshTrades();
    setTab("outgoing");
    setToPlayer(null);
    setSearch("");
    setOfferFrag("");
    setReqFrag("");
    setOfferQty(1);
    setReqQty(1);
  };

  const accept = async (id: string) => {
    const { data, error } = await supabase.rpc("accept_trade", { p_trade_id: id });
    if (error) { alert(error.message); return; }
    if (!data?.success) { alert(data?.error); return; }
    refreshInv(); refreshTrades();
  };

  const cancel = async (id: string) => {
    const { data, error } = await supabase.rpc("cancel_trade", { p_trade_id: id });
    if (error) { alert(error.message); return; }
    if (!data?.success) { alert(data?.error); return; }
    refreshTrades();
  };

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white">
      <TopBar />
      <div className="pt-20 pb-10 px-4 max-w-2xl mx-auto">
        <h1 className="font-['Press_Start_2P'] text-[12px] text-[#a855f7] mb-4">⇄ TRADES</h1>
        <div className="flex gap-2 mb-6">
          {(["incoming","outgoing","new"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setErrorMsg(null); }}
              className={`flex-1 py-2 text-[8px] font-['Press_Start_2P'] border-2 rounded ${
                tab===t ? "bg-[#7c3aed] border-[#a855f7] text-white" : "bg-[#0d0420] border-[#1a0a2e] text-[#6b5a80]"}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {tab === "incoming" && (
          <div className="space-y-3">
            {incoming.length === 0 && <p className="text-[10px] text-[#6b5a80] text-center py-8">No pending trades</p>}
            {incoming.map((t: any) => (
              <div key={t.id} className="bg-[#0d0420] border-2 border-[#2d1a4e] p-3 rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={`${CDN}/${FRAGMENTS[t.offered_fragment].file}`} className="w-6 h-6" alt="" />
                    <span className="text-[9px] text-cyan-400">{t.offered_qty}x {FRAGMENTS[t.offered_fragment].name}</span>
                  </div>
                  <span className="text-[8px] text-[#6b5a80]">FOR</span>
                  <div className="flex items-center gap-2">
                    {t.requested_fragment ? (
                      <>
                        <span className="text-[9px] text-amber-400">{t.requested_qty}x {FRAGMENTS[t.requested_fragment].name}</span>
                        <img src={`${CDN}/${FRAGMENTS[t.requested_fragment].file}`} className="w-6 h-6" alt="" />
                      </>
                    ) : (
                      <span className="text-[9px] text-emerald-400">FREE GIFT</span>
                    )}
                  </div>
                </div>
                <button onClick={() => accept(t.id)} className="w-full mt-2 py-1 bg-emerald-900/30 border border-emerald-800 rounded text-[8px] text-emerald-400 font-['Press_Start_2P'] hover:bg-emerald-900/50">
                  {t.requested_fragment ? "ACCEPT" : "CLAIM GIFT"}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "outgoing" && (
          <div className="space-y-3">
            {outgoing.length === 0 && <p className="text-[10px] text-[#6b5a80] text-center py-8">No outgoing trades</p>}
            {outgoing.map((t: any) => (
              <div key={t.id} className="bg-[#0d0420] border-2 border-[#2d1a4e] p-3 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-cyan-400">You offer {t.offered_qty}x {FRAGMENTS[t.offered_fragment].name}</span>
                  {t.requested_fragment ? (
                    <span className="text-[9px] text-amber-400">For {t.requested_qty}x {FRAGMENTS[t.requested_fragment].name}</span>
                  ) : (
                    <span className="text-[9px] text-emerald-400">As gift</span>
                  )}
                </div>
                <button onClick={() => cancel(t.id)} className="w-full mt-2 py-1 bg-red-900/30 border border-red-800 rounded text-[8px] text-red-400 font-['Press_Start_2P'] hover:bg-red-900/50">
                  CANCEL
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "new" && (
          <div className="bg-[#0d0420] border-2 border-[#2d1a4e] p-4 rounded space-y-4 relative">
            <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#22d3ee]" />
            <p className="font-['Press_Start_2P'] text-[8px] text-[#a855f7]">NEW TRADE</p>

            {/* Player Search */}
            <div>
              <label className="text-[9px] text-[#6b5a80] block mb-1">FIND PLAYER</label>
              <input value={search} onChange={e => searchPlayers(e.target.value)}
                className="w-full bg-[#04020c] border border-[#2d1a4e] rounded px-2 py-1 text-[10px] text-white font-mono"
                placeholder="Type username..." />
              {results.length > 0 && (
                <div className="mt-1 border border-[#2d1a4e] rounded bg-[#04020c]">
                  {results.map((r: any) => (
                    <button key={r.id} onClick={() => selectPlayer(r)}
                      className="w-full text-left px-2 py-1.5 text-[10px] text-[#c4b5d4] hover:bg-[#160830] border-b border-[#1a0a2e] last:border-0">
                      @{r.username} {r.display_name ? `— ${r.display_name}` : ""}
                    </button>
                  ))}
                </div>
              )}
              {toPlayer && <p className="text-[8px] text-emerald-400 mt-1">✓ To: {search}</p>}
            </div>

            {/* Offer / Request */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-[#6b5a80] block mb-1">YOU OFFER</label>
                <select value={offerFrag} onChange={e => { setOfferFrag(e.target.value); setErrorMsg(null); }}
                  className="w-full bg-[#04020c] border border-[#2d1a4e] rounded px-2 py-1 text-[10px] text-white mb-1">
                  <option value="">Select</option>
                  {Object.keys(FRAGMENTS).map(k => (
                    <option key={k} value={k}>{FRAGMENTS[k].name} ({inventory[k]||0})</option>
                  ))}
                </select>
                <input type="number" min={1} value={offerQty} onChange={e => setOfferQty(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-[#04020c] border border-[#2d1a4e] rounded px-2 py-1 text-[10px] text-white" />
              </div>
              <div>
                <label className="text-[9px] text-[#6b5a80] block mb-1">YOU REQUEST (OPTIONAL)</label>
                <select value={reqFrag} onChange={e => { setReqFrag(e.target.value); setErrorMsg(null); }}
                  className="w-full bg-[#04020c] border border-[#2d1a4e] rounded px-2 py-1 text-[10px] text-white mb-1">
                  <option value="">Nothing (Gift)</option>
                  {Object.keys(FRAGMENTS).map(k => (
                    <option key={k} value={k}>{FRAGMENTS[k].name}</option>
                  ))}
                </select>
                {reqFrag && (
                  <input type="number" min={1} value={reqQty} onChange={e => setReqQty(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#04020c] border border-[#2d1a4e] rounded px-2 py-1 text-[10px] text-white" />
                )}
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <p className="text-[9px] text-red-400 font-['Press_Start_2P'] bg-red-900/20 border border-red-900/40 rounded p-2">
                {errorMsg}
              </p>
            )}

            <button onClick={create} disabled={sending}
              className="w-full py-2 bg-[#7c3aed] border-2 border-[#a855f7] rounded font-['Press_Start_2P'] text-[8px] text-white hover:bg-[#9333ea] disabled:opacity-50">
              {sending ? "SENDING..." : "SEND TRADE"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
