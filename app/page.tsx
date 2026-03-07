"use client";

import { useState, useEffect } from "react";
import { useActiveDraw, useDrawHistory } from "@/lib/use-local-store";
import Link from "next/link";

function useCountdown(targetMs: number | undefined) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!targetMs) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  if (!targetMs) return null;
  const diff = targetMs - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, passed: false };
}

function CurrentDrawCard() {
  const draw = useActiveDraw();
  const countdown = useCountdown(draw?.scheduledAt);
  const isLive = draw?.drawStatus === "spinning" || draw?.drawStatus === "revealing";

  if (!draw) {
    return (
      <div className="glass-card rounded-2xl max-w-2xl mx-auto mb-8">
        <div className="p-8 text-center">
          <p className="text-brand-muted text-lg mb-2">No Active Draw</p>
          <p className="text-brand-muted text-sm">Check back soon or browse past draws.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl max-w-2xl mx-auto mb-8 overflow-hidden">
      <div className={`px-6 py-3 text-sm font-semibold ${
        isLive
          ? "bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark"
          : draw.drawStatus === "completed"
            ? "bg-brand-green text-white"
            : "bg-brand-green/50 text-white"
      }`}>
        {isLive ? "LIVE NOW" : draw.drawStatus === "completed" ? "COMPLETED" : "UPCOMING DRAW"}
      </div>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-brand-text mb-4">{draw.title}</h2>

        {draw.scheduledAt && !isLive && countdown && !countdown.passed && (
          <div className="mb-6">
            <p className="text-brand-muted text-sm mb-3">
              {new Date(draw.scheduledAt).toLocaleDateString("en-GB", {
                timeZone: "Europe/London",
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })} at {new Date(draw.scheduledAt).toLocaleTimeString("en-GB", {
                timeZone: "Europe/London",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })} UK
            </p>
            <div className="flex gap-3 text-lg font-mono">
              {countdown.days > 0 && (
                <span className="bg-brand-card px-3 py-2 rounded-lg">
                  <span className="text-brand-gold">{countdown.days}</span>
                  <span className="text-brand-muted text-xs ml-1">D</span>
                </span>
              )}
              <span className="bg-brand-card px-3 py-2 rounded-lg">
                <span className="text-brand-gold">{String(countdown.hours).padStart(2, "0")}</span>
                <span className="text-brand-muted text-xs ml-1">H</span>
              </span>
              <span className="bg-brand-card px-3 py-2 rounded-lg">
                <span className="text-brand-gold">{String(countdown.minutes).padStart(2, "0")}</span>
                <span className="text-brand-muted text-xs ml-1">M</span>
              </span>
              <span className="bg-brand-card px-3 py-2 rounded-lg">
                <span className="text-brand-gold">{String(countdown.seconds).padStart(2, "0")}</span>
                <span className="text-brand-muted text-xs ml-1">S</span>
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-6 text-sm text-brand-muted mb-6">
          <span className="flex items-center gap-2">
            <span className="text-brand-gold font-semibold">{draw.participatingNumbers.length}</span> Entries
          </span>
          <span className="flex items-center gap-2">
            <span className="text-brand-gold font-semibold">{draw.winnersCount}</span> Winners
          </span>
        </div>

        {(draw as any).ticketImageUrl && (
          <div className="mb-6 border border-brand-border rounded-xl p-3 inline-block">
            <img src={(draw as any).ticketImageUrl} alt="Raffle Ticket" className="max-w-full max-h-48 rounded-lg bg-white" />
          </div>
        )}

        {draw.publicHash && (
          <div className="mb-6 p-4 bg-brand-card rounded-xl">
            <p className="text-brand-muted text-xs mb-2">Fairness Hash (SHA-256):</p>
            <p className="hash-text text-brand-gold/80 text-sm break-all">{draw.publicHash}</p>
          </div>
        )}

        <Link
          href="/live"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-gold to-amber-500 text-brand-dark font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-brand-gold/20 transition-all"
        >
          Go to Live Draw
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function RecentDraws() {
  const draws = useDrawHistory();
  if (!draws || draws.length === 0) return null;
  const recent = draws.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 mb-12">
      <h2 className="text-xl font-bold text-brand-text mb-6">Recent Draws</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recent.map((draw) => (
          <Link
            key={draw._id}
            href={`/draws/${draw._id}`}
            className="glass-card rounded-2xl p-5 card-hover block"
          >
            <p className="font-bold text-brand-gold truncate mb-2">{draw.title}</p>
            <p className="text-brand-muted text-sm">
              {draw.participatingNumbers.length} entries | {draw.winners.length} winners
            </p>
            <p className="text-brand-muted text-xs mt-3">
              {new Date(draw.completedAt).toLocaleDateString("en-GB", { timeZone: "Europe/London" })}
            </p>
          </Link>
        ))}
      </div>
      <Link
        href="/draws"
        className="inline-flex items-center gap-2 text-brand-muted text-sm hover:text-brand-gold mt-6 transition-colors"
      >
        View All Draws
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="text-center py-16 px-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
          <span className="text-gradient-gold">The Green Team Prizes</span>
        </h1>
        <p className="text-xl text-brand-muted max-w-2xl mx-auto">
          Provably fair prize draws. Every winner is determined by cryptographic verification.
        </p>
      </div>

      {/* How It Works - Full White Paper */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <div className="glass-card rounded-2xl overflow-hidden border-brand-gold/30">
          <div className="bg-gradient-to-r from-brand-gold to-amber-500 px-6 py-4">
            <h2 className="text-brand-dark font-bold text-lg">How It Works - The Complete Guide</h2>
          </div>
          <div className="p-6 space-y-8">

            {/* Section 1: How It Works */}
            <div>
              <h3 className="text-brand-gold font-bold text-lg mb-4">Part 1: How To Enter & Win</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div>
                    <p className="text-brand-text font-semibold">Order on LittleBiggy</p>
                    <p className="text-brand-muted text-sm">All orders placed with us on <a href="https://littlebiggy.net/viewSubject/p/4775239" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">LittleBiggy</a> receive a raffle ticket from the 1st until the last day of the month!</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div>
                    <p className="text-brand-text font-semibold">Competitions & Giveaways Too!</p>
                    <p className="text-brand-muted text-sm">All competitions and giveaways are run with numbers and drawn here on this provably fair site!</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div>
                    <p className="text-brand-text font-semibold">Watch the Live Draw</p>
                    <p className="text-brand-muted text-sm">Go to the <span className="text-brand-gold">Live</span> page when the draw starts. Watch the spinning wheel and see winners revealed!</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-sm shrink-0">4</div>
                  <div>
                    <p className="text-brand-text font-semibold">Winners Are Announced</p>
                    <p className="text-brand-muted text-sm">Winning numbers are revealed one by one. If your number wins, <a href="https://littlebiggy.net/viewSubject/p/4775239" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">message us on LittleBiggy</a> with an image of your winning ticket or number to claim your prize!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-brand-border pt-8"></div>

            {/* Section 2: How the Spin Works */}
            <div>
              <h3 className="text-brand-gold font-bold text-lg mb-4">Part 2: How the Draw Spin Works</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-sm shrink-0">1</div>
                  <div>
                    <p className="text-brand-text font-semibold">All Numbers Load Into Wheel</p>
                    <p className="text-brand-muted text-sm">Every giveaway ticket number or competition number is loaded into the system with its color.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-sm shrink-0">2</div>
                  <div>
                    <p className="text-brand-text font-semibold">The Wheel Spins</p>
                    <p className="text-brand-muted text-sm">The draw starts and the prize wheel spins. You&apos;ll see the spinning animation on screen.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-sm shrink-0">3</div>
                  <div>
                    <p className="text-brand-text font-semibold">Random Winner Selected</p>
                    <p className="text-brand-muted text-sm">Winners are determined by a <span className="text-brand-gold">cryptographic seed</span> that was committed to BEFORE the draw. The seed + ticket numbers mathematically produce the winner. <strong className="text-brand-text">No one can change or predict this</strong> - not even the admin.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-sm shrink-0">4</div>
                  <div>
                    <p className="text-brand-text font-semibold">Repeat for Each Prize</p>
                    <p className="text-brand-muted text-sm">If there are 10 prizes, this process produces 10 winners. Each ticket can only win once.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-brand-card rounded-xl border border-brand-border">
                <p className="text-brand-gold font-semibold text-sm mb-2">How The Code Works:</p>
                <p className="text-brand-muted text-sm mb-2">
                  The wheel code is <a href="https://github.com/the-green-team-lb/tgt-prizes" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">open source</a> on our GitHub repository. Anyone can inspect the code that selects winners. The selection uses:
                </p>
                <ul className="text-brand-muted text-sm space-y-1 list-disc list-inside mb-2">
                  <li><strong>SHA-256 cryptographic hash</strong> - proves numbers weren&apos;t changed</li>
                  <li><strong>Secret seed</strong> - generated before draw, revealed after</li>
                  <li><strong>Mathematical algorithm</strong> - deterministically picks winners from seed + numbers</li>
                </ul>
                <p className="text-brand-muted text-sm">
                  <strong className="text-brand-text">Why it&apos;s fair:</strong> The admin cannot pick favorites or change the outcome. The math is locked in BEFORE any tickets are loaded.
                </p>
              </div>
            </div>

            <div className="border-t border-brand-border pt-8"></div>

            {/* Section 3: What is a Cryptographic Hash (Simple Explanation) */}
            <div>
              <h3 className="text-brand-gold font-bold text-lg mb-4">Part 3: What is a Cryptographic Hash? (Simple Explanation)</h3>

              <div className="p-4 bg-brand-card rounded-xl border border-brand-border mb-4">
                <p className="text-brand-text text-sm mb-3">
                  Think of a hash like a <strong className="text-brand-gold">digital fingerprint</strong>. Here&apos;s a simple example:
                </p>
                <div className="bg-brand-gold/10 rounded-lg p-4 mb-3">
                  <p className="text-brand-muted text-sm mb-2"><strong>Original text:</strong></p>
                  <p className="text-brand-gold font-mono text-sm">&quot;Hello World&quot;</p>
                  <p className="text-brand-muted text-sm mb-2 mt-3"><strong>SHA-256 Hash (fingerprint):</strong></p>
                  <p className="text-brand-gold font-mono text-sm">a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e</p>
                </div>
                <p className="text-brand-muted text-sm">
                  Now change <strong>just ONE letter</strong> - watch what happens:
                </p>
                <div className="bg-brand-gold/10 rounded-lg p-4 mt-2">
                  <p className="text-brand-muted text-sm mb-2"><strong>Original text:</strong></p>
                  <p className="text-brand-gold font-mono text-sm">&quot;Hello World&quot; → <span className="text-red-400">&quot;Hello World!&quot;</span> (added !)</p>
                  <p className="text-brand-muted text-sm mb-2 mt-3"><strong>SHA-256 Hash (fingerprint):</strong></p>
                  <p className="text-red-400 font-mono text-sm">7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</p>
                </div>
                <p className="text-brand-text text-sm mt-3">
                  <strong className="text-brand-gold">See? Completely different!</strong> Even adding one tiny character makes the hash unrecognizable.
                </p>
              </div>

              <p className="text-brand-muted text-sm mb-4">
                <strong className="text-brand-text">In our draws:</strong> We create a hash of (secret seed + ALL ticket numbers) and publish it BEFORE the draw. If the admin changed ANY ticket number, the hash would be totally different - and everyone would know.
              </p>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="text-blue-400 font-semibold text-sm mb-2">Why SHA-256?</p>
                <p className="text-brand-muted text-sm">
                  SHA-256 is the same technology that secures Bitcoin, HTTPS websites, and passwords. It&apos;s mathematically impossible to fake - if the hashes match, the data is 100% identical.
                </p>
              </div>
            </div>

            <div className="border-t border-brand-border pt-8"></div>

            {/* Section 4: Example from Past Draw */}
            <div>
              <h3 className="text-brand-gold font-bold text-lg mb-4">Part 4: Example from Past Draw</h3>

              <div className="space-y-4">
                <div className="p-4 bg-brand-card rounded-xl border border-brand-border">
                  <p className="text-brand-text text-sm mb-2"><strong className="text-brand-gold">Example: Little Biggy Proof Borg Draw (Saturday, 7 March 2026 at 17:40 UK)</strong></p>
                  <p className="text-brand-muted text-sm mb-3">
                    This draw had 800 entries and 10 prizes. Here&apos;s what happened:
                  </p>
                  <ul className="text-brand-muted text-sm space-y-2 list-disc list-inside">
                    <li><strong className="text-brand-text">Before draw:</strong> Admin loaded all 800 ticket numbers into the system</li>
                    <li><strong className="text-brand-text">Before draw:</strong> A SHA-256 hash was calculated and <span className="text-brand-gold">published on the site</span> for everyone to see</li>
                    <li><strong className="text-brand-text">Draw started:</strong> Live stream began, wheel started spinning</li>
                    <li><strong className="text-brand-text">Winners revealed:</strong> 10 random winners picked from the 800 tickets</li>
                    <li><strong className="text-brand-text">After draw:</strong> Secret seed was revealed</li>
                    <li><strong className="text-brand-text">Verification:</strong> Anyone could recompute the hash to confirm it matched the published hash</li>
                  </ul>
                </div>

                <div className="p-4 bg-brand-gold/10 border border-brand-gold/20 rounded-xl">
                  <p className="text-brand-gold font-semibold text-sm mb-2">What This Means for You</p>
                  <p className="text-brand-muted text-sm">
                    Because the hash was published BEFORE the draw, no one could have manipulated the ticket numbers. The winning numbers were truly random from all 800 entries.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-brand-border pt-8"></div>

            {/* Section 5: Site Auditability */}
            <div>
              <h3 className="text-brand-gold font-bold text-lg mb-4">Part 5: Site Auditability</h3>

              <div className="p-4 bg-brand-card rounded-xl border border-brand-border mb-4">
                <p className="text-brand-text text-sm mb-3">
                  This site is <strong className="text-brand-gold">fully transparent</strong>. Every draw, every hash, and all code can be independently verified.
                </p>
                <ul className="text-brand-muted text-sm space-y-2 list-disc list-inside">
                  <li><strong className="text-brand-text">No hidden contact info:</strong> This site has no contact forms, emails, or external links. All communication happens via <a href="https://littlebiggy.net/viewSubject/p/4775239" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">LittleBiggy</a> only.</li>
                  <li><strong className="text-brand-text">Draw data is public:</strong> Every completed draw shows the exact seed, numbers, and hash that can be verified on any SHA-256 tool.</li>
                  <li><strong className="text-brand-text">No editing after publish:</strong> Once a hash is published for a draw, any change to the numbers would produce a completely different hash - immediately detectable.</li>
                </ul>
              </div>

              <div className="p-4 bg-brand-card rounded-xl border border-brand-border mb-4">
                <p className="text-brand-gold font-semibold text-sm mb-3">Code Verification - GitHub & Bitcoin</p>
                <p className="text-brand-muted text-sm mb-3">
                  This entire site&apos;s source code is stored on our public <a href="https://github.com/the-green-team-lb/tgt-prizes" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">GitHub repository</a> and hashed on the Bitcoin blockchain. This is important because:
                </p>
                <ul className="text-brand-muted text-sm space-y-2 list-disc list-inside">
                  <li><strong className="text-brand-text">Every single code change is permanently recorded</strong> - anyone can view the full history of every change ever made to this site on <a href="https://github.com/the-green-team-lb/tgt-prizes" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">GitHub</a></li>
                  <li><strong className="text-brand-text">Nothing can be added or removed without it being visible</strong> - if contact info, hidden links, or any code was ever added then later removed, it would still be visible in the commit history forever</li>
                  <li><strong className="text-brand-text">Bitcoin timestamp proves when the code existed</strong> - the hash cannot be faked or backdated, proving exactly what the site contained at any point in time</li>
                  <li><strong className="text-brand-text"><a href="https://littlebiggy.net/viewSubject/p/4775239" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">LittleBiggy</a> or anyone can verify</strong> - the site has NEVER contained external contact methods, emails, phone numbers, or any way to communicate outside of LittleBiggy</li>
                </ul>
                <p className="text-brand-muted text-sm mt-3">
                  View the full code and change history: <a href="https://github.com/the-green-team-lb/tgt-prizes" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline font-mono">github.com/the-green-team-lb/tgt-prizes</a>
                </p>
              </div>

              <div className="p-4 bg-brand-gold/10 border border-brand-gold/20 rounded-xl">
                <p className="text-brand-gold font-semibold text-sm mb-2">How to Audit a Draw</p>
                <ol className="text-brand-muted text-sm space-y-2 list-decimal list-inside">
                  <li>Go to any <span className="text-brand-gold">Past Draw</span> page</li>
                  <li>Copy the seed and numbers provided</li>
                  <li>Use the built-in verify button OR any external SHA-256 calculator</li>
                  <li>Compare the computed hash to the published hash</li>
                  <li>If they match, the draw was 100% fair</li>
                </ol>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Transaction Info */}
      <div className="max-w-4xl mx-auto px-4 mb-12">
        <div className="glass-card rounded-2xl p-6 text-center border-brand-border">
          <p className="text-brand-muted text-sm">
            This site has no contact information. All transactions are conducted via <a href="https://littlebiggy.net/viewSubject/p/4775239" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">LittleBiggy</a> only. Code is publicly verifiable on <a href="https://github.com/the-green-team-lb/tgt-prizes" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">GitHub</a> and timestamped on Bitcoin blockchain.
          </p>
        </div>
      </div>

      <CurrentDrawCard />
      <RecentDraws />
    </div>
  );
}
