# Data Propagation Simulator

This is a simple interactive visualization tool that demonstrates two data distribution algorithms across a network of servers. Compare naive and smart distribution strategies in real-time with adjustable parameters.

## Features

- Visual representation of data chunk distribution across multiple servers
- Two distribution algorithms:
  - Naive Transfer: Sequential distribution from a single source
  - Smart Transfer: Parallel distribution with optimal target selection
- Adjustable simulation parameters:
  - Number of servers (2-100)
  - Simulation speed (0.5x - 2x)
- Real-time statistics:
  - Propagation cycles
  - Completion time
  - Transfer visualization
- How the algorithms work:
  - **Naive Transfer**:
    - Only Server 0 transmits chunks in a sequential pattern:
      1. Sends chunk 1 to Server 1, then Server 2, etc.
      2. After reaching last server, moves to chunk 2
      3. Repeats until all chunks distributed
    - Very inefficient O(n*c) distribution where:
      - n = number of servers
      - c = number of chunks
      - Example: 50 servers, 16 chunks = 784 cycles
    - Linear scaling means doubling servers doubles completion time
    - No parallel transfers even when chunks are available
  - **Smart Transfer**:
    - Any server with data can transmit to others
    - Multiple servers can transmit simultaneously
    - For each server that has chunks:
      1. Find all potential target servers that need chunks
      2. Calculate how many chunks each target already has
      3. Select the target with the fewest chunks as optimal recipient
      4. Transfer one needed chunk to the selected target
    - This creates an exponential distribution pattern where:
      - Initially only Server 0 transmits
      - As more servers get chunks, they join in transmitting
      - Prioritizes sending to servers with least data
      - Results in much faster distribution than naive approach
    - Much more efficient than naive:
      - Each server that gets chunks can immediately help distribute
      - Distribution speed doubles with each cycle
      - Takes only ~6 cycles to reach 50 servers (2⁵ = 32, 2⁶ = 64)
      - Example: 50 servers, 16 chunks ≈ 40 cycles total
    - Simple mathematical pattern:
      - After 1 cycle: 2 servers have chunks
      - After 2 cycles: up to 4 servers have chunks
      - After 3 cycles: up to 8 servers have chunks
      - And so on... (powers of 2)


## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm, yarn, or pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/binary-distribution-simulator.git
cd binary-distribution-simulator
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the simulation.

## Usage

1. Adjust the number of servers using the input field (2-100 servers)
2. Select your preferred distribution algorithm:
   - "Naive Transfer" for sequential distribution
   - "Smart Transfer" for parallel optimization
3. Use the speed slider to adjust simulation speed (0.5x - 2x)
4. Click the Play button to start the simulation
5. Use Reset to restart with current settings

## Technical Details

Built with:
- [Next.js 15](https://nextjs.org/)
- [React 18](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Lucide React](https://lucide.dev/) for icons

## Development

```bash
npm run dev
```
