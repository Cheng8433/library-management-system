import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Clock, CheckCircle, AlertCircle, User, RefreshCw, Loader2 } from 'lucide-react';

export default function BorrowRecords() {
    const { apiRequest, user } = useAuth();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeOnly, setActiveOnly] = useState(true);
    const [renewing, setRenewing] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchLoans();
    }, [activeOnly]);

    const fetchLoans = async () => {
        setLoading(true);
        try {
            const data = await apiRequest(`/loans/my?activeOnly=${activeOnly}`);
            // 假设后端返回的每个 loan 包含 renewalRequest 字段（最近一条）
            setLoans(data.loans || []);
        } catch (err) {
            showMessage('error', '获取借阅记录失败');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleRenew = async (loanId) => {
        setRenewing(prev => ({ ...prev, [loanId]: true }));
        try {
            await apiRequest(`/loans/${loanId}/renew`, { method: 'POST' });
            showMessage('success', '续借申请已提交，请等待管理员审批');
            await fetchLoans(); // 刷新列表，更新续借状态
        } catch (err) {
            showMessage('error', err.message || '申请续借失败');
        } finally {
            setRenewing(prev => ({ ...prev, [loanId]: false }));
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date();
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-2">我的借书记录</h1>
            <div className="mb-6 flex items-center gap-2 text-gray-600">
                <User size={16} />
                <span>当前读者：{user?.name} ({user?.email})</span>
            </div>

            {message.text && (
                <div className={`mb-4 p-3 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveOnly(true)}
                    className={`px-4 py-2 rounded-md ${activeOnly ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    当前借阅
                </button>
                <button
                    onClick={() => setActiveOnly(false)}
                    className={`px-4 py-2 rounded-md ${!activeOnly ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    历史记录
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12">加载中...</div>
            ) : loans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    {activeOnly ? '暂无未还图书' : '暂无借阅历史'}
                </div>
            ) : (
                <div className="space-y-4">
                    {loans.map(loan => {
                        const renewal = loan.renewalRequest;
                        const canRenew = !loan.returnDate && (!renewal || renewal.status === 'REJECTED');
                        const isPending = renewal && renewal.status === 'PENDING';
                        const isApproved = renewal && renewal.status === 'APPROVED';
                        return (
                            <div key={loan.id} className="bg-white rounded-lg shadow-sm border p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{loan.book?.title}</h3>
                                        <p className="text-gray-600 text-sm">{loan.book?.author}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                                            <span>借出日期：{formatDate(loan.checkoutDate)}</span>
                                            <span>应还日期：{formatDate(loan.dueDate)}</span>
                                            {loan.returnDate && (
                                                <span>归还日期：{formatDate(loan.returnDate)}</span>
                                            )}
                                            {isApproved && renewal.newDueDate && (
                                                <span className="text-green-600">续借后应还：{formatDate(renewal.newDueDate)}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        {loan.returnDate ? (
                                            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                                                <CheckCircle size={14} /> 已归还
                                            </span>
                                        ) : (
                                            <>
                                                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isOverdue(loan.dueDate) ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                                    {isOverdue(loan.dueDate) ? (
                                                        <><AlertCircle size={14} /> 已逾期</>
                                                    ) : (
                                                        <><Clock size={14} /> 未归还</>
                                                    )}
                                                </span>
                                                {isPending && (
                                                    <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs">
                                                        <RefreshCw size={14} /> 续借审核中
                                                    </span>
                                                )}
                                                {canRenew && (
                                                    <button
                                                        onClick={() => handleRenew(loan.id)}
                                                        disabled={renewing[loan.id]}
                                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                                                    >
                                                        {renewing[loan.id] ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                                                        申请续借
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {loan.fineAmount > 0 && (
                                            <span className="text-red-500 text-xs bg-red-50 px-2 py-1 rounded-full">
                                                逾期罚款：¥{loan.fineAmount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}