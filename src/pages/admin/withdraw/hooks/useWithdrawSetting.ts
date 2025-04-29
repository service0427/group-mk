import React, { useState } from "react";

export function useWithdrawSetting() {
    // 출금 설정 페이지에 필요한 상태 변수 (로딩 등등)
    const [loading, setLoading] = useState(false);
    const [savingGlobal, setSavingGlobal] = useState(false);
    const [savingUser, setSavingUser] = useState(false);
    const [userList, setUserList] = useState([]);

    // 알림 상태
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

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