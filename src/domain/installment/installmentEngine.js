/**
 * GARUDA INSTALLMENT AUTOMATION DOMAIN ENGINE
 * 
 * Core domain calculation layer for offline-first Installment App.
 * Handles:
 * 1. Plan creation & validation
 * 2. Schedule generation (Daily, Weekly, Monthly, Custom)
 * 3. Payment application & remaining balance calculation
 * 4. Daily collection aggregation (Today, Tomorrow, Weekly, Overdue)
 * 5. Invariant reconciliation: SUM(customer due) === daily collection total
 */

function formatCurrency(amount) {
  const num = Math.round(Number(amount) || 0);
  return '₹' + num.toLocaleString('en-IN');
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function addMonths(dateStr, months) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return formatDate(d);
}

/**
 * Calculates and validates an installment plan.
 */
function calculateInstallmentPlan({
  totalAmount,
  downPayment = 0,
  installmentAmount,
  frequency = 'weekly', // 'daily' | 'weekly' | 'monthly' | 'custom'
  customDays = 7,
  startDate = formatDate(new Date())
}) {
  const total = Number(totalAmount) || 0;
  const down = Number(downPayment) || 0;
  const inst = Number(installmentAmount) || 0;

  if (total <= 0) {
    throw new Error('Total amount must be greater than zero');
  }
  if (down < 0) {
    throw new Error('Down payment cannot be negative');
  }
  if (down >= total) {
    throw new Error('Down payment cannot be greater than or equal to total amount');
  }
  if (inst <= 0) {
    throw new Error('Installment amount must be greater than zero');
  }

  const remaining = total - down;
  const numInstallments = Math.ceil(remaining / inst);

  return {
    totalAmount: total,
    downPayment: down,
    remainingAmount: remaining,
    installmentAmount: inst,
    frequency,
    customDays: frequency === 'custom' ? Number(customDays) || 7 : undefined,
    startDate,
    totalInstallments: numInstallments,
    status: 'active'
  };
}

/**
 * Generates exact due dates schedule.
 */
function generateSchedule({
  remainingAmount,
  installmentAmount,
  frequency = 'weekly',
  customDays = 7,
  startDate = formatDate(new Date())
}) {
  const remaining = Number(remainingAmount) || 0;
  const inst = Number(installmentAmount) || 0;
  if (remaining <= 0 || inst <= 0) return [];

  const schedule = [];
  let balance = remaining;
  let installmentNum = 1;
  let currentDate = startDate;

  while (balance > 0) {
    const dueAmount = Math.min(balance, inst);
    let nextDate = currentDate;

    if (installmentNum > 1) {
      if (frequency === 'daily') {
        nextDate = addDays(currentDate, 1);
      } else if (frequency === 'weekly') {
        nextDate = addDays(currentDate, 7);
      } else if (frequency === 'monthly') {
        nextDate = addMonths(currentDate, 1);
      } else if (frequency === 'custom') {
        nextDate = addDays(currentDate, customDays);
      }
    }

    schedule.push({
      installmentNumber: installmentNum,
      dueDate: nextDate,
      expectedAmount: dueAmount,
      paidAmount: 0,
      status: 'pending' // 'pending' | 'partial' | 'paid'
    });

    balance -= dueAmount;
    installmentNum++;
    currentDate = nextDate;
  }

  return schedule;
}

/**
 * Applies a list of payments to a plan to calculate:
 * - total paid
 * - remaining balance
 * - next due date
 * - next installment amount
 * - overdue amount
 * - completion status
 */
function applyPaymentsToPlan(plan, payments = [], currentDate = formatDate(new Date())) {
  const total = Number(plan.totalAmount) || 0;
  const down = Number(plan.downPayment) || 0;
  const inst = Number(plan.installmentAmount) || 0;

  // Total paid from all payments
  const totalPaidTowardsInstallments = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalPaidOverall = down + totalPaidTowardsInstallments;
  const remainingOverall = Math.max(0, total - totalPaidOverall);
  const isCompleted = remainingOverall === 0;

  // Build simulated schedule
  const schedule = generateSchedule({
    remainingAmount: total - down,
    installmentAmount: inst,
    frequency: plan.frequency,
    customDays: plan.customDays,
    startDate: plan.startDate
  });

  // Distribute payments across installments sequentially
  let unallocated = totalPaidTowardsInstallments;
  let overdueAmount = 0;
  let nextDueItem = null;

  for (const item of schedule) {
    if (unallocated >= item.expectedAmount) {
      item.paidAmount = item.expectedAmount;
      item.status = 'paid';
      unallocated -= item.expectedAmount;
    } else if (unallocated > 0) {
      item.paidAmount = unallocated;
      item.status = 'partial';
      unallocated = 0;
    } else {
      item.paidAmount = 0;
      item.status = 'pending';
    }

    const isDueOrPast = item.dueDate <= currentDate;
    const unpaid = item.expectedAmount - item.paidAmount;

    if (unpaid > 0) {
      if (item.dueDate < currentDate) {
        overdueAmount += unpaid;
      }
      if (!nextDueItem) {
        nextDueItem = item;
      }
    }
  }

  // Next due details
  const nextDueDate = nextDueItem ? nextDueItem.dueDate : null;
  const nextDueAmount = nextDueItem ? (nextDueItem.expectedAmount - nextDueItem.paidAmount) : 0;

  return {
    totalAmount: total,
    downPayment: down,
    totalPaid: totalPaidOverall,
    remainingAmount: remainingOverall,
    isCompleted,
    status: isCompleted ? 'completed' : 'active',
    overdueAmount,
    isOverdue: overdueAmount > 0,
    nextDueDate,
    nextDueAmount,
    schedule
  };
}

