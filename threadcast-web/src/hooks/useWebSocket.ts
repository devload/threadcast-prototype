import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import { useMissionStore, useTodoStore, useTimelineStore, useAuthStore } from '../stores';
import type { Mission, Todo, TimelineEvent } from '../types';
import { DEMO_MODE } from '../services/api';

// WebSocket connects directly to backend (not through Vite proxy)
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:21000/ws';

interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
}

export function useWebSocket(workspaceId: string | null) {
  const clientRef = useRef<Client | null>(null);
  const { isAuthenticated } = useAuthStore();
  const { onMissionCreated, onMissionUpdated, onMissionDeleted } = useMissionStore();
  const { onTodoCreated, onTodoUpdated, onTodoDeleted } = useTodoStore();
  const { onNewEvent } = useTimelineStore();

  const handleMissionMessage = useCallback((message: IMessage) => {
    const data = JSON.parse(message.body) as WebSocketMessage<Mission>;
    switch (data.type) {
      case 'CREATED':
        onMissionCreated(data.payload);
        break;
      case 'UPDATED':
        onMissionUpdated(data.payload);
        break;
      case 'DELETED':
        onMissionDeleted(data.payload.id);
        break;
    }
  }, [onMissionCreated, onMissionUpdated, onMissionDeleted]);

  const handleTodoMessage = useCallback((message: IMessage) => {
    const data = JSON.parse(message.body) as WebSocketMessage<Todo>;
    switch (data.type) {
      case 'CREATED':
        onTodoCreated(data.payload);
        break;
      case 'UPDATED':
        onTodoUpdated(data.payload);
        break;
      case 'DELETED':
        onTodoDeleted(data.payload.id);
        break;
    }
  }, [onTodoCreated, onTodoUpdated, onTodoDeleted]);

  const handleTimelineMessage = useCallback((message: IMessage) => {
    const event = JSON.parse(message.body) as TimelineEvent;
    onNewEvent(event);
  }, [onNewEvent]);

  useEffect(() => {
    // Skip WebSocket in demo mode
    if (DEMO_MODE || !isAuthenticated || !workspaceId) return;

    const token = localStorage.getItem('accessToken');
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // Disable debug logging
      debug: () => {},
    });

    client.onConnect = () => {
      // Subscribe to workspace topics
      client.subscribe(`/topic/workspace/${workspaceId}/missions`, handleMissionMessage);
      client.subscribe(`/topic/workspace/${workspaceId}/todos`, handleTodoMessage);
      client.subscribe(`/topic/workspace/${workspaceId}/timeline`, handleTimelineMessage);
    };

    client.onStompError = () => {
      // Silently ignore STOMP errors
    };

    client.onWebSocketError = () => {};
    client.onWebSocketClose = () => {};

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [isAuthenticated, workspaceId, handleMissionMessage, handleTodoMessage, handleTimelineMessage]);

  return clientRef.current;
}
