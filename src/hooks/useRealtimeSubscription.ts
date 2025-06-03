import { useEffect, useRef } from 'react';
import { supabase } from '@/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionOptions {
  channelName: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  schema?: string;
  table: string;
  filter?: string;
  onMessage: (payload: RealtimePostgresChangesPayload<any>) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

/**
 * Custom hook for managing Supabase realtime subscriptions with proper cleanup
 * Prevents memory leaks by properly tracking and cleaning up channel references
 */
export function useRealtimeSubscription({
  channelName,
  event = '*',
  schema = 'public',
  table,
  filter,
  onMessage,
  onError,
  enabled = true
}: UseRealtimeSubscriptionOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isCleaningUp = useRef(false);

  useEffect(() => {
    if (!enabled) {
      // 구독이 비활성화되면 기존 채널 정리
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (e) {
          console.error('채널 정리 중 오류:', e);
        }
        channelRef.current = null;
      }
      return;
    }

    // 정리 플래그 초기화
    isCleaningUp.current = false;

    // 이전 구독 정리
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (e) {
        console.error('이전 채널 정리 중 오류:', e);
      }
      channelRef.current = null;
    }

    // 새 구독 설정
    try {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes' as any,
          {
            event,
            schema,
            table,
            ...(filter && { filter })
          },
          (payload: RealtimePostgresChangesPayload<any>) => {
            // 정리 중이면 메시지 무시
            if (isCleaningUp.current) return;
            
            try {
              onMessage(payload);
            } catch (error) {
              console.error('메시지 처리 중 오류:', error);
              onError?.(error as Error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            onError?.(new Error('채널 구독 실패'));
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('구독 설정 중 오류:', error);
      onError?.(error as Error);
    }

    // Cleanup function
    return () => {
      isCleaningUp.current = true;
      
      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (e) {
          console.error('채널 정리 중 오류:', e);
        }
        channelRef.current = null;
      }
    };
  }, [channelName, event, schema, table, filter, enabled]);

  // 수동으로 구독 해제하는 함수 제공
  const unsubscribe = () => {
    isCleaningUp.current = true;
    
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      } catch (e) {
        console.error('수동 구독 해제 중 오류:', e);
      }
    }
  };

  return { unsubscribe };
}