import { useState } from 'react';
import { supabase } from '@/auth/supabase/supabaseClient';

// RPC 호출 더미 구현 
// 실제로는 API를 호출하지 않지만 기존 코드의 인터페이스 유지

// 프로필 정보 조회 훅
export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 더미 데이터 반환
      return {
        id: '1',
        name: 'Test User',
        role: 'user',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      };
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { getProfile, loading, error };
};

// 잔액 조회 훅
export const useBalance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getBalance = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 더미 데이터 반환
      return {
        balance: 10000,
        currency: 'KRW'
      };
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { getBalance, loading, error };
};

// 활동 내역 조회 훅
export const useActivities = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const getActivities = async (limit = 10, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      // 더미 데이터 반환
      return Array(limit).fill(null).map((_, index) => ({
        id: String(index + offset),
        type: 'login',
        created_at: new Date().toISOString(),
        description: `Activity ${index + offset}`
      }));
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { getActivities, loading, error };
};

// 프로필 업데이트 훅
export const useUpdateProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const updateProfile = async (name?: string, role?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // 더미 성공 반환
      return true;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { updateProfile, loading, error };
};

// 비밀번호 변경 훅
export const useChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // 더미 성공 반환
      return true;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { changePassword, loading, error };
};

// 잔액 충전 훅
export const useDepositCash = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const depositCash = async (amount: number, paymentMethod?: string, transactionId?: string, isFree = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // 더미 성공 반환
      return {
        success: true,
        transaction_id: 'tx_' + Date.now(),
        amount: amount
      };
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { depositCash, loading, error };
};
