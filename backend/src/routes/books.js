const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: { id: 'asc' },
      select: {
          id: true,
          title: true,
          author: true,
          available: true,
          shelfLocation: true,
          availableCopies: true,
          totalCopies: true
      },
    });

    res.json({ data: books });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch books',
      detail: error.message,
    });
  }
});

router.get('/:id', async (req, res) => {
  const bookId = Number.parseInt(req.params.id, 10);

  if (Number.isNaN(bookId)) {
    return res.status(400).json({ error: 'Invalid book id' });
  }

  try {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        genre: true,
        description: true,
        language: true,
        shelfLocation: true,
        available: true,
          availableCopies: true,
          totalCopies: true
      },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch book detail',
      detail: error.message,
    });
  }
});

// 删除图书（仅管理员/图书管理员）
router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'LIBRARIAN') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

        // 检查图书是否存在
        const book = await prisma.book.findUnique({ where: { id } });
        if (!book) return res.status(404).json({ message: 'Book not found' });

        // 检查是否有未归还的借阅记录（可选，避免删除有未还记录的图书）
        const activeLoans = await prisma.loan.count({
            where: { bookId: id, returnDate: null }
        });
        if (activeLoans > 0) {
            return res.status(400).json({ message: 'Cannot delete book with active loans' });
        }

        // 删除图书
        await prisma.book.delete({ where: { id } });

        // 审计日志
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'DELETE_BOOK',
                entity: 'Book',
                entityId: id,
                detail: `Deleted book "${book.title}" (ISBN: ${book.isbn})`
            }
        });

        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// 添加图书（仅管理员/图书管理员）
router.post('/', requireAuth, async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'LIBRARIAN') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const {
            title, author, isbn, genre, description,
            language, shelfLocation, totalCopies, availableCopies,
        } = req.body;
        if (!title || !author || !isbn) {
            return res.status(400).json({ message: 'Title, author, and ISBN are required' });
        }
        // 检查 ISBN 是否已存在
        const existing = await prisma.book.findUnique({ where: { isbn } });
        if (existing) {
            return res.status(400).json({ message: 'ISBN already exists' });
        }
        const newBook = await prisma.book.create({
            data: {
                title,
                author,
                isbn,
                genre: genre || '',
                description: description || '',
                language: language || 'English',
                shelfLocation: shelfLocation || '',
                totalCopies: totalCopies || 1,
                availableCopies: availableCopies !== undefined ? availableCopies : (totalCopies || 1),
                available: (availableCopies !== undefined ? availableCopies : (totalCopies || 1)) > 0,
            },
        });
        // 审计日志
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'CREATE_BOOK',
                entity: 'Book',
                entityId: newBook.id,
                detail: `Added book "${title}" (ISBN: ${isbn})`,
            },
        });
        res.status(201).json({ message: 'Book created successfully', book: newBook });
    } catch (error) {
        next(error);
    }
});

// 更新图书（仅管理员/图书管理员）
router.put('/:id', requireAuth, async (req, res, next) => {
    try {
        if (req.user.role !== 'ADMIN' && req.user.role !== 'LIBRARIAN') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });
        const existing = await prisma.book.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ message: 'Book not found' });
        const {
            title, author, isbn, genre, description,
            language, shelfLocation, totalCopies, availableCopies,
        } = req.body;
        // 如果修改了 ISBN，检查是否与其他图书冲突
        if (isbn && isbn !== existing.isbn) {
            const conflict = await prisma.book.findUnique({ where: { isbn } });
            if (conflict) return res.status(400).json({ message: 'ISBN already exists' });
        }
        const updated = await prisma.book.update({
            where: { id },
            data: {
                title: title || existing.title,
                author: author || existing.author,
                isbn: isbn || existing.isbn,
                genre: genre !== undefined ? genre : existing.genre,
                description: description !== undefined ? description : existing.description,
                language: language || existing.language,
                shelfLocation: shelfLocation !== undefined ? shelfLocation : existing.shelfLocation,
                totalCopies: totalCopies !== undefined ? totalCopies : existing.totalCopies,
                availableCopies: availableCopies !== undefined ? availableCopies : existing.availableCopies,
                available: (availableCopies !== undefined ? availableCopies : existing.availableCopies) > 0,
            },
        });
        // 审计日志
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_BOOK',
                entity: 'Book',
                entityId: id,
                detail: `Updated book "${updated.title}" (ISBN: ${updated.isbn})`,
            },
        });
        res.json({ message: 'Book updated successfully', book: updated });
    } catch (error) {
        next(error);
    }
});


module.exports = router;