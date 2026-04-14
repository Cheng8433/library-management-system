import MyHistory from './reader/MyHistory'; // 确保路径对应你刚才创建的文件夹
import './App.css';

function App() {
  return (
    // min-h-screen 确保背景色铺满全屏，bg-slate-100 是浅灰色背景
    <div className="min-h-screen bg-slate-100">
      
      {/* 顶部导航栏 - 这里可以根据喜好改颜色，比如 blue-700 */}
      <nav className="bg-blue-700 text-white shadow-lg p-4 mb-8">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-black italic tracking-tighter">LIB-SYS</span>
            <span className="border-l pl-2 font-light text-blue-100">读者大厅</span>
          </div>
          
          <div className="flex space-x-6 text-sm font-medium">
            <span className="cursor-pointer hover:text-blue-200 transition-colors">图书检索</span>
            <span className="cursor-pointer border-b-2 border-white pb-1">我的借阅</span>
            <span className="cursor-pointer hover:text-blue-200 transition-colors">个人中心</span>
          </div>
        </div>
      </nav>

      {/* 主体内容区域 - 控制最大宽度并在中间显示 */}
      <main className="container mx-auto px-4 max-w-5xl">
        {/* 核心功能组件 */}
        <MyHistory />
      </main>
      
      {/* 页脚 */}
      <footer className="mt-20 py-6 border-t border-slate-200 text-center text-slate-400 text-xs">
        &copy; {new Date().getFullYear()} 图书馆管理系统 - 借阅管理模块
      </footer>
    </div>
  );
}

export default App;