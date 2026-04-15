const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const MAX_BORROW_LIMIT = 3;      // 学生最多借3本
const LOAN_DURATION_DAYS = 30;   // 借期30天
const MAX_LOAN_DAYS = 30;

// ==================== 辅助函数 ====================
async function getCurrentBorrowCount(userId) {
    return await prisma.loan.count({
        where: { userId, returnDate: null }
    });
}

async function hasOverdueLoans(userId) {
    const count = await prisma.loan.count({
        where: {
            userId,
            returnDate: null,
            dueDate: { lt: new Date() }
        }
    });
    return count > 0;
}

// ==================== 读者自助借书 ====================
// POST /api/loans/borrow
router.post('/borrow', requireAuth, async (req, res, next) => {
    try {
        const { bookId, dueDate } = req.body;
        const userId = req.user.id;

        if (!bookId) return res.status(400).json({ message: 'bookId is required' });
        if (!dueDate) return res.status(400).json({ message: 'dueDate is required' });

        const selectedDueDate = new Date(dueDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        const maxDueDate = new Date();
        maxDueDate.setDate(maxDueDate.getDate() + MAX_LOAN_DAYS); // 假设 MAX_LOAN_DURATION_DAYS = 30

        if (selectedDueDate < today) {
            return res.status(400).json({ message: '归还日期不能早于今天' });
        }
        if (selectedDueDate > maxDueDate) {
            return res.status(400).json({ message: `归还日期不能超过${MAX_LOAN_DURATION_DAYS}天` });
        }

        // 查询图书
        const book = await prisma.book.findUnique({
            where: { id: parseInt(bookId) }
        });
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        if (book.availableCopies <= 0) {
            return res.status(400).json({ message: 'No available copies of this book' });
        }

        // 检查是否重复借阅同一本未还
        const existingLoan = await prisma.loan.findFirst({
            where: {
                userId,
                bookId: book.id,
                returnDate: null
            }
        });
        if (existingLoan) {
            return res.status(400).json({ message: 'You have already borrowed this book and not returned' });
        }

        // 检查借阅数量限制（仅对学生生效，管理员/馆员不受限制）
        if (req.user.role === 'STUDENT') {
            const currentCount = await getCurrentBorrowCount(userId);
            if (currentCount >= MAX_BORROW_LIMIT) {
                return res.status(400).json({ message: `You can borrow at most ${MAX_BORROW_LIMIT} books` });
            }
            const hasOverdue = await hasOverdueLoans(userId);
            if (hasOverdue) {
                return res.status(400).json({ message: 'You have overdue books. Please return them first.' });
            }
        }

        // 创建借阅记录
        const checkoutDate = new Date();

        const loan = await prisma.loan.create({
            data: {
                userId,
                bookId: book.id,
                checkoutDate,
                dueDate: selectedDueDate,
                fineAmount: 0,
                finePaid: false,
                fineForgiven: false
            }
        });

        // 减少图书可借副本数
        await prisma.book.update({
            where: { id: book.id },
            data: { availableCopies: { decrement: 1 } }
        });

        // 审计日志
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'BORROW_BOOK',
                entity: 'Loan',
                entityId: loan.id,
                detail: `User ${req.user.email} borrowed "${book.title}". Due date: ${selectedDueDate.toISOString()}`
            }
        });

        res.status(201).json({
            message: 'Book borrowed successfully',
            loan: {
                id: loan.id,
                bookTitle: book.title,
                checkoutDate,
                dueDate
            }
        });
    } catch (error) {
        next(error);
    }
});

//续接书
router.post('/:loanId/renew', requireAuth, async (req, res, next) => {
    try {
        const loanId = parseInt(req.params.loanId);
        const userId = req.user.id;

        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: { book: true }
        });
        if (!loan) return res.status(404).json({ message: 'Loan not found' });
        if (loan.userId !== userId) {
            return res.status(403).json({ message: 'Not your loan' });
        }
        if (loan.returnDate) {
            return res.status(400).json({ message: 'Book already returned' });
        }

        // 检查是否已有未处理的续借申请
        const existingRequest = await prisma.renewalRequest.findFirst({
            where: { loanId, status: 'PENDING' }
        });
        if (existingRequest) {
            return res.status(400).json({ message: 'Renewal request already pending' });
        }

        // 可添加续借次数限制（例如最多1次）
        const approvedCount = await prisma.renewalRequest.count({
            where: { loanId, status: 'APPROVED' }
        });
        if (approvedCount >= 1) {
            return res.status(400).json({ message: 'Renewal limit reached' });
        }

        const request = await prisma.renewalRequest.create({
            data: {
                loanId,
                requestedAt: new Date(),
                status: 'PENDING'
            }
        });

        // 记录审计日志
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'REQUEST_RENEWAL',
                entity: 'RenewalRequest',
                entityId: request.id,
                detail: `User requested renewal for book "${loan.book.title}"`
            }
        });

        res.status(201).json({ message: 'Renewal request submitted', request });
    } catch (error) { next(error); }
});

