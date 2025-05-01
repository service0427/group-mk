import { useState } from "react";

export function useWithdrawApprove() {
    // 출금 승인 페이지에 필요한 상태 변수 (로딩 등등)
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [requestList, setRequestList] = useState([]);

    // 알림 상태
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    return {
        loading,
        setLoading,
        saving,
        setSaving,
        notification,
        setNotification,
        requestList,
        setRequestList
    };
}