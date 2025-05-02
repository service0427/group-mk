import React, { useState } from "react";

// 사용자 타입 정의
export interface UserItem {
    id: string | number;
    email: string;
    full_name: string;
    [key: string]: any; // 추가 속성을 위한 인덱스 시그니처
}

export function useWithdrawSetting() {
    // 출금 설정 페이지에 필요한 상태 변수 (로딩 등등)
    const [loading, setLoading] = useState(false);
    const [savingGlobal, setSavingGlobal] = useState(false);
    const [savingUser, setSavingUser] = useState(false);
    const [userList, setUserList] = useState<UserItem[]>([]);

    // 알림 상태
    const [notification, setNotification] = useState<{ 
        show: boolean; 
        message: string; 
        type: 'success' | 'error' | string;
    }>({ 
        show: false, 
        message: '', 
        type: '' 
    });

    return {
        loading,
        setLoading,
        savingGlobal,
        setSavingGlobal,
        savingUser,
        setSavingUser,
        notification,
        setNotification,
        userList,
        setUserList
    };
}