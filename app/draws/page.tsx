"use client";

import { useDrawHistory } from "@/lib/use-local-store";
import Link from "next/link";

export default function DrawsPage() {
  const draws = useDrawHistory();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-text mb-2">Past Draws</h1>
      <p className="text-brand-muted text-sm mb-8">
        Every draw is verifiable with cryptographic proof
      </p>

      {!draws || draws.length === 0 ? (
        <div className="glass-card rounded-2xl">
          <div className="p-12 text-center">
            <p className="text-brand-muted text-lg">No completed draws yet.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {draws.map((draw) => (
            <Link
              key={draw._id}
              href={`/draws/${draw._id}`}
              className="glass-card rounded-2xl p-5 card-hover block"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="font-bold text-brand-gold truncate flex-1">{draw.title}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-brand-muted mb-3">
                <span className="flex items-center gap-1">
                  <span className="text-brand-text font-medium">{draw.participatingNumbers.length}</span>
                  entries
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-brand-text font-medium">{draw.winners.length}</span>
                  winners
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-brand-muted text-xs">
                  {new Date(draw.completedAt).toLocaleDateString("en-GB", { timeZone: "Europe/London" })}
                </p>
                {(draw as any).viewCount > 0 && (
                  <span className="text-brand-muted text-xs">
                    <span className="text-brand-gold font-semibold">{(draw as any).viewCount}</span> views
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
