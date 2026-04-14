import React, { useEffect, useState } from 'react';
// 引入 shadcn/ui 组件 (确保之前运行过 npx shadcn@latest add table card badge)
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, AlertCircle } from "lucide-react"; 

const MyHistory = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取数据的函数
  const fetchHistory = async () => {
    try {
      setLoading(true);
      // 获取 Token (假设存放在 localStorage)
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/loans/my-history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("登录已失效，请重新登录");
        throw new Error("无法获取借阅历史记录");
      }

      const data = await response.json();
      setLoans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // 状态标签渲染
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'RETURNED':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none border-none text-xs">已归还</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive" className="text-xs">已逾期</Badge>;
      case 'ON_LOAN':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 shadow-none border-none text-xs">借阅中</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 animate-pulse">正在获取您的借阅足迹...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-500">
        <AlertCircle className="h-10 w-10 mb-2" />
        <p className="font-medium">{error}</p>
        <button 
          onClick={fetchHistory}
          className="mt-4 text-sm text-blue-600 underline"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-white border-b">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-xl font-bold">我的借阅记录</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[30%]">图书详情</TableHead>
                <TableHead>借阅日期</TableHead>
                <TableHead>应还期限</TableHead>
                <TableHead>归还日期</TableHead>
                <TableHead className="text-right">状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.length > 0 ? (
                loans.map((loan) => (
                  <TableRow key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{loan.book.title}</span>
                        <span className="text-xs text-slate-500">{loan.book.author} | ISBN: {loan.book.isbn}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {new Date(loan.checkoutDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 font-medium">
                      {new Date(loan.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString() : <span className="text-slate-300">尚未归还</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {renderStatusBadge(loan.status)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-slate-400">
                    您目前没有任何借阅记录，快去书库挑一本吧！
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="text-xs text-slate-400 text-center">
        * 逾期图书将产生每日罚金，请在应还期限前归还。
      </div>
    </div>
  );
};

export default MyHistory;