//管理员同意续接书
router.put('/renewal/:requestId/approve', requireAuth, async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'LIBRARIAN') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const requestId = parseInt(req.params.requestId);
        const { newDueDate } = req.body; // 可选，不传则默认延长30天
        const request = await prisma.renewalRequest.findUnique({
            where: { id: requestId },
            include: { loan: true }
        });
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.status !== 'PENDING') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        let dueDate = newDueDate ? new Date(newDueDate) : new Date(request.loan.dueDate);
        dueDate.setDate(dueDate.getDate() + 30); // 默认延长30天
        const maxDue = new Date();
        maxDue.setDate(maxDue.getDate() + 60); // 最长续借到60天（可根据规则调整）
        if (dueDate > maxDue) dueDate = maxDue;

        // 更新 loan 的 dueDate
        await prisma.loan.update({
            where: { id: request.loanId },
            data: { dueDate }
        });
        // 更新申请状态
        await prisma.renewalRequest.update({
            where: { id: requestId },
            data: {
                status: 'APPROVED',
                approvedAt: new Date(),
                newDueDate: dueDate,
                processedBy: req.user.id
            }
        });
        // 审计日志
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'APPROVE_RENEWAL',
                entity: 'Loan',
                entityId: request.loanId,
                detail: `Admin approved renewal, new due date ${dueDate.toISOString()}`
            }
        });
        res.json({ message: 'Renewal approved', newDueDate: dueDate });
    } catch (error) { next(error); }
});

//管理员获取所有续接申请
router.get('/renewal-requests', requireAuth, async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'LIBRARIAN') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const requests = await prisma.renewalRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                loan: {
                    include: {
                        book: true,
                        user: true
                    }
                }
            },
            orderBy: { requestedAt: 'asc' }
        });
        res.json({ requests });
    } catch (error) { next(error); }
});


// ==================== 读者自助还书 ====================
// PUT /api/loans/:loanId/return
router.put('/:loanId/return', requireAuth, async (req, res, next) => {
    try {
        const loanId = parseInt(req.params.loanId);
        const userId = req.user.id;
        const userRole = req.user.role;

        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: { book: true }
        });
        if (!loan) {
            return res.status(404).json({ message: 'Loan record not found' });
        }

        // 权限检查：只有本人或管理员/馆员可以还书
        if (loan.userId !== userId && userRole !== 'ADMIN' && userRole !== 'LIBRARIAN') {
            return res.status(403).json({ message: 'Not authorized to return this book' });
        }
        if (loan.returnDate) {
            return res.status(400).json({ message: 'Book already returned' });
        }

        const returnDate = new Date();
        // 计算逾期罚款（可选，这里先不自动计算，仅记录）
        let fine = 0;
        if (returnDate > loan.dueDate) {
            const overdueDays = Math.ceil((returnDate - loan.dueDate) / (1000 * 60 * 60 * 24));
            fine = overdueDays * 0.5; // 每天0.5元示例
        }

        // 更新借阅记录
        await prisma.loan.update({
            where: { id: loanId },
            data: {
                returnDate,
                fineAmount: fine > 0 ? fine : 0
            }
        });

        // 增加图书可借副本数
        await prisma.book.update({
            where: { id: loan.bookId },
            data: { availableCopies: { increment: 1 } }
        });

        // 审计日志
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'RETURN_BOOK',
                entity: 'Loan',
                entityId: loanId,
                detail: `User ${req.user.email} returned "${loan.book.title}"${fine > 0 ? ` with fine ${fine}` : ''}`
            }
        });

        res.json({
            message: 'Book returned successfully',
            fineAmount: fine
        });
    } catch (error) {
        next(error);
    }
});

// ==================== 获取当前用户的借阅记录 ====================
// GET /api/loans/my?activeOnly=true
router.get('/my', requireAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const activeOnly = req.query.activeOnly === 'true';
        const where = { userId };
        if (activeOnly) {
            where.returnDate = null;
        }
        const loans = await prisma.loan.findMany({
            where,
            include: { book: true },
            orderBy: { checkoutDate: 'desc' }
        });

        // 在 loans 查询后，添加续借请求信息
        const loansWithRenewal = await Promise.all(loans.map(async (loan) => {
            const renewalRequest = await prisma.renewalRequest.findFirst({
                where: { loanId: loan.id },
                orderBy: { requestedAt: 'desc' }
            });
            return { ...loan, renewalRequest };
        }));
        res.json({ loans: loansWithRenewal });

    } catch (error) {
        next(error);
    }
});

