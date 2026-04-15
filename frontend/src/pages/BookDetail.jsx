import { useState, useEffect } from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BookOpen, Info, Tag, MapPin, Layers } from 'lucide-react';

export default function BookDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { apiRequest } = useAuth();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const data = await apiRequest(`/books/${id}`);
                setBook(data);
            } catch (err) {
                setError(err.message || '获取图书详情失败');
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [id, apiRequest]);

    if (loading) return <div className="text-center py-12">加载中...</div>;
    if (error) return <div className="text-center py-12 text-red-500">{error}</div>;
    if (!book) return <div className="text-center py-12">图书不存在</div>;

    return (
        <div className="container mx-auto px-4 py-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-gray-600 hover:text-primary mb-4"
            >
                <ArrowLeft className="h-4 w-4" /> 返回
            </button>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start gap-3 mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-bold">{book.title}</h1>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Tag className="h-4 w-4" />
                            <span className="font-medium">作者：</span> {book.author}
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Info className="h-4 w-4" />
                            <span className="font-medium">ISBN：</span> {book.isbn}
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Layers className="h-4 w-4" />
                            <span className="font-medium">分类：</span> {book.genre}
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">馆藏位置：</span> {book.shelfLocation || '未设置'}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="font-medium">总册数：</span> {book.totalCopies}
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="font-medium">可借册数：</span> {book.availableCopies}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">状态：</span>
                            {book.availableCopies > 0 ? (
                                <span className="text-green-600">可借</span>
                            ) : (
                                <span className="text-red-600">已借完</span>
                            )}
                        </div>
                    </div>
                </div>

                {book.description && (
                    <div className="mt-6 pt-4 border-t">
                        <h2 className="font-semibold mb-2">简介</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{book.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
}