require('dotenv').config();

const prisma = require('./lib/prisma');
const express = require('express');
const cors = require('cors');

// 1. 引入路由文件
const booksRouter = require('./routes/books');
const logsRouter = require('./routes/logs');
const loansRouter = require('./routes/loans');
const authRouter = require('./routes/auth'); // 新增：引入鉴权路由

const app = express();
const port = Number(process.env.PORT) || 3001;

// 必须的中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: "ok", message: "Library API is running" });
});

// 2. 挂载路由
app.use('/books', booksRouter);
app.use('/logs', logsRouter);

// 统一建议使用 /api 前缀，这样和你前端的代码就匹配上了
app.use('/api/loans', loansRouter); 
app.use('/api/auth', authRouter); // 新增：挂载鉴权路由到 /api/auth

// 关闭代码（保留）
async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});