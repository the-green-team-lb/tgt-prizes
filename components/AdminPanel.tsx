"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { useActiveDraw, useDrawMutations, useDrawHistory } from "@/lib/use-local-store";
import { api } from "../convex/_generated/api";
import { parseNumberInput } from "@/lib/wheel-data";
import LiveDrawControl from "./LiveDrawControl";

// Preset prize data
const PRESET_PRIZES = [
  "1st Prize - $600 Cash or Store Credit",
  "2nd Prize - $400 Store Credit",
  "3rd Prize - $300 Store Credit",
  "4th Prize - $200 Store Credit",
  "5th Prize - $150 Store Credit",
  "6th Prize - $150 Store Credit",
  "7th Prize - $100 Store Credit",
  "8th Prize - $100 Store Credit",
  "9th Prize - $50 Store Credit",
  "10th Prize - $50 Store Credit",
];

const QUICK_ADD_USD = [
  { emoji: "\u{1F947}", label: "1st Prize - $600 Cash or Store Credit", value: 600 },
  { emoji: "\u{1F948}", label: "2nd Prize - $400 Store Credit", value: 400 },
  { emoji: "\u{1F949}", label: "3rd Prize - $300 Store Credit", value: 300 },
  { emoji: "\u{1F3C6}", label: "4th Prize - $200 Store Credit", value: 200 },
  { emoji: "\u{2B50}", label: "5th Prize - $150 Store Credit", value: 150 },
  { emoji: "\u{2B50}", label: "6th Prize - $150 Store Credit", value: 150 },
  { emoji: "\u{1F381}", label: "7th Prize - $100 Store Credit", value: 100 },
  { emoji: "\u{1F381}", label: "8th Prize - $100 Store Credit", value: 100 },
  { emoji: "\u{1F381}", label: "9th Prize - $50 Store Credit", value: 50 },
  { emoji: "\u{1F381}", label: "10th Prize - $50 Store Credit", value: 50 },
];

const POSITION_LABELS = [
  "10th Prize", "11th Prize", "12th Prize", "13th Prize", "14th Prize", "15th Prize", "Custom",
];

// Main AdminPanel
export default function AdminPanel() {
  const draw = useActiveDraw(true);

  return (
    <div className="space-y-6">
      {!draw ? <CreateDrawSection /> : <ActiveDrawSection draw={draw} />}
      <DrawHistorySection />
    </div>
  );
}

