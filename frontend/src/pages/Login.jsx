import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Loader2, AlertCircle, ArrowLeft, Check } from 'lucide-react';

export default function Login() {
    const { login, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [view, setView] = useState('login');

    useEffect(() => {
        if (isAuthenticated && user) {
            const role = user.role;
            if (role === 'LIBRARIAN' || role === 'ADMIN') {
                navigate('/admin/announcements');
            } else {
                navigate('/books');
            }
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const result = await login({ email, password });
            if (result.success) {
                const role = result.user?.role;
                if (role === 'LIBRARIAN' || role === 'ADMIN') {
                    navigate('/admin/announcements');
                } else {
                    navigate('/books');
                }
            } else {
                setError(result.error || '登录失败');
            }
        } catch (err) {
            setError('网络错误，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-md p-8">
                    {view === 'login' && (
                        <>
                            <div className="flex flex-col items-center mb-8">
                                <BookOpen className="h-10 w-10 text-primary mb-3" />
                                <h1 className="text-2xl font-bold">图书馆管理系统</h1>
                                <p className="text-gray-500 mt-1">请使用邮箱和密码登录</p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" htmlFor="email">
                                        邮箱
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="请输入注册邮箱"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5" htmlFor="password">
                                        密码
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="请输入密码"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-primary text-white py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            登录中...
                                        </>
                                    ) : (
                                        '登录'
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col gap-3">
                                <button
                                    onClick={() => setView('register')}
                                    className="text-sm text-primary hover:underline text-center"
                                >
                                    没有账号？立即注册
                                </button>
                                <button
                                    onClick={() => setView('forgot')}
                                    className="text-sm text-gray-500 hover:text-primary text-center"
                                >
                                    忘记密码？
                                </button>
                            </div>
                        </>
                    )}

                    {view === 'register' && (
                        <Register onBack={() => setView('login')} />
                    )}

                    {view === 'forgot' && (
                        <ForgotPassword onBack={() => setView('login')} />
                    )}
                </div>
            </div>
        </div>
    );
}

// 注册组件（仅读者）
function Register({ onBack }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        studentId: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }
        if (form.password.length < 6) {
            setError('密码长度不能少于6位');
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch('/api/auth/register/reader', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    studentId: form.studentId || null,
                    password: form.password
                })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '注册失败');
                return;
            }

            // 注册成功后自动登录
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            navigate('/books');
        } catch (err) {
            setError('网络错误，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={onBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4"
            >
                <ArrowLeft className="h-4 w-4" />
                返回登录
            </button>

            <div className="flex flex-col items-center mb-6">
                <h1 className="text-2xl font-bold">读者注册</h1>
                <p className="text-gray-500 mt-1">创建读者账号</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5">姓名</label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="请输入姓名"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">邮箱</label>
                    <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="请输入邮箱"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">学号（可选）</label>
                    <input
                        type="text"
                        value={form.studentId}
                        onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                        placeholder="请输入学号（可选）"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">密码</label>
                    <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="请输入密码（至少6位）"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">确认密码</label>
                    <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        placeholder="请再次输入密码"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary text-white py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            注册中...
                        </>
                    ) : (
                        '注册'
                    )}
                </button>
            </form>
        </>
    );
}

// 忘记密码（仅通过邮箱重置）
function ForgotPassword({ onBack }) {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }
        if (newPassword.length < 6) {
            setError('密码长度不能少于6位');
            return;
        }

        setSubmitting(true);

        try {
            // 调用读者重置密码接口（适用于所有用户，后端会根据邮箱判断角色）
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '密码重置失败');
                return;
            }

            setSuccess(true);
        } catch (err) {
            setError('网络错误，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold mb-2">密码重置成功</h2>
                <p className="text-gray-500 mb-6">请使用新密码登录</p>
                <button
                    onClick={onBack}
                    className="text-primary hover:underline"
                >
                    返回登录
                </button>
            </div>
        );
    }

    return (
        <>
            <button
                onClick={onBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4"
            >
                <ArrowLeft className="h-4 w-4" />
                返回登录
            </button>

            <div className="flex flex-col items-center mb-6">
                <h1 className="text-2xl font-bold">重置密码</h1>
                <p className="text-gray-500 mt-1">通过注册邮箱验证身份</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5">邮箱</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="请输入注册邮箱"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">新密码</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="请输入新密码（至少6位）"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">确认新密码</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="请再次输入新密码"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary text-white py-2.5 rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            处理中...
                        </>
                    ) : (
                        '重置密码'
                    )}
                </button>
            </form>
        </>
    );
}