// ==================== 以下为管理员/馆员专用接口 ====================

// 1. 搜索学生（馆员/管理员专用）
router.get('/users/search', requireAuth, async (req, res, next) => {
    try {
        if (req.user.role !== 'LIBRARIAN' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied. Librarian or Admin only.' });
        }

        const { keyword } = req.query;
        if (!keyword || keyword.trim() === '') {
            return res.status(400).json({ message: 'Keyword is required' });
        }

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { studentId: { contains: keyword } },
                    { email: { contains: keyword.toLowerCase() } }
                ],
                role: 'STUDENT'
            },
            select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
                role: true
            },
            take: 20
        });

        const usersWithStatus = await Promise.all(users.map(async (user) => {
            const currentCount = await getCurrentBorrowCount(user.id);
            const hasOverdue = await hasOverdueLoans(user.id);
            return {
                ...user,
                currentBorrowCount: currentCount,
                hasOverdue,
                canBorrow: (currentCount < MAX_BORROW_LIMIT) && !hasOverdue
            };
        }));

        res.json({ users: usersWithStatus });
    } catch (error) {
        next(error);
    }
});

// 2. 搜索图书（馆员/管理员专用）
router.get('/books/search', requireAuth, async (req, res, next) => {
    try {
        if (req.user.role !== 'LIBRARIAN' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied. Librarian or Admin only.' });
        }

        const { keyword } = req.query;
        if (!keyword || keyword.trim() === '') {
            return res.status(400).json({ message: 'Keyword is required' });
        }

        const books = await prisma.book.findMany({
            where: {
                OR: [
                    { title: { contains: keyword } },
                    { isbn: { contains: keyword } }
                ]
            },
            select: {
                id: true,
                title: true,
                author: true,
                isbn: true,
                availableCopies: true,
                totalCopies: true
            },
            take: 20
        });

        res.json({ books });
    } catch (error) {
        next(error);
    }
});

// 3. 馆员/管理员辅助借书（代学生借书）
router.post('/lend', requireAuth, async (req, res, next) => {
    try {
        if (req.user.role !== 'LIBRARIAN' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied. Librarian or Admin only.' });
        }

        const { userId, bookId } = req.body;
        if (!userId || !bookId) {
            return res.status(400).json({ message: 'userId and bookId are required' });
        }

        const student = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });
        if (!student || student.role !== 'STUDENT') {
            return res.status(404).json({ message: 'Student not found' });
        }

        const book = await prisma.book.findUnique({
            where: { id: parseInt(bookId) }
        });
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }
        if (book.availableCopies <= 0) {
            return res.status(400).json({ message: 'No available copies of this book' });
        }

        const existingLoan = await prisma.loan.findFirst({
            where: {
                userId: student.id,
                bookId: book.id,
                returnDate: null
            }
        });
        if (existingLoan) {
            return res.status(400).json({ message: 'Student already borrowed this book and not returned' });
        }

        const currentCount = await getCurrentBorrowCount(student.id);
        if (currentCount >= MAX_BORROW_LIMIT) {
            return res.status(400).json({ message: `Student has already borrowed ${MAX_BORROW_LIMIT} books. Cannot lend more.` });
        }
        const hasOverdue = await hasOverdueLoans(student.id);
        if (hasOverdue) {
            return res.status(400).json({ message: 'Student has overdue books. Please return them first.' });
        }

        const checkoutDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + LOAN_DURATION_DAYS);

        const loan = await prisma.loan.create({
            data: {
                userId: student.id,
                bookId: book.id,
                checkoutDate,
                dueDate,
                fineAmount: 0,
                finePaid: false,
                fineForgiven: false
            }
        });

        await prisma.book.update({
            where: { id: book.id },
            data: { availableCopies: { decrement: 1 } }
        });

        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'LEND_BOOK',
                entity: 'Loan',
                entityId: loan.id,
                detail: `Librarian ${req.user.email} lent "${book.title}" to student ${student.email}. Due date: ${dueDate.toISOString()}`
            }
        });

        res.status(201).json({
            message: 'Book lent successfully',
            loan: {
                id: loan.id,
                bookTitle: book.title,
                studentName: student.name,
                checkoutDate,
                dueDate
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;