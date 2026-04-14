import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Loader2, AlertCircle, User, Briefcase } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ account: '', password: '' });
  const [userType, setUserType] = useState('student');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const credentials = userType === 'student' 
      ? { account: form.account, password: form.password }
      : { employeeId: form.account, password: form.password };

    const result = await login(credentials);

    if (result.success) {
      if (result.user?.role === 'ADMIN' || result.user?.role === 'LIBRARIAN') {
        navigate('/admin/announcements');
      } else {
        navigate('/announcements');
      }
    } else {
      setError(result.error);
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex flex-col items-center mb-8">
            <BookOpen className="h-10 w-10 text-primary mb-3" />
            <h1 className="text-2xl font-bold">图书馆管理系统</h1>
            <p className="text-gray-500 mt-1">请登录您的账号</p>
          </div>

          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setUserType('student')}
              className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors ${
                userType === 'student' 
                  ? 'bg-white shadow-sm text-primary font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="h-4 w-4" />
              读者
            </button>
            <button
              type="button"
              onClick={() => setUserType('librarian')}
              className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors ${
                userType === 'librarian' 
                  ? 'bg-white shadow-sm text-primary font-medium' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              管理员
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="account">
                {userType === 'student' ? '账号' : '工号'}
              </label>
              <input
                id="account"
                type="text"
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                placeholder={userType === 'student' ? '邮箱或学号' : '请输入工号'}
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
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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

          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link to="/announcements" className="text-sm text-primary hover:underline">
              返回公告列表
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
