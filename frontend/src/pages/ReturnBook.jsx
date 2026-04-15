import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, User, Calendar, AlertCircle, X } from 'lucide-react';

export default function ReturnBook() {
    const { apiRequest, user } = useAuth();
    const navigate = useNavigate();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [returning, setReturning] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });
    const [confirmModal, setConfirmModal] = useState({ show: false, loan: null });

    useEffect(() => {
        fetchMyLoans();
    }, []);

    const fetchMyLoans = async () => {
        setLoading(true);
        try {
            const data = await apiRequest('/loans/my?activeOnly=true');
            setLoans(data.loans || []);
        } catch (err) {
            showMessage('error', '获取借阅记录失败');
        } finally {
            setLoading(false);
        }
    };

    const openConfirmModal = (loan) => {
        setConfirmModal({ show: true, loan });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ show: false, loan: null });
    };

    const handleConfirmReturn = async () => {
        const loan = confirmModal.loan;
        if (!loan) return;
        closeConfirmModal();
        setReturning(prev => ({ ...prev, [loan.id]: true }));
        try {
            await apiRequest(`/loans/${loan.id}/return`, { method: 'PUT' });
            showMessage('success', '还书成功');
            await fetchMyLoans();
        } catch (err) {
            showMessage('error', err.message || '还书失败');
        } finally {
            setReturning(prev => ({ ...prev, [loan.id]: false }));
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    };

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date();
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-2">还书</h1>
            <div className="mb-6 flex items-center gap-2 text-gray-600">
                <User size={16} />
                <span>当前读者：{user?.name} ({user?.email})</span>
            </div>

            {message.text && (
                <div className={`mb-4 p-3 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">加载中...</div>
            ) : loans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无未还图书</div>
            ) : (
                <div className="space-y-4">
                    {loans.map(loan => (
                        <div key={loan.id} className="bg-white rounded-lg shadow-sm border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={18} className="text-gray-500" />
                                    <h3 className="font-semibold text-lg">{loan.book?.title}</h3>
                                </div>
                                <p className="text-gray-600 text-sm ml-6">{loan.book?.author}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 ml-6">
                                    <span>借出日期：{formatDate(loan.checkoutDate)}</span>
                                    <span>应还日期：{formatDate(loan.dueDate)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isOverdue(loan.dueDate) && (
                                    <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
                                        <AlertCircle size={14} /> 已逾期
                                    </span>
                                )}
                                <button
                                    onClick={() => openConfirmModal(loan)}
                                    disabled={returning[loan.id]}
                                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                                >
                                    {returning[loan.id] ? <Loader2 className="animate-spin" size={16} /> : '归还'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 确认还书模态框 */}
            {confirmModal.show && confirmModal.loan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-semibold">确认还书</h2>
                            <button onClick={closeConfirmModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="mb-2">您确定要归还以下图书吗？</p>
                            <div className="bg-gray-50 p-3 rounded-md">
                                <p className="font-medium">{confirmModal.loan.book?.title}</p>
                                <p className="text-sm text-gray-600">作者：{confirmModal.loan.book?.author}</p>
                                <p className="text-sm text-gray-600">借出日期：{formatDate(confirmModal.loan.checkoutDate)}</p>
                                <p className="text-sm text-gray-600">应还日期：{formatDate(confirmModal.loan.dueDate)}</p>
                                {isOverdue(confirmModal.loan.dueDate) && (
                                    <p className="text-sm text-red-500 mt-1">该图书已逾期，归还后可能产生罚款。</p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <button
                                onClick={closeConfirmModal}
                                className="px-4 py-2 border rounded-md hover:bg-gray-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleConfirmReturn}
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                            >
                                确认归还
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}