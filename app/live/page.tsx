"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useActiveDraw } from "@/lib/use-local-store";
import LiveDrawViewer from "@/components/LiveDrawViewer";

export default function LivePage() {
  const draw = useActiveDraw();
  const incrementView = useMutation(api.drawMutations.incrementViewCount);
  const counted = useRef(false);

  useEffect(() => {
    if (draw && !counted.current) {
      counted.current = true;
      incrementView();
    }
  }, [draw, incrementView]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <h1 className="text-2xl font-bold text-brand-text">Live Draw</h1>
        </div>
        {draw && (draw as any).viewCount > 0 && (
          <span className="text-brand-muted text-sm">
            <span className="text-brand-gold font-semibold">{(draw as any).viewCount}</span> views
          </span>
        )}
      </div>

      {!draw ? (
        <div className="glass-card rounded-2xl">
          <div className="p-12 text-center">
            <p className="text-brand-muted text-lg mb-2">No active draw at the moment.</p>
            <p className="text-brand-muted text-sm">Check back soon!</p>
          </div>
        </div>
      ) : (
        <LiveDrawViewer draw={draw} />
      )}
    </div>
  );
}
