import { prisma } from '../config/db.js';
import { parsePagination, parseISODate } from '../utils/parseQuery.js';

function serializeRecord(row) {
  if (!row) return row;
  const { amount, ...rest } = row;
  return {
    ...rest,
    amount: amount != null ? Number(amount) : null,
  };
}

function buildWhere(query) {
  const where = { deletedAt: null };

  const type = query.type;
  if (type && type !== '') {
    if (type !== 'INCOME' && type !== 'EXPENSE') {
      throw Object.assign(new Error('type must be INCOME or EXPENSE'), { statusCode: 400 });
    }
    where.type = type;
  }

  const category = query.category;
  if (category && category !== '') {
    where.category = category;
  }

  const from = parseISODate(query.from);
  const to = parseISODate(query.to);
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }

  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search) {
    where.OR = [
      { notes: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export const listRecords = async (req, res) => {
  try {
    let where;
    try {
      where = buildWhere(req.query);
    } catch (e) {
      return res.status(e.statusCode || 400).json({ error: 'Validation failed', message: e.message });
    }

    const { page, limit, skip } = parsePagination(req.query);

    const [rows, total] = await Promise.all([
      prisma.financialRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          createdBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.financialRecord.count({ where }),
    ]);

    return res.json({
      data: rows.map(serializeRecord),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to list records', details: e.message });
  }
};

export const getRecord = async (req, res) => {
  try {
    const row = await prisma.financialRecord.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!row) {
      return res.status(404).json({ error: 'Not found', message: 'Record not found' });
    }
    return res.json({ data: serializeRecord(row) });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to get record', details: e.message });
  }
};

export const createRecord = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    if (amount == null || type == null || !category || !date) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'amount, type, category, and date are required',
      });
    }

    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'amount must be a positive number',
      });
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'type must be INCOME or EXPENSE',
      });
    }

    const d = parseISODate(date);
    if (!d) {
      return res.status(400).json({ error: 'Validation failed', message: 'Invalid date' });
    }

    const row = await prisma.financialRecord.create({
      data: {
        amount: num,
        type,
        category: String(category).trim(),
        date: d,
        notes: notes != null ? String(notes) : null,
        createdById: req.user.id,
      },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    return res.status(201).json({ message: 'Record created', data: serializeRecord(row) });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create record', details: e.message });
  }
};

export const updateRecord = async (req, res) => {
  try {
    const existing = await prisma.financialRecord.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Not found', message: 'Record not found' });
    }

    const { amount, type, category, date, notes } = req.body;
    const data = {};

    if (amount !== undefined) {
      const num = Number(amount);
      if (!Number.isFinite(num) || num <= 0) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'amount must be a positive number',
        });
      }
      data.amount = num;
    }

    if (type !== undefined) {
      if (type !== 'INCOME' && type !== 'EXPENSE') {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'type must be INCOME or EXPENSE',
        });
      }
      data.type = type;
    }

    if (category !== undefined) {
      if (!String(category).trim()) {
        return res.status(400).json({ error: 'Validation failed', message: 'category cannot be empty' });
      }
      data.category = String(category).trim();
    }

    if (date !== undefined) {
      const d = parseISODate(date);
      if (!d) {
        return res.status(400).json({ error: 'Validation failed', message: 'Invalid date' });
      }
      data.date = d;
    }

    if (notes !== undefined) {
      data.notes = notes === null || notes === '' ? null : String(notes);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Validation failed', message: 'No valid fields to update' });
    }

    const row = await prisma.financialRecord.update({
      where: { id: req.params.id },
      data,
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });

    return res.json({ message: 'Record updated', data: serializeRecord(row) });
  } catch (e) {
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Not found', message: 'Record not found' });
    }
    return res.status(500).json({ error: 'Failed to update record', details: e.message });
  }
};

export const deleteRecord = async (req, res) => {
  try {
    const result = await prisma.financialRecord.updateMany({
      where: { id: req.params.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Not found', message: 'Record not found' });
    }
    return res.status(204).send();
  } catch (e) {
    return res.status(500).json({ error: 'Failed to delete record', details: e.message });
  }
};
