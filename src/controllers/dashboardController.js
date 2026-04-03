import { prisma } from '../config/db.js';
import { parseISODate } from '../utils/parseQuery.js';

function summarizeWhere(query) {
  const where = { deletedAt: null };
  const from = parseISODate(query.from);
  const to = parseISODate(query.to);
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = from;
    if (to) where.date.lte = to;
  }
  return where;
}

function num(v) {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function serializeRecent(row) {
  return {
    id: row.id,
    amount: num(row.amount),
    type: row.type,
    category: row.category,
    date: row.date,
    notes: row.notes,
    createdAt: row.createdAt,
    createdBy: row.createdBy,
  };
}

export const getSummary = async (req, res) => {
  try {
    const where = summarizeWhere(req.query);

    const [incomeAgg, expenseAgg, byCategory, recentRows] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.financialRecord.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.financialRecord.groupBy({
        by: ['category', 'type'],
        where,
        _sum: { amount: true },
      }),
      prisma.financialRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(50, Math.max(1, Number.parseInt(req.query.recentLimit, 10) || 10)),
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
        },
      }),
    ]);

    const totalIncome = num(incomeAgg._sum.amount);
    const totalExpenses = num(expenseAgg._sum.amount);
    const netBalance = totalIncome - totalExpenses;

    const categoryTotals = {};
    for (const row of byCategory) {
      const key = row.category;
      if (!categoryTotals[key]) {
        categoryTotals[key] = { category: key, income: 0, expense: 0, net: 0 };
      }
      const slice = categoryTotals[key];
      const sum = num(row._sum.amount);
      if (row.type === 'INCOME') slice.income += sum;
      else slice.expense += sum;
      slice.net = slice.income - slice.expense;
    }

    return res.json({
      data: {
        totals: {
          totalIncome,
          totalExpenses,
          netBalance,
          incomeTransactionCount: incomeAgg._count,
          expenseTransactionCount: expenseAgg._count,
        },
        categoryBreakdown: Object.values(categoryTotals),
        recentActivity: recentRows.map(serializeRecent),
      },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to build summary', details: e.message });
  }
};

function monthKeyUTC(d) {
  const x = new Date(d);
  const y = x.getUTCFullYear();
  const m = String(x.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function isoWeekKeyUTC(d) {
  const t = new Date(d);
  const date = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  const y = date.getUTCFullYear();
  return `${y}-W${String(weekNo).padStart(2, '0')}`;
}

export const getTrends = async (req, res) => {
  try {
    const granularity = req.query.granularity ?? req.query.period;
    const g = granularity === 'week' ? 'week' : 'month';

    const where = summarizeWhere(req.query);

    const rows = await prisma.financialRecord.findMany({
      where,
      select: { date: true, type: true, amount: true },
    });

    const buckets = new Map();

    for (const row of rows) {
      const key = g === 'week' ? isoWeekKeyUTC(new Date(row.date)) : monthKeyUTC(new Date(row.date));
      if (!buckets.has(key)) {
        buckets.set(key, {
          period: key,
          granularity: g,
          income: 0,
          expense: 0,
          net: 0,
          count: 0,
        });
      }
      const b = buckets.get(key);
      const a = num(row.amount);
      if (row.type === 'INCOME') b.income += a;
      else b.expense += a;
      b.net = b.income - b.expense;
      b.count += 1;
    }

    const series = [...buckets.values()].sort((a, b) => a.period.localeCompare(b.period));

    return res.json({ data: { granularity: g, series } });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to build trends', details: e.message });
  }
};