// Create Draw (with preloaded prizes)
function CreateDrawSection() {
  const { createDraw } = useDrawMutations();
  const [title, setTitle] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [prizeList, setPrizeList] = useState<string[]>([]);
  const [winnersCount, setWinnersCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [raffleLink, setRaffleLink] = useState("");
  const [ticketImageUrl, setTicketImageUrl] = useState<string | null>(null);
  const [drawNote, setDrawNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom builder state
  const [customAmount, setCustomAmount] = useState("");
  const [customType, setCustomType] = useState("Store Credit");
  const [customPosition, setCustomPosition] = useState("11th Prize");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Upload image to single API route (processes + uploads to Convex)
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/convex/upload", { method: "POST", body: formData });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await res.json();
      if (!data.url) {
        throw new Error("No URL returned");
      }

      setTicketImageUrl(data.url);
    } catch (err) {
      console.error("Upload error:", err);
      alert(err instanceof Error ? err.message : "Failed to upload image");
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return alert("Enter a title");
    if (prizeList.length === 0) return alert("Add at least one prize");

    setLoading(true);
    try {
      // Build scheduled timestamp in UK time (Europe/London)
      let scheduledAt: number | undefined;
      if (scheduledDate) {
        const timeStr = scheduledTime || "00:00";
        // Figure out London's UTC offset for this date
        const refUtc = new Date(`${scheduledDate}T12:00:00Z`);
        const londonStr = refUtc.toLocaleString("sv-SE", { timeZone: "Europe/London" });
        const londonAsUtc = new Date(londonStr + "Z");
        const offsetMs = londonAsUtc.getTime() - refUtc.getTime();
        // User entered London time, subtract offset to get UTC
        scheduledAt = new Date(`${scheduledDate}T${timeStr}:00Z`).getTime() - offsetMs;
      }

      await createDraw({
        title: title.trim(),
        prizes: prizeList,
        winnersCount,
        scheduledAt,
        raffleLink: raffleLink.trim() || undefined,
        ticketImageUrl: ticketImageUrl || undefined,
        drawNote: drawNote.trim() || undefined,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create draw");
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = () => {
    setPrizeList([...PRESET_PRIZES]);
    setWinnersCount(10);
  };

  const addPrize = (prize: string) => {
    setPrizeList((prev) => [...prev, prize]);
    setWinnersCount((prev) => Math.max(prev, prizeList.length + 1));
  };

  const removePrize = (index: number) => {
    setPrizeList((prev) => prev.filter((_, i) => i !== index));
  };

  const addCustomPrize = () => {
    if (!customAmount) return alert("Enter an amount");
    const label = customPosition === "Custom"
      ? `$${customAmount} ${customType}`
      : `${customPosition} - $${customAmount} ${customType}`;
    addPrize(label);
    setCustomAmount("");
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-brand-gold to-amber-500 px-5 py-3">
          <h3 className="text-brand-dark font-bold">Create New Draw</h3>
        </div>
        <div className="p-5">
          <label className="text-brand-muted text-sm block mb-2 font-medium">Draw Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., February 2026 Prize Draw"
            className="w-full bg-brand-card border border-brand-gold rounded-xl px-4 py-3 text-brand-text text-sm focus:outline-none focus:border-brand-gold transition-colors mb-4"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-brand-muted text-xs block mb-2 font-medium">Draw Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-brand-card border border-brand-gold rounded-xl px-4 py-3 text-brand-text text-sm focus:outline-none focus:border-brand-gold transition-colors"
              />
            </div>
            <div>
              <label className="text-brand-muted text-xs block mb-2 font-medium">Draw Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full bg-brand-card border border-brand-gold rounded-xl px-4 py-3 text-brand-text text-sm focus:outline-none focus:border-brand-gold transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Raffle Link */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="bg-brand-green/50 px-5 py-3">
          <h3 className="text-white font-bold">Raffle Details</h3>
        </div>
        <div className="p-5">
          <label className="text-brand-muted text-sm block mb-2 font-medium">Raffle Link (LittleBiggy)</label>
          <input
            type="url"
            value={raffleLink}
            onChange={(e) => setRaffleLink(e.target.value)}
            placeholder="https://littlebiggy.org/..."
            className="w-full bg-brand-card border border-brand-gold rounded-xl px-4 py-3 text-brand-text text-sm focus:outline-none focus:border-brand-gold transition-colors mb-4"
          />
          <label className="text-brand-muted text-sm block mb-2 font-medium">Draw Note (Optional - Shows on draw page)</label>
          <input
            type="text"
            value={drawNote}
            onChange={(e) => setDrawNote(e.target.value)}
            placeholder="e.g., GOOD LUCK! or HAPPY MARCH!"
            className="w-full bg-brand-card border border-brand-gold rounded-xl px-4 py-3 text-brand-text text-sm focus:outline-none focus:border-brand-gold transition-colors mb-4"
          />
          <p className="text-xs text-brand-muted mb-4">This note appears as the last &quot;prize&quot; on the wheel (e.g., GOOD LUCK EVERYONE!)</p>
          <label className="text-brand-muted text-sm block mb-2 font-medium">Ticket Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="text-sm text-brand-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-brand-gold/10 file:text-brand-gold hover:file:bg-brand-gold/20 file:cursor-pointer file:font-medium"
          />
          {ticketImageUrl && <span className="text-green-400 text-sm ml-3">Uploaded</span>}
        </div>
      </div>

      {/* 1: One-Click Preset */}
      <div className="glass-card rounded-2xl overflow-hidden border-blue-500/30">
        <div className="bg-blue-600/30 px-5 py-3">
          <h3 className="text-blue-400 font-bold">Quick Setup</h3>
        </div>
        <div className="p-5">
          <p className="text-brand-muted text-sm mb-4">Load the standard 10-prize Cash &amp; Store Credit package</p>
          <button
            onClick={loadPreset}
            className="bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark font-bold px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all text-sm"
          >
            Load Cash &amp; Store Credit Prizes (10)
          </button>
        </div>
      </div>

      {/* 2: Individual Quick-Add */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="bg-brand-card px-5 py-3 border-b border-brand-border">
          <h3 className="text-brand-text font-bold">Quick Add Individual Prizes</h3>
        </div>
        <div className="p-5">
          <p className="text-brand-muted text-sm mb-4">Click to add any prize to the list</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_ADD_USD.map((item, i) => (
              <button
                key={i}
                onClick={() => addPrize(item.label)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-card border border-brand-gold hover:border-brand-gold/50 hover:bg-brand-gold/5 transition-all text-left group text-sm"
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="text-brand-muted group-hover:text-brand-text transition-colors flex-1">{item.label}</span>
                <span className="text-brand-gold text-xs font-bold">+</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3: Custom Amount Builder */}
      <div className="glass-card rounded-2xl overflow-hidden border-brand-gold/30">
        <div className="bg-gradient-to-r from-brand-gold to-amber-500 px-5 py-3">
          <h3 className="text-brand-dark font-bold">Custom Prize Builder</h3>
        </div>
        <div className="p-5">
          <p className="text-brand-muted text-sm mb-4">Build a custom prize with any amount</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-brand-muted block mb-2 font-medium">Amount ($)</label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="100"
                className="w-28 bg-brand-card border border-brand-gold rounded-xl px-4 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-gold transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-brand-muted block mb-2 font-medium">Type</label>
              <select
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="bg-brand-card border border-brand-gold rounded-xl px-4 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-gold transition-colors"
              >
                <option>Store Credit</option>
                <option>Cash</option>
                <option>Cash or Store Credit</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-brand-muted block mb-2 font-medium">Position</label>
              <select
                value={customPosition}
                onChange={(e) => setCustomPosition(e.target.value)}
                className="bg-brand-card border border-brand-gold rounded-xl px-4 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-gold transition-colors"
              >
                {POSITION_LABELS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
            <button
              onClick={addCustomPrize}
              className="bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all text-sm"
            >
              Add Prize
            </button>
          </div>
        </div>
      </div>

      {/* Prize List & Create */}
      <div className="glass-card rounded-2xl overflow-hidden border-brand-gold/30">
        <div className="bg-gradient-to-r from-brand-gold to-amber-500 px-5 py-3">
          <h3 className="text-brand-dark font-bold">Prize List ({prizeList.length})</h3>
        </div>
        <div className="p-5">
          {prizeList.length > 0 && (
            <button
              onClick={() => setPrizeList([])}
              className="text-xs text-brand-muted hover:text-red-400 mb-4 transition-colors"
            >
              Clear All
            </button>
          )}

          {prizeList.length === 0 ? (
            <p className="text-brand-muted text-sm py-8 text-center">
              No prizes added yet. Use the buttons above to add prizes.
            </p>
          ) : (
            <div className="space-y-2 mb-5 max-h-64 overflow-y-auto">
              {prizeList.map((prize, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-brand-card border border-brand-border group"
                >
                  <span className="text-sm text-brand-text">
                    <span className="text-brand-gold mr-2 font-bold">#{i + 1}</span>
                    {prize}
                  </span>
                  <button
                    onClick={() => removePrize(i)}
                    className="text-red-400/50 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-5 border-t border-brand-border">
            <div>
              <label className="text-xs text-brand-muted block mb-2 font-medium">Winners</label>
              <input
                type="number"
                value={winnersCount}
                onChange={(e) =>
                  setWinnersCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                min={1}
                className="w-24 bg-brand-card border border-brand-gold rounded-xl px-4 py-2.5 text-brand-text text-sm focus:outline-none focus:border-brand-gold transition-colors"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={loading || prizeList.length === 0}
              className="flex-1 bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? "Creating..." : "Create Draw"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Active Draw Section
function ActiveDrawSection({ draw }: { draw: any }) {
  return (
    <div className="space-y-6">
      {/* Status header */}
      <div className="glass-card rounded-2xl overflow-hidden border-brand-gold/30">
        <div className="bg-gradient-to-r from-brand-gold to-amber-500 px-5 py-3">
          <h3 className="text-brand-dark font-bold">{draw.title}</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand-muted">
                Status: <span className="text-brand-gold font-medium">{draw.drawStatus}</span>{" "}
                | {draw.participatingNumbers.length} numbers |{" "}
                {draw.winners.length}/{draw.winnersCount} winners
              </p>
              {draw.scheduledAt && (
                <p className="text-sm text-brand-text mt-2">
                  Scheduled: {new Date(draw.scheduledAt).toLocaleDateString("en-GB", { timeZone: "Europe/London", weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  {" at "}
                  {new Date(draw.scheduledAt).toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false })}
                  {" UK"}
                </p>
              )}
            </div>
            <div>
              {draw.participatingNumbers.length === 0 && draw.drawStatus === "idle" && (
                <span className="text-brand-muted text-sm bg-brand-card px-3 py-1.5 rounded-lg">
                  Numbers Not Loaded
                </span>
              )}
              {draw.participatingNumbers.length > 0 && (
                <span className="text-brand-gold text-sm bg-brand-gold/10 px-3 py-1.5 rounded-lg border border-brand-gold/20">
                  {draw.participatingNumbers.length} Numbers Loaded
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prizes, Image & Note */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="bg-brand-green/50 px-5 py-3">
          <h3 className="text-white font-bold">Draw Details</h3>
        </div>
        <div className="p-5 space-y-4">
          {/* Prizes */}
          {draw.prizes && draw.prizes.length > 0 && (
            <div>
              <p className="text-brand-muted text-sm font-medium mb-2">Prizes ({draw.prizes.length})</p>
              <div className="space-y-1">
                {draw.prizes.map((prize: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xs font-bold border border-brand-gold/30">
                      {i + 1}
                    </span>
                    <span className="text-brand-text/80">{prize}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Draw Note */}
          {draw.drawNote && (
            <div>
              <p className="text-brand-muted text-sm font-medium mb-1">Draw Note</p>
              <p className="text-brand-gold text-sm font-semibold">{draw.drawNote}</p>
            </div>
          )}

          {/* Ticket Image */}
          {draw.ticketImageUrl && (
            <div>
              <p className="text-brand-muted text-sm font-medium mb-2">Ticket Image</p>
              <div className="border border-brand-border rounded-xl p-2 inline-block">
                <img src={draw.ticketImageUrl} alt="Raffle Ticket" className="max-w-full max-h-48 rounded-lg bg-white" />
              </div>
            </div>
          )}

          {/* Raffle Link */}
          {draw.raffleLink && (
            <div>
              <p className="text-brand-muted text-sm font-medium mb-1">Raffle Link</p>
              <a href={draw.raffleLink} target="_blank" rel="noopener noreferrer" className="text-brand-gold text-sm hover:underline break-all">
                {draw.raffleLink}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Load numbers (only when idle) */}
      {draw.drawStatus === "idle" && (
        <LoadNumbersSection serverSeed={draw.serverSeed} />
      )}

      {/* Draw controls */}
      <LiveDrawControl draw={draw} />

      {/* Debug */}
      <DebugSection draw={draw} />
    </div>
  );
}

// Load Numbers
function LoadNumbersSection({ serverSeed }: { serverSeed: string }) {
  const { loadNumbers, computeAndStoreHash } = useDrawMutations();
  const [input, setInput] = useState("");
  const [serialInput, setSerialInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ number: number; color: string }[]>([]);

  const handlePreview = () => {
    const parsed = parseNumberInput(input);
    setPreview(parsed);
  };

  const handleLoad = async () => {
    const parsed = parseNumberInput(input);
    if (parsed.length === 0) return alert("No valid numbers parsed");

    setLoading(true);
    try {
      const result = await loadNumbers({
        numbers: parsed,
        serialNumbers: serialInput.trim() || undefined,
      });
      await computeAndStoreHash({
        drawId: result.drawId,
        serverSeed: result.serverSeed,
        numbers: parsed,
      });
      setSerialInput(""); // Clear serial after successful load
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to load numbers");
    } finally {
      setLoading(false);
    }
  };

  // Color distribution from preview
  const colorCounts: Record<string, number> = {};
  preview.forEach((e) => {
    colorCounts[e.color] = (colorCounts[e.color] || 0) + 1;
  });

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="bg-brand-green/50 px-5 py-3">
        <h3 className="text-white font-bold">Load Numbers</h3>
      </div>
      <div className="p-5">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-brand-muted block mb-2 font-medium">
              Enter Numbers (Format: START-END COLOR)
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              placeholder={"1-800 Pink\n801-1200 Blue\n1201-1500 Red"}
              className="w-full bg-brand-card border border-brand-gold rounded-xl px-4 py-3 text-brand-text text-sm font-mono focus:outline-none focus:border-brand-gold transition-colors"
            />
          </div>

          {/* Serial Number Input */}
          <div>
            <label className="text-sm text-brand-muted block mb-2 font-medium">
              Serial Numbers (Optional - For Record Keeping)
            </label>
            <textarea
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              rows={2}
              placeholder={"Example: Serial batch #1234 for Pink tickets\nAdditional serial info..."}
              className="w-full bg-brand-card border border-brand-gold rounded-xl px-4 py-3 text-brand-text text-sm font-mono focus:outline-none focus:border-brand-gold transition-colors"
            />
            <p className="text-xs text-brand-muted mt-1">
              Serial numbers are saved with the draw for reference (does not affect winner selection)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              className="bg-brand-card border border-brand-gold text-brand-text font-medium px-5 py-2.5 rounded-xl hover:border-brand-gold/50 transition-all text-sm"
            >
              Preview
            </button>
            <button
              onClick={handleLoad}
              disabled={loading}
              className="bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark font-bold px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all disabled:opacity-50 text-sm"
            >
              {loading ? "Loading..." : "Load Numbers & Generate Hash"}
            </button>
          </div>

          {preview.length > 0 && (
            <div className="border border-brand-border bg-brand-card rounded-xl p-4 space-y-4">
              <p className="text-sm text-brand-gold font-medium">
                {preview.length} numbers parsed
              </p>

              {/* Color distribution */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(colorCounts).map(([color, count]) => (
                  <span
                    key={color}
                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-card border border-brand-gold text-brand-muted capitalize"
                  >
                    {color}: {count}
                  </span>
                ))}
              </div>

              {/* Number preview */}
              <div className="grid grid-cols-10 gap-1 max-h-24 overflow-y-auto">
                {preview.slice(0, 50).map((entry, i) => (
                  <span
                    key={i}
                    className="text-xs px-1.5 py-1 text-center font-mono rounded bg-brand-card border border-brand-gold text-brand-muted"
                  >
                    {entry.number}
                  </span>
                ))}
                {preview.length > 50 && (
                  <span className="text-xs text-brand-muted col-span-10 py-1">
                    ... and {preview.length - 50} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Debug
function DebugSection({ draw }: { draw: any }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-card rounded-2xl p-5">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-brand-muted hover:text-brand-gold transition-colors font-medium"
      >
        {open ? "Hide Debug State" : "Show Debug State"}
      </button>
      {open && (
        <pre className="mt-4 p-4 rounded-xl bg-brand-card border border-brand-border text-xs text-brand-muted overflow-x-auto max-h-64 overflow-y-auto">
          {JSON.stringify(draw, null, 2)}
        </pre>
      )}
    </div>
  );
}

// Draw History Section
function DrawHistorySection() {
  const draws = useDrawHistory();
  const deleteDraw = useMutation(api.drawMutations.deleteDrawFromHistory);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (drawId: string) => {
    if (confirmDelete !== drawId) {
      setConfirmDelete(drawId);
      return;
    }
    await deleteDraw({ drawId: drawId as any });
    setConfirmDelete(null);
  };

  if (!draws || draws.length === 0) {
    return (
      <div className="glass-card rounded-2xl mt-8 overflow-hidden">
        <div className="bg-brand-card px-5 py-3 border-b border-brand-border">
          <h3 className="text-brand-text font-bold">Draw History</h3>
        </div>
        <div className="p-5 text-brand-muted text-sm">No past draws.</div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl mt-8 overflow-hidden">
      <div className="bg-brand-card px-5 py-3 border-b border-brand-border">
        <h3 className="text-brand-text font-bold">Draw History - {draws.length} Draws</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-card">
            <tr>
              <th className="text-left px-5 py-3 text-brand-muted font-medium">Date</th>
              <th className="text-left px-5 py-3 text-brand-muted font-medium">Title</th>
              <th className="text-left px-5 py-3 text-brand-muted font-medium">Entries</th>
              <th className="text-left px-5 py-3 text-brand-muted font-medium">Winners</th>
              <th className="text-left px-5 py-3 text-brand-muted font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {draws.map((draw) => (
              <tr key={draw._id} className="hover:bg-brand-card/50 transition-colors">
                <td className="px-5 py-3 text-brand-text">{new Date(draw.completedAt).toLocaleDateString("en-GB", { timeZone: "Europe/London" })}</td>
                <td className="px-5 py-3 text-brand-text truncate max-w-[200px]">{draw.title}</td>
                <td className="px-5 py-3 text-brand-muted">{draw.participatingNumbers.length}</td>
                <td className="px-5 py-3 text-brand-muted">{draw.winners.length}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => handleDelete(draw._id)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                      confirmDelete === draw._id
                        ? "bg-red-600 text-white"
                        : "bg-brand-card border border-brand-border text-brand-muted hover:text-red-400 hover:border-red-400/50"
                    }`}
                  >
                    {confirmDelete === draw._id ? "Confirm" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
