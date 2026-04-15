import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AdminRenewals() {
    const { apiRequest } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        const data = await apiRequest('/loans/renewal-requests');
        setRequests(data.requests);
        setLoading(false);
    };

    const approve = async (requestId, newDueDate) => {
        await apiRequest(`/loans/renewal/${requestId}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ newDueDate })
        });
        fetchRequests();
    };

    const reject = async (requestId) => {
        // 实现拒绝接口（可类似新增）
        await apiRequest(`/loans/renewal/${requestId}/reject`, { method: 'PUT' });
        fetchRequests();
    };

    // 渲染列表...
}