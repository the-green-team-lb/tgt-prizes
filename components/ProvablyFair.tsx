"use client";

import { useState } from "react";
import {
  computeHash,
  serializeNumbers,
  type NumberEntry,
} from "@/lib/provably-fair";

interface ProvablyFairProps {
  publicHash: string;
  serverSeed: string;
  numbers: NumberEntry[];
  isCompleted: boolean;
}

export default function ProvablyFair({
  publicHash,
  serverSeed,
  numbers,
  isCompleted,
}: ProvablyFairProps) {
  const [verificationResult, setVerificationResult] = useState<
    "idle" | "verifying" | "match" | "mismatch"
  >("idle");
  const [computedHash, setComputedHash] = useState("");
  const [showDIY, setShowDIY] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  const copyToClipboard = async (text: string, field: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: create a textarea and use execCommand
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(""), 2000);
    } catch {
      // Last resort: prompt the user
      prompt("Copy this text:", text);
    }
  };

  const handleVerify = async () => {
    setVerificationResult("verifying");
    try {
      const hash = await computeHash(serverSeed, numbers);
      setComputedHash(hash);
      setVerificationResult(hash === publicHash ? "match" : "mismatch");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setComputedHash("ERROR: " + msg);
      setVerificationResult("mismatch");
    }
  };

  // Build the exact input string used for hashing
  const hashInput = serverSeed + ":" + serializeNumbers(numbers);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm sm:text-base font-bold">
          #
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-brand-text">
            Provably Fair Verification
          </h3>
          <p className="text-xs text-brand-muted">
            Cryptographic proof - verify it yourself
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl bg-brand-card p-4 mb-4 border border-brand-border">
        <p className="text-xs font-semibold text-blue-400 mb-2">
          How this works:
        </p>
        <ol className="text-xs text-brand-muted space-y-1.5 list-decimal list-inside">
          <li>
            Before the draw, a{" "}
            <span className="text-brand-gold">secret seed</span> is generated
          </li>
          <li>
            A <span className="text-brand-gold">SHA-256 hash</span> of (seed + all
            numbers) is published{" "}
            <span className="text-brand-gold">BEFORE</span> the draw
          </li>
          <li>
            After the draw, the{" "}
            <span className="text-brand-gold">secret seed is revealed</span>
          </li>
          <li>
            Anyone can recompute the hash to{" "}
            <span className="text-brand-gold">verify it matches</span>
          </li>
        </ol>
        <p className="text-xs text-brand-muted mt-3 pt-3 border-t border-brand-border">
          If the hash matches, the numbers were locked before the draw. The
          admin <span className="text-brand-gold">cannot fake this</span> - changing
          any number produces a completely different hash.
        </p>
      </div>

      {/* Public Hash */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-brand-muted font-medium">
            Public Hash (published BEFORE draw)
          </label>
          {numbers.length > 0 && (
            <span className="text-xs text-brand-gold">
              {numbers.length} numbers locked
            </span>
          )}
        </div>
        <div className="bg-brand-card rounded-xl p-3 border border-brand-border">
          <p className="hash-text text-sm text-brand-gold/80 break-all">
            {publicHash || "Hash will appear when numbers are loaded"}
          </p>
        </div>
      </div>

      {/* After completion: seed + verify */}
      {isCompleted ? (
        <>
          <div className="mb-4">
            <label className="text-xs text-brand-muted font-medium block mb-2">
              Server Seed (revealed AFTER draw)
            </label>
            <div className="bg-brand-card rounded-xl p-3 border border-brand-gold/20">
              <p className="hash-text text-sm text-brand-gold/80 break-all">
                {serverSeed}
              </p>
            </div>
          </div>

          {/* One-click verify */}
          <button
            onClick={handleVerify}
            disabled={verificationResult === "verifying"}
            className="w-full bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark font-bold py-3 rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all mb-4"
          >
            {verificationResult === "verifying"
              ? "Computing hash..."
              : verificationResult === "match"
                ? "Verified - Click to re-verify"
                : "Click to Verify This Draw"}
          </button>

          {/* Result */}
          {verificationResult === "match" && (
            <div className="rounded-xl border-2 border-green-500/40 bg-green-500/10 p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-lg">
                  &#10003;
                </div>
                <span className="text-green-400 font-bold text-lg">
                  VERIFIED FAIR
                </span>
              </div>
              <p className="text-sm text-green-400/80 mb-3">
                The computed hash matches the one published before the draw.
                This is cryptographic proof the draw was not tampered with.
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-green-400/50">Published: </span>
                  <span className="text-green-400/80 hash-text break-all">
                    {publicHash}
                  </span>
                </div>
                <div>
                  <span className="text-green-400/50">Computed: </span>
                  <span className="text-green-400/80 hash-text break-all">
                    {computedHash}
                  </span>
                </div>
              </div>
            </div>
          )}

          {verificationResult === "mismatch" && (
            <div className="rounded-xl border-2 border-red-500/40 bg-red-500/10 p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-lg">
                  &#10007;
                </div>
                <span className="text-red-400 font-bold text-lg">
                  VERIFICATION FAILED
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-red-400/50">Published: </span>
                  <span className="text-red-400/80 hash-text break-all">
                    {publicHash}
                  </span>
                </div>
                <div>
                  <span className="text-red-400/50">Computed: </span>
                  <span className="text-red-400/80 hash-text break-all">
                    {computedHash}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* VERIFY IT YOURSELF */}
          <div className="rounded-xl border border-brand-border bg-brand-card p-4">
            <button
              onClick={() => setShowDIY(!showDIY)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <p className="text-sm font-semibold text-blue-400">
                  Verify It Yourself (Independent Proof)
                </p>
                <p className="text-xs text-brand-muted mt-0.5">
                  Don&apos;t trust our button? Verify using any SHA-256 tool
                </p>
              </div>
              <span className="text-brand-gold text-lg shrink-0 ml-2">
                {showDIY ? "\u25B2" : "\u25BC"}
              </span>
            </button>

            {showDIY && (
              <div className="mt-4 space-y-4">
                {/* Step 1: The formula */}
                <div>
                  <p className="text-xs text-brand-gold font-semibold mb-2">
                    Step 1: The formula
                  </p>
                  <div className="bg-brand-card rounded-lg p-3 border border-brand-gold">
                    <p className="text-xs text-brand-text font-mono">
                      SHA-256( seed + &quot;:&quot; + sorted_numbers )
                    </p>
                    <p className="text-xs text-brand-muted mt-1">
                      Numbers sorted by value, formatted as
                      &quot;number-color&quot;, joined with &quot;|&quot;
                    </p>
                  </div>
                </div>

                {/* Step 2: The exact input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-brand-gold font-semibold">
                      Step 2: Copy this exact input
                    </p>
                    <button
                      onClick={() => copyToClipboard(hashInput, "input")}
                      className="text-xs text-brand-gold hover:text-brand-gold/80 transition-colors font-medium px-2 py-1 rounded-lg bg-brand-gold/10 border border-brand-gold/20"
                    >
                      {copiedField === "input" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="bg-brand-card rounded-lg p-3 border border-brand-gold max-h-32 overflow-y-auto">
                    <p className="text-xs text-brand-muted font-mono break-all whitespace-pre-wrap">
                      {hashInput.length > 500
                        ? hashInput.slice(0, 500) + "... (click Copy for full text)"
                        : hashInput}
                    </p>
                  </div>
                  <p className="text-xs text-brand-muted mt-1">
                    {hashInput.length.toLocaleString()} characters total
                  </p>
                </div>

                {/* Step 3: Verify anywhere */}
                <div>
                  <p className="text-xs text-brand-gold font-semibold mb-2">
                    Step 3: Paste into ANY SHA-256 tool
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs text-brand-muted">
                      Use any of these independent tools to compute SHA-256:
                    </p>
                    <a
                      href="https://emn178.github.io/online-tools/sha256.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-card border border-brand-gold hover:border-brand-gold/50 transition-colors group"
                    >
                      <span className="text-brand-gold text-base">&#x1F517;</span>
                      <div>
                        <p className="text-sm text-brand-gold font-semibold group-hover:text-brand-gold/80">
                          Open SHA-256 Online Calculator
                        </p>
                        <p className="text-xs text-brand-muted">
                          Paste the copied text from Step 2 and hit Hash - compare the result
                        </p>
                      </div>
                    </a>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-3 py-1.5 rounded-lg bg-brand-card text-brand-muted border border-brand-gold">
                        Terminal: echo -n &quot;INPUT&quot; | sha256sum
                      </span>
                      <span className="text-xs px-3 py-1.5 rounded-lg bg-brand-card text-brand-muted border border-brand-gold">
                        Python: hashlib.sha256(b&quot;INPUT&quot;).hexdigest()
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted">
                      Or search &quot;SHA-256 online calculator&quot; - any tool
                      will produce the same result.
                    </p>
                  </div>
                </div>

                {/* Step 4: Compare */}
                <div>
                  <p className="text-xs text-brand-gold font-semibold mb-2">
                    Step 4: Compare the result
                  </p>
                  <p className="text-xs text-brand-muted mb-2">
                    The SHA-256 output should exactly match this published hash:
                  </p>
                  <div className="bg-brand-card rounded-lg p-3 border border-brand-gold flex items-center justify-between gap-2">
                    <p className="text-xs text-brand-gold/80 font-mono break-all">
                      {publicHash}
                    </p>
                    <button
                      onClick={() => copyToClipboard(publicHash, "hash")}
                      className="text-xs text-brand-gold hover:text-brand-gold/80 shrink-0 font-medium px-2 py-1 rounded-lg bg-brand-gold/10 border border-brand-gold/20"
                    >
                      {copiedField === "hash" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-brand-gold/5 border border-brand-gold/20 p-3">
                  <p className="text-xs text-brand-gold/80">
                    If they match, the numbers were locked before the draw. No
                    one - not even the site admin - can change the numbers after
                    publishing the hash without it being detectable. This is the
                    same cryptography that secures Bitcoin and HTTPS.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl bg-brand-card border border-brand-border p-4 text-center">
          <p className="text-brand-gold text-sm font-medium">
            Draw in progress
          </p>
          <p className="text-brand-muted text-xs mt-1">
            The secret seed will be revealed when the draw completes, so you can
            verify the hash matches.
          </p>
        </div>
      )}
    </div>
  );
}
