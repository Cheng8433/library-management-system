import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Book, Search, Loader2, User, X } from 'lucide-react';

export default function BorrowBook() {
    const { apiRequest, user } = useAuth();
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [borrowing, setBorrowing] = useState({});
    const [confirmModal, setConfirmModal] = useState({ show: false, book: null, dueDate: '' });
    const MAX_LOAN_DAYS = 30;

    useEffect(() => {
        fetchAvailableBooks();
    }, []);

    const fetchAvailableBooks = async () => {
        setLoading(true);
        try {
            const data = await apiRequest('/books?available=true');
            setBooks(data.data || []);
            setFilteredBooks(data.data || []);
        } catch (err) {
            showMessage('error', '获取图书列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (keyword) => {
        setSearch(keyword);
        if (!keyword.trim()) {
            setFilteredBooks(books);
        } else {
            const filtered = books.filter(book =>
                book.title.toLowerCase().includes(keyword.toLowerCase()) ||
                book.author.toLowerCase().includes(keyword.toLowerCase()) ||
                book.isbn?.includes(keyword)
            );
            setFilteredBooks(filtered);
        }
    };

    const openConfirmModal = (book) => {
        setConfirmModal({ show: true, book, dueDate: '' });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ show: false, book: null, dueDate: '' });
    };

    const handleConfirmBorrow = async () => {
        const { book, dueDate } = confirmModal;
        if (!book) return;
        if (!dueDate) {
            showMessage('error', '请选择归还日期');
            return;
        }
        closeConfirmModal();
        setBorrowing(prev => ({ ...prev, [book.id]: true }));
        try {
            await apiRequest('/loans/borrow', {
                method: 'POST',
                body: JSON.stringify({ bookId: book.id, dueDate })
            });
            showMessage('success', '借书成功');
            await fetchAvailableBooks();
        } catch (err) {
            showMessage('error', err.message || '借书失败');
        } finally {
            setBorrowing(prev => ({ ...prev, [book.id]: false }));
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const minDate = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + MAX_LOAN_DAYS);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-2">借书</h1>
            <div className="mb-6 flex items-center gap-2 text-gray-600">
                <User size={16} />
                <span>当前读者：{user?.name} ({user?.email})</span>
            </div>

            {message.text && (
                <div className={`mb-4 p-3 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="搜索书名、作者或ISBN..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                />
            </div>

            {loading ? (
                <div className="text-center py-12">加载中...</div>
            ) : filteredBooks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无可借图书</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBooks.map(book => (
                        <div key={book.id} className="bg-white rounded-lg shadow-sm border p-4">
                            <h3 className="font-semibold text-lg">{book.title}</h3>
                            <p className="text-gray-600 text-sm">{book.author}</p>
                            <div className="text-sm text-gray-500 mt-1">可借数量：{book.availableCopies}</div>
                            <button
                                onClick={() => openConfirmModal(book)}
                                disabled={borrowing[book.id]}
                                className="mt-3 w-full bg-blue-500 text-white py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                                {borrowing[book.id] ? <Loader2 className="animate-spin inline" size={16} /> : '借阅'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* 确认借书模态框 */}
            {confirmModal.show && confirmModal.book && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-semibold">确认借书</h2>
                            <button onClick={closeConfirmModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4">
                            <p className="mb-2">您确定要借阅以下图书吗？</p>
                            <div className="bg-gray-50 p-3 rounded-md mb-4">
                                <p className="font-medium">{confirmModal.book.title}</p>
                                <p className="text-sm text-gray-600">作者：{confirmModal.book.author}</p>
                                <p className="text-sm text-gray-600">可借数量：{confirmModal.book.availableCopies}</p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">选择归还日期</label>
                                <input
                                    type="date"
                                    value={confirmModal.dueDate}
                                    onChange={(e) => setConfirmModal(prev => ({ ...prev, dueDate: e.target.value }))}
                                    min={minDate}
                                    max={maxDateStr}
                                    required
                                    className="w-full border rounded-md px-3 py-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">最长可借 {MAX_LOAN_DAYS} 天</p>
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
                                onClick={handleConfirmBorrow}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            >
                                确认借阅
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}