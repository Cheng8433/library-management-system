import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, Search, X, Loader2 } from 'lucide-react';

export default function ManageBooks() {
    const { apiRequest } = useAuth();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [formData, setFormData] = useState({
        title: '', author: '', isbn: '', genre: '',
        description: '', language: 'English', shelfLocation: '',
        totalCopies: 1, availableCopies: 1
    });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const data = await apiRequest('/books');
            setBooks(data.data || []);
        } catch (err) {
            showMessage('error', '获取图书列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const data = await apiRequest(`/books?search=${encodeURIComponent(search)}`);
            setBooks(data.data || []);
        } catch (err) {
            showMessage('error', '搜索失败');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingBook(null);
        setFormData({
            title: '', author: '', isbn: '', genre: '',
            description: '', language: 'English', shelfLocation: '',
            totalCopies: 1, availableCopies: 1
        });
        setModalOpen(true);
    };

    const openEditModal = (book) => {
        setEditingBook(book);
        setFormData({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            description: book.description || '',
            language: book.language || 'English',
            shelfLocation: book.shelfLocation || '',
            totalCopies: book.totalCopies,
            availableCopies: book.availableCopies
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingBook) {
                await apiRequest(`/books/${editingBook.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                showMessage('success', '图书更新成功');
            } else {
                await apiRequest('/books', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                showMessage('success', '图书添加成功');
            }
            setModalOpen(false);
            await fetchBooks();
        } catch (err) {
            showMessage('error', err.message || '操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (bookId) => {
        if (!confirm('确定要删除这本书吗？此操作不可恢复。')) return;
        try {
            await apiRequest(`/books/${bookId}`, { method: 'DELETE' });
            showMessage('success', '删除成功');
            await fetchBooks();
        } catch (err) {
            showMessage('error', err.message || '删除失败');
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    // 安全过滤，防止 undefined 导致 includes 报错
    const filteredBooks = books.filter(book =>
        (book.title?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (book.author?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (book.isbn?.toLowerCase() || '').includes(search.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">管理书籍</h1>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-1"
                >
                    <Plus size={16} /> 添加图书
                </button>
            </div>

            {message.text && (
                <div className={`mb-4 p-3 rounded-md ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="搜索书名、作者或ISBN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 border rounded-md px-3 py-2"
                />
                <button onClick={handleSearch} className="bg-gray-500 text-white px-4 py-2 rounded-md">搜索</button>
            </div>

            {loading ? (
                <div className="text-center py-12">加载中...</div>
            ) : filteredBooks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无图书</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border rounded-lg">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left">书名</th>
                            <th className="px-4 py-2 text-left">作者</th>
                            <th className="px-4 py-2 text-left">ISBN</th>
                            <th className="px-4 py-2 text-left">分类</th>
                            <th className="px-4 py-2 text-left">总册数</th>
                            <th className="px-4 py-2 text-left">可借</th>
                            <th className="px-4 py-2 text-center">操作</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredBooks.map(book => (
                            <tr key={book.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-2">{book.title}</td>
                                <td className="px-4 py-2">{book.author}</td>
                                <td className="px-4 py-2">{book.isbn}</td>
                                <td className="px-4 py-2">{book.genre}</td>
                                <td className="px-4 py-2">{book.totalCopies}</td>
                                <td className="px-4 py-2">{book.availableCopies}</td>
                                <td className="px-4 py-2 text-center">
                                    <button onClick={() => openEditModal(book)} className="text-blue-500 mr-2"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(book.id)} className="text-red-500"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 添加/编辑模态框 */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-semibold">{editingBook ? '编辑图书' : '添加图书'}</h2>
                            <button onClick={() => setModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-3">
                            <input type="text" placeholder="书名 *" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full border rounded-md px-3 py-2" />
                            <input type="text" placeholder="作者 *" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} required className="w-full border rounded-md px-3 py-2" />
                            <input type="text" placeholder="ISBN *" value={formData.isbn} onChange={e => setFormData({...formData, isbn: e.target.value})} required className="w-full border rounded-md px-3 py-2" />
                            <input type="text" placeholder="分类" value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="w-full border rounded-md px-3 py-2" />
                            <textarea placeholder="描述" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded-md px-3 py-2" />
                            <input type="text" placeholder="语言" value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full border rounded-md px-3 py-2" />
                            <input type="text" placeholder="馆藏位置" value={formData.shelfLocation} onChange={e => setFormData({...formData, shelfLocation: e.target.value})} className="w-full border rounded-md px-3 py-2" />
                            <input type="number" placeholder="总册数" value={formData.totalCopies} onChange={e => setFormData({...formData, totalCopies: parseInt(e.target.value)})} className="w-full border rounded-md px-3 py-2" />
                            <input type="number" placeholder="可借册数" value={formData.availableCopies} onChange={e => setFormData({...formData, availableCopies: parseInt(e.target.value)})} className="w-full border rounded-md px-3 py-2" />
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-md">取消</button>
                                <button type="submit" disabled={submitting} className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-1">
                                    {submitting ? <Loader2 className="animate-spin" size={16} /> : (editingBook ? '更新' : '添加')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}