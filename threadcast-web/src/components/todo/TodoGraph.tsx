import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  ConnectionMode,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { clsx } from 'clsx';
import type { Todo } from '../../types';
import { TodoGraphNode } from './TodoGraphNode';
import { useTranslation } from '../../hooks/useTranslation';

interface TodoGraphProps {
  todos: Todo[];
  onTodoClick?: (todoId: string) => void;
  onDependencyAdd?: (fromId: string, toId: string) => void;
  onDependencyRemove?: (fromId: string, toId: string) => void;
  className?: string;
}

const nodeTypes: NodeTypes = {
  todoNode: TodoGraphNode,
};

// Edge styles based on source node status
const getEdgeStyle = (sourceStatus?: string) => {
  if (sourceStatus === 'WOVEN' || sourceStatus === 'COMPLETED') {
    return {
      stroke: '#22c55e',
      strokeWidth: 2,
    };
  }
  if (sourceStatus === 'THREADING' || sourceStatus === 'IN_PROGRESS') {
    return {
      stroke: '#f59e0b',
      strokeWidth: 2,
      strokeDasharray: '5,5',
    };
  }
  return {
    stroke: '#94a3b8',
    strokeWidth: 1.5,
  };
};

// Auto-layout: left-to-right DAG layout using topological sort
function layoutNodes(todos: Todo[]): Node[] {
  const todoMap = new Map(todos.map(t => [t.id, t]));
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  // Calculate level for each node (max dependency depth)
  function calculateLevel(todoId: string): number {
    if (levels.has(todoId)) return levels.get(todoId)!;
    if (visited.has(todoId)) return 0;
    visited.add(todoId);

    const todo = todoMap.get(todoId);
    if (!todo || !todo.dependencies || todo.dependencies.length === 0) {
      levels.set(todoId, 0);
      return 0;
    }

    let maxDepLevel = 0;
    for (const dep of todo.dependencies) {
      const depId = typeof dep === 'string' ? dep : dep.id;
      const depLevel = calculateLevel(depId);
      maxDepLevel = Math.max(maxDepLevel, depLevel + 1);
    }

    levels.set(todoId, maxDepLevel);
    return maxDepLevel;
  }

  // Calculate levels for all todos
  todos.forEach(t => calculateLevel(t.id));

  // Group todos by level
  const levelGroups = new Map<number, Todo[]>();
  todos.forEach(todo => {
    const level = levels.get(todo.id) ?? 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(todo);
  });

  // Create nodes with positions
  const nodes: Node[] = [];
  const nodeWidth = 200;
  const nodeHeight = 100;
  const horizontalGap = 80;
  const verticalGap = 30;

  levelGroups.forEach((todosInLevel, level) => {
    const x = level * (nodeWidth + horizontalGap) + 50;
    todosInLevel.forEach((todo, index) => {
      const y = index * (nodeHeight + verticalGap) + 50;
      nodes.push({
        id: todo.id,
        type: 'todoNode',
        position: { x, y },
        data: { todo },
      });
    });
  });

  return nodes;
}

function createEdges(todos: Todo[]): Edge[] {
  const todoMap = new Map(todos.map(t => [t.id, t]));
  const edges: Edge[] = [];

  todos.forEach(todo => {
    if (todo.dependencies && todo.dependencies.length > 0) {
      todo.dependencies.forEach(dep => {
        const depId = typeof dep === 'string' ? dep : dep.id;
        const sourceTodo = todoMap.get(depId);
        if (sourceTodo) {
          edges.push({
            id: `${depId}-${todo.id}`,
            source: depId,
            target: todo.id,
            type: 'smoothstep',
            animated: sourceTodo.status === 'THREADING' || sourceTodo.status === 'IN_PROGRESS',
            style: getEdgeStyle(sourceTodo.status),
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15,
              color: sourceTodo.status === 'WOVEN' || sourceTodo.status === 'COMPLETED'
                ? '#22c55e'
                : sourceTodo.status === 'THREADING' || sourceTodo.status === 'IN_PROGRESS'
                ? '#f59e0b'
                : '#94a3b8',
            },
          });
        }
      });
    }
  });

  return edges;
}

export function TodoGraph({
  todos,
  onTodoClick,
  onDependencyAdd,
  onDependencyRemove,
  className,
}: TodoGraphProps) {
  const { t } = useTranslation();

  // Calculate initial nodes and edges directly (no useMemo to avoid React error #310)
  const initialNodes = (() => {
    const nodes = layoutNodes(todos);
    // Add click handler to node data
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onClick: onTodoClick,
      },
    }));
  })();

  const initialEdges = createEdges(todos);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when todos change
  useEffect(() => {
    const newNodes = layoutNodes(todos).map(node => ({
      ...node,
      data: {
        ...node.data,
        onClick: onTodoClick,
      },
    }));
    setNodes(newNodes);
    setEdges(createEdges(todos));
  }, [todos, onTodoClick, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && onDependencyAdd) {
        // When connecting, the source becomes a dependency of the target
        // source -> target means target depends on source
        onDependencyAdd(connection.source, connection.target);
      }
      setEdges(eds => addEdge({
        ...connection,
        type: 'smoothstep',
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: '#94a3b8',
        },
      }, eds));
    },
    [onDependencyAdd, setEdges]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (onDependencyRemove) {
        const confirmed = window.confirm(t('graph.confirmRemoveDependency'));
        if (confirmed) {
          onDependencyRemove(edge.source, edge.target);
          setEdges(eds => eds.filter(e => e.id !== edge.id));
        }
      }
    },
    [onDependencyRemove, setEdges, t]
  );

  // Legend component
  const Legend = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 p-2 text-[10px]">
      <div className="font-semibold text-slate-600 mb-1.5">{t('graph.legend')}</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
          <span className="text-slate-500">{t('status.pending')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-400" />
          <span className="text-slate-500">{t('status.threading')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-400" />
          <span className="text-slate-500">{t('status.woven')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-400" />
          <span className="text-slate-500">{t('status.tangled')}</span>
        </div>
      </div>
    </div>
  );

  if (todos.length === 0) {
    return (
      <div className={clsx('flex items-center justify-center h-[400px] text-slate-400', className)}>
        {t('graph.noTodos')}
      </div>
    );
  }

  return (
    <div className={clsx('h-[400px] bg-slate-50 rounded-lg', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background color="#e2e8f0" gap={16} size={1} />
        <Controls
          className="!bg-white !border-slate-200 !shadow-sm"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            const todo = node.data?.todo as Todo | undefined;
            if (!todo) return '#94a3b8';
            switch (todo.status) {
              case 'THREADING':
              case 'IN_PROGRESS':
                return '#f59e0b';
              case 'WOVEN':
              case 'COMPLETED':
                return '#22c55e';
              case 'TANGLED':
                return '#ef4444';
              default:
                return '#94a3b8';
            }
          }}
          className="!bg-white/80 !border-slate-200"
          maskColor="rgba(0,0,0,0.08)"
        />
        <Panel position="top-right">
          <Legend />
        </Panel>
      </ReactFlow>
    </div>
  );
}
