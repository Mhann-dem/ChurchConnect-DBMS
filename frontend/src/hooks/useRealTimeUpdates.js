// hooks/useRealTimeUpdates.js
import { useEffect, useRef, useCallback } from 'react';
import useAuth from './useAuth';

export const useRealTimeUpdates = (resourceType, callbacks = {}) => {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const { user } = useAuth();

  const {
    onUpdate,
    onDelete,
    onCreate,
    onMemberAdded,
    onMemberRemoved,
    onMemberRoleUpdated,
    onConnectionChange
  } = callbacks;

  // Clean up function
  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!user?.token || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    cleanup();

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/${resourceType}/?token=${user.token}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log(`[useRealTimeUpdates] Connected to ${resourceType} WebSocket`);
        reconnectAttemptsRef.current = 0;
        onConnectionChange?.(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error(`[useRealTimeUpdates] Message parsing error:`, error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`[useRealTimeUpdates] WebSocket closed:`, event.code, event.reason);
        wsRef.current = null;
        onConnectionChange?.(false);

        // Attempt to reconnect unless intentionally closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            console.log(`[useRealTimeUpdates] Reconnection attempt ${reconnectAttemptsRef.current}`);
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error(`[useRealTimeUpdates] WebSocket error:`, error);
      };

    } catch (error) {
      console.error(`[useRealTimeUpdates] Connection error:`, error);
    }
  }, [user, resourceType, onConnectionChange]);

  // Handle incoming messages
  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case `${resourceType}_created`:
        onCreate?.(data.data);
        break;

      case `${resourceType}_updated`:
        onUpdate?.(data.data);
        break;

      case `${resourceType}_deleted`:
        onDelete?.(data.id);
        break;

      case 'member_added':
        onMemberAdded?.(data.group_id, data.member);
        break;

      case 'member_removed':
        onMemberRemoved?.(data.group_id, data.member_id);
        break;

      case 'member_role_updated':
        onMemberRoleUpdated?.(data.group_id, data.member_id, data.role);
        break;

      case 'ping':
        // Send pong to keep connection alive
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'pong' }));
        }
        break;

      default:
        console.log(`[useRealTimeUpdates] Unknown message type: ${data.type}`);
    }
  }, [resourceType, onCreate, onUpdate, onDelete, onMemberAdded, onMemberRemoved, onMemberRoleUpdated]);

  // Send message through WebSocket
  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Get connection status
  const isConnected = wsRef.current?.readyState === WebSocket.OPEN;

  // Effect to handle connection
  useEffect(() => {
    if (user?.token) {
      connect();
    }

    return cleanup;
  }, [user, connect, cleanup]);

  // Effect to handle visibility changes (reconnect when tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.token && wsRef.current?.readyState !== WebSocket.OPEN) {
        setTimeout(connect, 1000); // Delay to avoid immediate reconnection
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, connect]);

  return {
    isConnected,
    sendMessage,
    reconnect: connect,
    disconnect: cleanup
  };
};