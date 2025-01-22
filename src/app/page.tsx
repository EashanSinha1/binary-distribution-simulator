"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

// Types
type DataChunk = {
  id: number;
  present: boolean;
};

type Server = {
  id: number;
  chunks: DataChunk[];
  isTransmitting: boolean;
  transmittingTo?: number;
};

type TransferAlgorithm = 'naive' | 'smart';

const NUM_CHUNKS = 16;
const BASE_SPEED = 1000; // 1 second at 1x speed
const MIN_SPEED = 0.5;
const MAX_SPEED = 2;
const DEFAULT_SERVER_COUNT = 50;

export default function Home() {
  const [servers, setServers] = useState<Server[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState<TransferAlgorithm>('naive');
  const [currentTick, setCurrentTick] = useState(0);
  const [serverCount, setServerCount] = useState(DEFAULT_SERVER_COUNT);
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Initialize servers
  const initializeServers = useCallback((count: number) => {
    const initialServers: Server[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      chunks: Array.from({ length: NUM_CHUNKS }, (_, j) => ({
        id: j,
        present: i === 0 // server 0 starts off with all the chunks
      })),
      isTransmitting: false
    }));
    setServers(initialServers);
    setCurrentTick(0);
  }, []);

  // useEffect(() => {
  //   console.log("servers", servers);
  // }, [servers]);

  // useEffect(() => {
  //   console.log("currentTick", currentTick);
  // }, [currentTick]);

  useEffect(() => {
    initializeServers(serverCount);
  }, [serverCount, initializeServers]);



  const resetSimulation = useCallback(() => {
    setIsRunning(false);
    initializeServers(serverCount);
  }, [serverCount, initializeServers]);



  const naiveTransfer = useCallback(() => {
    setServers(prevServers => {
      // console.log("naiveTransfer", prevServers);
      const newServers = [...prevServers]; // copy the servers array
      const sourceServer = newServers[0];
      const targetServerId = currentTick % (serverCount - 1) + 1;
      const chunkId = Math.floor(currentTick / (serverCount - 1));
      // console.log("naiveTransfer", newServers);

      // we can transfer
      if (chunkId < NUM_CHUNKS) {
        newServers[targetServerId].chunks[chunkId].present = true;
        newServers[0].isTransmitting = true;
        newServers[0].transmittingTo = targetServerId;
      }
      
      return newServers;
    });
  }, [currentTick, serverCount]);

  const smartTransfer = useCallback(() => {
    setServers(prevServers => {
      const newServers = [...prevServers];
      
      // find servers that can transmit
      const availableServers = newServers.filter(server => 
        server.chunks.some(chunk => chunk.present) && !server.isTransmitting
      );
      
      //

      // for each available server, try to find a target
      for (const sourceServer of availableServers) {
        let bestTargetServer = null;
        let leastChunks = NUM_CHUNKS;

        // find the best target server
        for (const targetServer of newServers) {
          // Skip if it's the same server
          if (targetServer.id === sourceServer.id) continue;
          
          
          // count chunks
          const targetChunkCount = targetServer.chunks.filter(chunk => chunk.present).length;
          
          
          const hasNeededChunks = sourceServer.chunks.some((chunk, idx) => 
            chunk.present && !targetServer.chunks[idx].present
          );

          if (hasNeededChunks && targetChunkCount < leastChunks && !targetServer.isTransmitting) {
            bestTargetServer = targetServer;
            leastChunks = targetChunkCount;
          }
        }

        // transfer chunk if we found target
        if (bestTargetServer) {
          const chunkToSend = sourceServer.chunks.findIndex((chunk, idx) => 
            chunk.present && !bestTargetServer.chunks[idx].present
          );
          // transfer chunk
          if (chunkToSend !== -1) {
            newServers[bestTargetServer.id].chunks[chunkToSend].present = true;
            newServers[sourceServer.id].isTransmitting = true;
            newServers[sourceServer.id].transmittingTo = bestTargetServer.id;
          }
        }
      }


      return newServers;
    });
  }, []);

  // check if all servers have all chunks
  const isSimulationComplete = useCallback((serverList: Server[]) => {
    return serverList.every(server => 
      server.chunks.every(chunk => chunk.present)
    );
  }, []);

  // timer for simulation - useEffect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        if (algorithm === 'naive') {
          naiveTransfer();
        } else {
          smartTransfer();
        }
        
        setCurrentTick(prev => prev + 1);
        
        // reset transmission status and check that it's complete
        setServers(prev => {
          const updatedServers = prev.map(server => ({
            ...server,
            isTransmitting: false,
            transmittingTo: undefined
          }));

          // stop the timer if sim is complete
          if (isSimulationComplete(updatedServers)) {
            setIsRunning(false);
            if (startTime) {
              setCompletionTime(Date.now() - startTime);
            }
          }

          return updatedServers;
        });
      }, BASE_SPEED / speedMultiplier);
    }


    return () => clearInterval(interval);
  }, [isRunning, algorithm, naiveTransfer, smartTransfer, isSimulationComplete, speedMultiplier]);

  const handleServerCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 2 && value <= 100) { // Ensure at least 2 servers and max 100
      setServerCount(value);
      setIsRunning(false); // Stop simulation when changing server count
    }
  };

  

  const handlePlayPause = () => {
    if (!isRunning) {
      setStartTime(Date.now());
      setCompletionTime(null);
    }
    setIsRunning(!isRunning);
  };

  const handleSpeedChange = (value: number[]) => {
    setSpeedMultiplier(value[0]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="space-x-2">
              <Button
                onClick={handlePlayPause}
                variant="default"
                size="icon"
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                onClick={resetSimulation}
                variant="outline"
                size="icon"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium whitespace-nowrap">
                  Speed: {speedMultiplier.toFixed(1)}x
                </label>
                <Slider
                  value={[speedMultiplier]}
                  onValueChange={handleSpeedChange}
                  min={MIN_SPEED}
                  max={MAX_SPEED}
                  step={0.1}
                  className="w-[120px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="serverCount" className="text-sm font-medium">
                  Servers:
                </label>
                <Input
                  id="serverCount"
                  type="number"
                  min="2"
                  max="100"
                  value={serverCount}
                  onChange={handleServerCountChange}
                  className="w-20"
                  disabled={isRunning}
                />
              </div>
              <div className="space-x-2">
                <Button
                  onClick={() => setAlgorithm('naive')}
                  variant={algorithm === 'naive' ? "default" : "secondary"}
                >
                  Naive Transfer
                </Button>
                <Button
                  onClick={() => setAlgorithm('smart')}
                  variant={algorithm === 'smart' ? "default" : "secondary"}
                >
                  Smart Transfer
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-muted-foreground font-mono">
                Prop Cycles: {currentTick}
              </div>
              {isSimulationComplete(servers) && (
                <div className="flex flex-col gap-1">
                  <div className="text-green-600 font-medium">
                    Simulation Complete! ✓
                  </div>
                  {completionTime && (
                    <div className="text-sm text-muted-foreground">
                      Time: {(completionTime / 1000).toFixed(1)}s
                      <br />
                      Prop Cycles: {currentTick}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {servers.map((server) => (
          <Card
            key={server.id}
            className={server.isTransmitting ? 'bg-yellow-50' : undefined}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Server {server.id}</span>
                {server.isTransmitting && (
                  <span className="text-xs text-yellow-600 font-mono">
                    → Server {server.transmittingTo}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="grid grid-cols-4 gap-1">
                {server.chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className={`h-6 rounded transition-colors ${
                      chunk.present ? 'bg-primary' : 'bg-muted'
                    }`}
                    title={`Chunk ${chunk.id}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
