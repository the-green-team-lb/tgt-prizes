# The Green Team Prizes

Provably fair prize draws. Every winner is determined by cryptographic verification.

## How It Works

1. **Ticket entries are loaded** into the system with assigned colors
2. **A SHA-256 hash is published** before the draw starts - locking in the fairness proof
3. **The wheel spins live** and winners are revealed one by one
4. **After the draw**, the secret seed is revealed so anyone can verify the results

## Provably Fair

- Winners are determined by a **cryptographic seed** committed before the draw
- The seed + ticket numbers mathematically produce winners - no one can change or predict results
- Every completed draw shows the exact seed, numbers, and hash for independent verification
- Code is open source and timestamped on the Bitcoin blockchain

## Tech Stack

- **Next.js** - React framework
- **Convex** - Real-time backend database
- **Tailwind CSS** - Styling
- **SHA-256** - Cryptographic hash verification

## Links

- **Live Site:** [tgtprizes.com](https://www.tgtprizes.com)
- **LittleBiggy:** [The Green Team](https://littlebiggy.net/viewSubject/p/4775239)
