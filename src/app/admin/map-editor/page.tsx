'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface MapNode { id: number; lat: number; lng: number; label: string; }
interface MapEdge { id: number; from: number; to: number; distance: number; }
type Tool = 'select' | 'add-node' | 'connect' | 'delete';

const GEC_CENTER = { lat: 10.8505, lng: 76.3498 };

export default function AdminMapEditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<MapNode[]>([
    { id: 1, lat: 10.8500, lng: 76.3495, label: 'Main Gate' },
    { id: 2, lat: 10.8505, lng: 76.3498, label: 'Main Building' },
    { id: 3, lat: 10.8510, lng: 76.3505, label: 'EEE Block' },
    { id: 4, lat: 10.8508, lng: 76.3490, label: 'IT Block' },
    { id: 5, lat: 10.8512, lng: 76.3495, label: 'Library' },
    { id: 6, lat: 10.8502, lng: 76.3508, label: 'Canteen' },
  ]);
  const [edges, setEdges] = useState<MapEdge[]>([
    { id: 1, from: 1, to: 2, distance: 80 },
    { id: 2, from: 2, to: 3, distance: 120 },
    { id: 3, from: 2, to: 4, distance: 90 },
    { id: 4, from: 2, to: 5, distance: 60 },
    { id: 5, from: 3, to: 6, distance: 50 },
  ]);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [connectFrom, setConnectFrom] = useState<number | null>(null);
  const [nextId, setNextId] = useState(10);

  const W = 800, H = 500;

  const toX = (lng: number) => W / 2 + (lng - GEC_CENTER.lng) * 50000;
  const toY = (lat: number) => H / 2 - (lat - GEC_CENTER.lat) * 50000;

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Edges
    edges.forEach(e => {
      const a = nodes.find(n => n.id === e.from);
      const b = nodes.find(n => n.id === e.to);
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(toX(a.lng), toY(a.lat));
      ctx.lineTo(toX(b.lng), toY(b.lat));
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
      const mx = (toX(a.lng) + toX(b.lng)) / 2;
      const my = (toY(a.lat) + toY(b.lat)) / 2;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(e.distance + 'm', mx, my - 5);
    });

    // Nodes
    nodes.forEach(n => {
      const x = toX(n.lng), y = toY(n.lat);
      const sel = selectedNode === n.id;
      ctx.beginPath();
      ctx.arc(x, y, sel ? 10 : 7, 0, Math.PI * 2);
      ctx.fillStyle = sel ? '#10b981' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = sel ? '#34d399' : '#60a5fa';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, x, y - 14);
    });
  }, [nodes, edges, selectedNode]);

  useEffect(() => { draw(); }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;

    if (activeTool === 'add-node') {
      const label = prompt('Node label:');
      if (label) {
        const lng = GEC_CENTER.lng + (x - W / 2) / 50000;
        const lat = GEC_CENTER.lat - (y - H / 2) / 50000;
        setNodes([...nodes, { id: nextId, lat, lng, label }]);
        setNextId(nextId + 1);
      }
    } else if (activeTool === 'connect' || activeTool === 'delete') {
      const node = nodes.find(n => Math.sqrt((x - toX(n.lng)) ** 2 + (y - toY(n.lat)) ** 2) < 15);
      if (node) {
        if (activeTool === 'delete') {
          setNodes(nodes.filter(n => n.id !== node.id));
          setEdges(edges.filter(e => e.from !== node.id && e.to !== node.id));
        } else if (connectFrom === null) {
          setConnectFrom(node.id);
          setSelectedNode(node.id);
        } else if (connectFrom !== node.id) {
          const from = nodes.find(n => n.id === connectFrom)!;
          const dist = Math.round(Math.sqrt(((from.lat - node.lat) * 111000) ** 2 + ((from.lng - node.lng) * 111000) ** 2));
          setEdges([...edges, { id: edges.length + 1, from: connectFrom, to: node.id, distance: dist }]);
          setConnectFrom(null);
          setSelectedNode(null);
        }
      }
    } else {
      const node = nodes.find(n => Math.sqrt((x - toX(n.lng)) ** 2 + (y - toY(n.lat)) ** 2) < 15);
      setSelectedNode(node ? node.id : null);
    }
  };

  const tools: Array<{ id: Tool; label: string; icon: string }> = [
    { id: 'select', label: 'Select', icon: '🔍' },
    { id: 'add-node', label: 'Add Node', icon: '📍' },
    { id: 'connect', label: 'Connect', icon: '🔗' },
    { id: 'delete', label: 'Delete', icon: '🗑️' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Map Editor</h1>
        <p className="text-gray-400 mt-1">Visual editor for campus navigation graph</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 space-y-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase">Tools</h3>
            <div className="space-y-2">
              {tools.map(t => (
                <button key={t.id} onClick={() => { setActiveTool(t.id); setConnectFrom(null); setSelectedNode(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTool === t.id ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' : 'text-gray-400 hover:bg-gray-800 border border-transparent'}`}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-400">Nodes</span><span className="text-white">{nodes.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Edges</span><span className="text-white">{edges.length}</span></div>
          </div>
          {connectFrom !== null && activeTool === 'connect' && (
            <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-3 text-sm text-amber-400">Click second node to connect</div>
          )}
        </div>
        <div className="flex-1">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <canvas ref={canvasRef} width={W} height={H} onClick={handleClick} className="cursor-crosshair" style={{ maxWidth: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}