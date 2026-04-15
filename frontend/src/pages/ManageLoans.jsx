import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, BookOpen, Search, Loader2, X, CheckCircle } from 'lucide-react';

export default function ManageLoans() {
    const { apiRequest } = useAuth();
    const [activeTab, setActiveTab] = useState('lend'); // 'lend' or 'return'
    const [studentKeyword, setStudentKeyword] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [bookKeyword, setBookKeyword] = useState('');
    const [books, setBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // 搜索学生（共用）
    const searchStudents = async () => {
        if (!studentKeyword.trim()) return;
        setLoading(true);
        try {
            const data = await apiRequest(`/loans/users/search?keyword=${encodeURIComponent(studentKeyword)}`);
            setStudents(data.users || []);
        } catch (err) {
            showMessage('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    // 搜索图书（仅借书）
    const searchBooks = async () => {
        if (!bookKeyword.trim()) return;
        setLoading(true);
        try {
            const data = await apiRequest(`/loans/books/search?keyword=${encodeURIComponent(bookKeyword)}`);
            setBooks(data.books || []);
        } catch (err) {
            showMessage('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    // 获取学生的未还图书（仅还书）
    const fetchStudentLoans = async (studentId) => {
        setLoading(true);
        try {
            const data = await apiRequest(`/loans/user/${studentId}?activeOnly=true`);
            setLoans(data.loans || []);
        } catch (err) {
            showMessage('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    // 代借书
    const handleLend = async () => {
        if (!selectedStudent || !selectedBook) {
            showMessage('error', '请选择学生和图书');
            return;
        }
        setLoading(true);
        try {
            await apiRequest('/loans/lend', {
                method: 'POST',
                body: JSON.stringify({ userId: selectedStudent.id, bookId: selectedBook.id })
            });
            showMessage('success', '借书成功');
            setSelectedStudent(null);
            setSelectedBook(null);
            setStudents([]);
            setBooks([]);
            setStudentKeyword('');
            setBookKeyword('');
        } catch (err) {
            showMessage('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    // 代还书
    const handleReturn = async (loanId) => {
        setLoading(true);
        try {
            await apiRequest(`/loans/${loanId}/return`, { method: 'PUT' });
            showMessage('success', '还书成功');
            if (selectedStudent) {
                await fetchStudentLoans(selectedStudent.id);
            }
        } catch (err) {
            showMessage('error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">管理借还书</h1>

            <div className="flex gap-4 mb-6 border-b">
                <button className={`pb-2 px-2 ${activeTab === 'lend' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`} onClick={() => setActiveTab('lend')}>代借书</button>
                <button className={`pb-2 px-2 ${activeTab === 'return' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`} onClick={() => setActiveTab('return')}>代还书</button>
            </div>

            {message.text && (
                <div className={`mb-4 p-3 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'lend' && (
                <div className="space-y-6">
                    {/* 选择学生 */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><User size={20} /> 选择学生</h2>
                        <div className="flex gap-2 mb-3">
                            <input type="text" value={studentKeyword} onChange={e => setStudentKeyword(e.target.value)} placeholder="学号或邮箱" className="flex-1 border rounded-md px-3 py-2" />
                            <button onClick={searchStudents} className="bg-primary text-white px-4 py-2 rounded-md">搜索</button>
                        </div>
                        {students.length > 0 && (
                            <div className="border rounded-md divide-y">
                                {students.map(s => (
                                    <div key={s.id} className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedStudent?.id === s.id ? 'bg-blue-50' : ''}`} onClick={() => setSelectedStudent(s)}>
                                        <div className="font-medium">{s.name}</div>
                                        <div className="text-sm text-gray-500">学号: {s.studentId} | 邮箱: {s.email}</div>
                                        <div className="text-xs">当前借阅: {s.currentBorrowCount}/{3} | {s.hasOverdue && <span className="text-red-500">有逾期</span>}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 选择图书 */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><BookOpen size={20} /> 选择图书</h2>
                        <div className="flex gap-2 mb-3">
                            <input type="text" value={bookKeyword} onChange={e => setBookKeyword(e.target.value)} placeholder="书名或ISBN" className="flex-1 border rounded-md px-3 py-2" />
                            <button onClick={searchBooks} className="bg-primary text-white px-4 py-2 rounded-md">搜索</button>
                        </div>
                        {books.length > 0 && (
                            <div className="border rounded-md divide-y">
                                {books.map(b => (
                                    <div key={b.id} className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedBook?.id === b.id ? 'bg-blue-50' : ''}`} onClick={() => setSelectedBook(b)}>
                                        <div className="font-medium">{b.title}</div>
                                        <div className="text-sm text-gray-500">作者: {b.author} | ISBN: {b.isbn}</div>
                                        <div className="text-xs">可借: {b.availableCopies}/{b.totalCopies}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={handleLend} disabled={!selectedStudent || !selectedBook || loading} className="bg-blue-500 text-white px-6 py-2 rounded-md disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin inline" size={16} /> : '确认借出'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'return' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><User size={20} /> 选择学生</h2>
                        <div className="flex gap-2 mb-3">
                            <input type="text" value={studentKeyword} onChange={e => setStudentKeyword(e.target.value)} placeholder="学号或邮箱" className="flex-1 border rounded-md px-3 py-2" />
                            <button onClick={searchStudents} className="bg-primary text-white px-4 py-2 rounded-md">搜索</button>
                        </div>
                        {students.length > 0 && (
                            <div className="border rounded-md divide-y">
                                {students.map(s => (
                                    <div key={s.id} className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedStudent?.id === s.id ? 'bg-blue-50' : ''}`} onClick={() => { setSelectedStudent(s); fetchStudentLoans(s.id); }}>
                                        <div className="font-medium">{s.name}</div>
                                        <div className="text-sm text-gray-500">学号: {s.studentId} | 邮箱: {s.email}</div>
                                        <div className="text-xs">当前借阅: {s.currentBorrowCount}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {selectedStudent && (
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-semibold mb-3">{selectedStudent.name} 的未还图书</h2>
                            {loans.length === 0 ? (
                                <p className="text-gray-500">暂无未还图书</p>
                            ) : (
                                <div className="space-y-3">
                                    {loans.map(loan => (
                                        <div key={loan.id} className="border rounded-md p-3 flex justify-between items-center">
                                            <div>
                                                <div className="font-medium">{loan.book?.title}</div>
                                                <div className="text-sm text-gray-500">借出: {new Date(loan.checkoutDate).toLocaleDateString()}</div>
                                                <div className="text-sm">应还: {new Date(loan.dueDate).toLocaleDateString()}</div>
                                            </div>
                                            <button onClick={() => handleReturn(loan.id)} className="bg-green-500 text-white px-4 py-1 rounded">还书</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}