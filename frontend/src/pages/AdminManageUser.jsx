import { useState, useEffect } from 'react';

function AdminManageUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    role: 'STUDENT'
  });

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const res = await fetch(`http://localhost:3001/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setUsers(data);
      } else {
        setError(data.error || '获取用户失败');
      }
    } catch (err) {
      setError('无法连接到服务器');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingUser 
        ? `http://localhost:3001/api/users/${editingUser.id}`
        : 'http://localhost:3001/api/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', studentId: '', role: 'STUDENT' });
        fetchUsers();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('操作失败');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      studentId: user.studentId || '',
      role: user.role
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!confirm('确定要删除此用户吗？')) return;

    try {
      const res = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        fetchUsers();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('删除失败');
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', studentId: '', role: 'STUDENT' });
    setShowModal(true);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>用户管理</h1>
        <button onClick={openAddModal} style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          + 新增用户
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="搜索姓名、邮箱、学号..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px', width: '300px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="">全部角色</option>
          <option value="STUDENT">学生</option>
          <option value="LIBRARIAN">图书馆员</option>
          <option value="ADMIN">管理员</option>
        </select>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {loading ? (
        <div>加载中...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>姓名</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>邮箱</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>学号</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>角色</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>创建时间</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>暂无数据</td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{user.id}</td>
                <td style={{ padding: '10px' }}>{user.name}</td>
                <td style={{ padding: '10px' }}>{user.email}</td>
                <td style={{ padding: '10px' }}>{user.studentId || '-'}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    background: user.role === 'ADMIN' ? '#dc2626' : user.role === 'LIBRARIAN' ? '#7c3aed' : '#10b981',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {user.role === 'ADMIN' ? '管理员' : user.role === 'LIBRARIAN' ? '图书馆员' : '学生'}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => handleEdit(user)} style={{ marginRight: '8px', padding: '4px 12px', cursor: 'pointer' }}>编辑</button>
                  <button onClick={() => handleDelete(user.id)} style={{ padding: '4px 12px', color: 'red', cursor: 'pointer' }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '400px'
          }}>
            <h2>{editingUser ? '编辑用户' : '新增用户'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>姓名 *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>邮箱 *</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  密码 {editingUser ? '(留空不变)' : '*'}
                </label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>学号</label>
                <input 
                  type="text" 
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>角色</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="STUDENT">学生</option>
                  <option value="LIBRARIAN">图书馆员</option>
                  <option value="ADMIN">管理员</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  保存
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManageUser;
