from typing import List, Dict, Optional
from dataclasses import dataclass
from copy import deepcopy

# Constants
NUM_CHUNKS = 16
DEFAULT_SERVER_COUNT = 50

@dataclass
class Chunk:
    id: int
    present: bool

@dataclass
class Server:
    id: int
    chunks: List[Chunk]
    is_transmitting: bool = False
    transmitting_to: Optional[int] = None

class DataTransferSimulation:
    def __init__(self, num_servers: int = DEFAULT_SERVER_COUNT):
        self.num_servers = num_servers
        self.current_tick = 0
        # Initialize servers - Server 0 has all chunks, others have none
        self.servers = []
        for i in range(num_servers):
            chunks = [Chunk(j, i == 0) for j in range(NUM_CHUNKS)]
            self.servers.append(Server(i, chunks))

    def naive_transfer(self) -> None:
        """
        Naive algorithm where only Server 0 transmits chunks in a round-robin fashion.
        - Cycles through servers 1,2,3... for each chunk
        - Moves to next chunk after hitting all servers
        """
        # Calculate which server should receive data this tick
        target_server_id = (self.current_tick % (self.num_servers - 1)) + 1
        # Calculate which chunk should be sent
        chunk_id = self.current_tick // (self.num_servers - 1)
        
        # Only transfer if we haven't sent all chunks yet
        if chunk_id < NUM_CHUNKS:
            # Mark the chunk as present in target server
            self.servers[target_server_id].chunks[chunk_id].present = True
            # Mark server 0 as transmitting to target
            self.servers[0].is_transmitting = True
            self.servers[0].transmitting_to = target_server_id

    def smart_transfer(self) -> None:
        """
        Smart algorithm where any server with chunks can transmit.
        Multiple servers can transmit simultaneously.
        Prioritizes sending to servers with the least chunks.
        """
        # Step 1: Find all servers that have data and aren't currently transmitting
        available_servers = []
        for server in self.servers:
            has_chunks = False
            for chunk in server.chunks:
                if chunk.present:
                    has_chunks = True
                    break
            if has_chunks and not server.is_transmitting:
                available_servers.append(server)

        # Step 2: Each available server tries to find a target
        for source_server in available_servers:
            best_target = None
            least_chunks = NUM_CHUNKS

            # Step 3: Find the best target server (one with least chunks)
            for potential_target in self.servers:
                # Skip if it's the same server
                if potential_target.id == source_server.id:
                    continue

                # Count how many chunks target already has
                target_chunk_count = 0
                for chunk in potential_target.chunks:
                    if chunk.present:
                        target_chunk_count += 1
                
                # Check if source has any chunks that target needs
                has_needed_chunks = False
                for source_chunk, target_chunk in zip(source_server.chunks, potential_target.chunks):
                    if source_chunk.present and not target_chunk.present:
                        has_needed_chunks = True
                        break

                # Update best target if this one is better
                if (has_needed_chunks and target_chunk_count < least_chunks and not potential_target.is_transmitting):
                    best_target = potential_target
                    least_chunks = target_chunk_count

            # Step 4: If we found a target, transfer a chunk
            if best_target:
                # Find first chunk that target needs and source has
                chunk_to_send = None
                for i, (source_chunk, target_chunk) in enumerate(zip(source_server.chunks, best_target.chunks)):
                    if source_chunk.present and not target_chunk.present:
                        chunk_to_send = i
                        break

                if chunk_to_send is not None:
                    # Transfer the chunk
                    self.servers[best_target.id].chunks[chunk_to_send].present = True
                    # Mark source as transmitting
                    self.servers[source_server.id].is_transmitting = True
                    self.servers[source_server.id].transmitting_to = best_target.id

    def run_simulation(self, algorithm: str = 'smart') -> int:
        """
        Runs the simulation until all servers have all chunks.
        Returns the number of ticks it took to complete.
        """
        while not self.is_complete():
            if algorithm == 'naive':
                self.naive_transfer()
            else:
                self.smart_transfer()
            
            # Reset transmission status for next tick
            for server in self.servers:
                server.is_transmitting = False
                server.transmitting_to = None
            
            self.current_tick += 1
        
        return self.current_tick

    def is_complete(self) -> bool:
        """Check if all servers have all chunks"""
        return all(
            all(chunk.present for chunk in server.chunks)
            for server in self.servers
        )

# Example usage
if __name__ == "__main__":
    # Run both algorithms and compare
    for server_count in [5, 10, 20, 50]:
        print(f"\nTesting with {server_count} servers:")
        
        # Test naive algorithm
        sim_naive = DataTransferSimulation(server_count)
        naive_ticks = sim_naive.run_simulation('naive')
        print(f"Naive algorithm took {naive_ticks} ticks")
        
        # Test smart algorithm
        sim_smart = DataTransferSimulation(server_count)
        smart_ticks = sim_smart.run_simulation('smart')
        print(f"Smart algorithm took {smart_ticks} ticks") 