/**
 * Calculates the Daily Collection Command Center stats.
 * Guarantees that:
 * expectedToday === SUM(individual customer due amounts today)
 */
function calculateDailyCollection({
  customers = [],
  plans = [],
  payments = [],
  targetDate = formatDate(new Date())
}) {
  const tomorrowDate = addDays(targetDate, 1);
  const weekEndDate = addDays(targetDate, 7);

  // Map plans and payments by customerId
  const plansByCust = new Map();
  plans.forEach(p => {
    if (p.status !== 'archived') {
      plansByCust.set(p.customerId, p);
    }
  });

  const paymentsByCust = new Map();
  payments.forEach(pay => {
    const list = paymentsByCust.get(pay.customerId) || [];
    list.push(pay);
    paymentsByCust.set(pay.customerId, list);
  });

  let totalCustomerCount = customers.length;
  let todayExpectedAmount = 0;
  let todayExpectedCustomers = [];

  let tomorrowExpectedAmount = 0;
  let weekExpectedAmount = 0;

  let overdueAmount = 0;
  let overdueCustomers = [];

  let collectedTodayAmount = 0;
  let collectedTodayCount = 0;

  // Process today's payments
  payments.forEach(pay => {
    if (pay.date === targetDate) {
      collectedTodayAmount += (Number(pay.amount) || 0);
      collectedTodayCount++;
    }
  });

  customers.forEach(cust => {
    const plan = plansByCust.get(cust.id);
    if (!plan) return;

    const custPayments = paymentsByCust.get(cust.id) || [];
    const evaluation = applyPaymentsToPlan(plan, custPayments, targetDate);

    if (evaluation.isCompleted) return;

    const nextDate = evaluation.nextDueDate;
    const dueAmount = evaluation.nextDueAmount;

    // Check if customer is due TODAY
    if (nextDate === targetDate) {
      todayExpectedAmount += dueAmount;
      todayExpectedCustomers.push({
        customerId: cust.id,
        name: cust.name,
        phone: cust.phone,
        expectedAmount: dueAmount,
        remainingAmount: evaluation.remainingAmount,
        dueDate: nextDate,
        isOverdue: false
      });
    } else if (nextDate && nextDate < targetDate) {
      // Overdue customer
      overdueAmount += dueAmount;
      overdueCustomers.push({
        customerId: cust.id,
        name: cust.name,
        phone: cust.phone,
        expectedAmount: dueAmount,
        remainingAmount: evaluation.remainingAmount,
        dueDate: nextDate,
        isOverdue: true,
        daysOverdue: Math.max(1, Math.round((new Date(targetDate) - new Date(nextDate)) / (1000 * 60 * 60 * 24)))
      });
    }

    // Check tomorrow
    if (nextDate === tomorrowDate) {
      tomorrowExpectedAmount += dueAmount;
    }

    // Check this week (next 7 days)
    if (nextDate && nextDate >= targetDate && nextDate <= weekEndDate) {
      weekExpectedAmount += dueAmount;
    }
  });

  // Strict reconciliation invariant check
  const sumOfTodayCustomerDues = todayExpectedCustomers.reduce((s, c) => s + c.expectedAmount, 0);
  if (sumOfTodayCustomerDues !== todayExpectedAmount) {
    throw new Error(`Inconsistency detected: todayExpectedAmount (${todayExpectedAmount}) !== sum of customer dues (${sumOfTodayCustomerDues})`);
  }

  return {
    targetDate,
    totalCustomerCount,
    today: {
      expectedAmount: todayExpectedAmount,
      customerCount: todayExpectedCustomers.length,
      customers: todayExpectedCustomers
    },
    overdue: {
      amount: overdueAmount,
      customerCount: overdueCustomers.length,
      customers: overdueCustomers
    },
    tomorrow: {
      expectedAmount: tomorrowExpectedAmount
    },
    thisWeek: {
      expectedAmount: weekExpectedAmount
    },
    collectedToday: {
      amount: collectedTodayAmount,
      count: collectedTodayCount
    }
  };
}

module.exports = {
  formatCurrency,
  formatDate,
  addDays,
  addMonths,
  calculateInstallmentPlan,
  generateSchedule,
  applyPaymentsToPlan,
  calculateDailyCollection
};
