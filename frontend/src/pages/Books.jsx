import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Book, Search, History, Users, Library } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Books() {
    const { apiRequest, user, isAdmin } = useAuth();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const data = await apiRequest('/books');
            setBooks(data.data || []);
        } catch (error) {
            console.error('Failed to fetch books:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(search.toLowerCase()) ||
        book.author.toLowerCase().includes(search.toLowerCase())
    );

    // 判断是否为读者（普通用户）
    const isStudent = user?.role === 'STUDENT';

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Book className="h-6 w-6" />
                        图书列表
                    </h1>
                    <p className="text-gray-600 mt-1">浏览图书馆藏书</p>
                </div>

                {/* 根据角色显示不同按钮组 */}
                {isStudent ? (
                    // 读者自助按钮
                    <div className="flex gap-2">
                        <Link
                            to="/borrow"
                            className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 transition-colors flex items-center gap-1"
                        >
                            借书
                        </Link>
                        <Link
                            to="/return"
                            className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600 transition-colors flex items-center gap-1"
                        >
                            还书
                        </Link>
                        <Link
                            to="/borrow-records"
                            className="bg-purple-500 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-600 transition-colors flex items-center gap-1"
                        >
                            <History size={16} />
                            借书记录
                        </Link>
                    </div>
                ) : (
                    // 管理员/图书管理员管理按钮
                    <div className="flex gap-2">
                        <Link
                            to="/admin/manage-loans"
                            className="bg-indigo-500 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-600 transition-colors flex items-center gap-1"
                        >
                            <Users size={16} />
                            管理借还书
                        </Link>
                        <Link
                            to="/admin/manage-books"
                            className="bg-amber-500 text-white px-4 py-2 rounded-md text-sm hover:bg-amber-600 transition-colors flex items-center gap-1"
                        >
                            <Library size={16} />
                            管理书籍
                        </Link>
                    </div>
                )}
            </div>

            {/* 搜索框和图书列表保持不变 */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="搜索书名或作者..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">加载中...</div>
            ) : filteredBooks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无图书</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBooks.map((book) => (
                        <div key={book.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                            <Link to={`/books/${book.id}`} className="block">
                                <h3 className="font-semibold text-lg mb-1">{book.title}</h3>
                                <p className="text-gray-600 text-sm mb-2">{book.author}</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">{book.shelfLocation || '未指定位置'}</span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${book.availableCopies > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {book.availableCopies > 0 ? '可借' : '全部借出'}
                                    </span>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}