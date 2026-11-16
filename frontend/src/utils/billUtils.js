export function getToday() {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate())
}

/**
 * Parses date string in various formats:
 * - 'YYYY-MM-DD'
 * - 'Sep 12, 2024' or '12 Sep 2024'
 * - 'Today'
 */
export function parseBillDate(dateString) {
  if (!dateString) return null

  if (typeof dateString === 'string' && dateString.trim().toLowerCase() === 'today') {
    return getToday()
  }

  // Check for ISO 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  // Attempt standard Date parsing
  const parsed = new Date(dateString)
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  }

  return null
}

/**
 * Extracts warranty months from either bill.warrantyMonths (number)
 * or bill.warrantyPeriod (e.g. '11 months', '1 year')
 */
export function getBillWarrantyMonths(bill) {
  if (!bill) return 0
  if (typeof bill.warrantyMonths === 'number' && bill.warrantyMonths > 0) {
    return bill.warrantyMonths
  }
  if (typeof bill.warrantyPeriod === 'string') {
    const match = bill.warrantyPeriod.match(/(\d+)\s*(month|yr|year)/i)
    if (match) {
      const val = parseInt(match[1], 10)
      if (match[2].toLowerCase().startsWith('y')) {
        return val * 12
      }
      return val
    }
  }
  return 0
}

export function getWarrantyExpiry(bill) {
  const dateStr = bill?.fullDate || bill?.date
  const months = getBillWarrantyMonths(bill)

  if (!dateStr || months <= 0) {
    return null
  }

  const purchaseDate = parseBillDate(dateStr)
  if (!purchaseDate) return null

  const expiry = new Date(purchaseDate)
  expiry.setMonth(expiry.getMonth() + months)
  return expiry
}

export function getReturnExpiry(bill) {
  const dateStr = bill?.fullDate || bill?.date
  const returnDays = Number(bill?.returnDays || 0)

  if (!dateStr || returnDays <= 0) {
    return null
  }

  const purchaseDate = parseBillDate(dateStr)
  if (!purchaseDate) return null

  const expiry = new Date(purchaseDate)
  expiry.setDate(expiry.getDate() + returnDays)
  return expiry
}

export function getDaysRemaining(targetDate) {
  if (!targetDate) return null
  const today = getToday()
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}

export function getWarrantyStatus(bill) {
  const months = getBillWarrantyMonths(bill)
  if (months <= 0 && !bill?.hasWarranty) {
    return 'none'
  }

  const expiry = getWarrantyExpiry(bill)
  if (!expiry) return bill?.hasWarranty ? 'active' : 'none'

  const daysRemaining = getDaysRemaining(expiry)
  if (daysRemaining < 0) {
    return 'expired'
  }
  if (daysRemaining <= 30) {
    return 'expiring'
  }
  return 'active'
}

export function getReturnStatus(bill) {
  const returnDays = Number(bill?.returnDays || 0)
  if (returnDays <= 0) {
    return 'none'
  }

  const expiry = getReturnExpiry(bill)
  if (!expiry) return 'none'

  const daysRemaining = getDaysRemaining(expiry)
  if (daysRemaining < 0) {
    return 'expired'
  }
  if (daysRemaining <= 3) {
    return 'expiring'
  }
  return 'active'
}

export function formatCurrency(amount) {
  const numeric = Number(amount || 0)
  return `₹${numeric.toLocaleString('en-IN')}`
}

export function formatDate(dateString) {
  if (!dateString) return ''
  const date = parseBillDate(dateString)
  if (!date || Number.isNaN(date.getTime())) {
    return String(dateString)
  }
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export function getMonthKey(dateString) {
  const date = parseBillDate(dateString)
  if (!date) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthLabel(monthKey) {
  if (!monthKey) return ''
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'short'
  })
}

export function getBillNotifications(bills = []) {
  const notifications = []

  bills.forEach((bill) => {
    // 1. Return Period Reminders
    const returnDays = Number(bill.returnDays || 0)
    if (returnDays > 0) {
      const returnExpiry = getReturnExpiry(bill)
      const daysRemaining = getDaysRemaining(returnExpiry)

      if (daysRemaining !== null) {
        if (daysRemaining < 0) {
          notifications.push({
            id: `${bill.id}-return-expired`,
            bill,
            type: 'expired',
            priority: 1,
            badge: 'Return Expired',
            title: `${bill.vendor} — Return window closed`,
            message: `The ${returnDays}-day return period ended on ${formatDate(returnExpiry)}.`,
            date: formatDate(returnExpiry),
          })
        } else if (daysRemaining <= 3) {
          notifications.push({
            id: `${bill.id}-return-warning`,
            bill,
            type: 'warning',
            priority: 2,
            badge: 'Return Ending',
            title: `${bill.vendor} — Return window ending soon`,
            message:
              daysRemaining === 0
                ? 'Today is the final day to return or exchange this item.'
                : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining to return this item.`,
            date: formatDate(returnExpiry),
          })
        }
      }
    }

    // 2. Warranty Expiration Reminders
    const warrantyMonths = getBillWarrantyMonths(bill)
    if (warrantyMonths > 0) {
      const warrantyExpiry = getWarrantyExpiry(bill)
      const daysRemaining = getDaysRemaining(warrantyExpiry)

      if (daysRemaining !== null) {
        if (daysRemaining < 0) {
          notifications.push({
            id: `${bill.id}-warranty-expired`,
            bill,
            type: 'expired',
            priority: 1,
            badge: 'Warranty Expired',
            title: `${bill.vendor} — Manufacturer warranty expired`,
            message: `The ${warrantyMonths}-month warranty ended on ${formatDate(warrantyExpiry)}.`,
            date: formatDate(warrantyExpiry),
          })
        } else if (daysRemaining <= 30) {
          notifications.push({
            id: `${bill.id}-warranty-warning`,
            bill,
            type: 'warning',
            priority: 2,
            badge: 'Expiring Soon',
            title: `${bill.vendor} — Warranty expiring soon`,
            message:
              daysRemaining === 0
                ? 'Warranty coverage expires today.'
                : `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left on coverage. File claims promptly.`,
            date: formatDate(warrantyExpiry),
          })
        }
      }
    }
  })

  // Priority sorting: expired first, then warnings
  notifications.sort((a, b) => a.priority - b.priority)
  return notifications
}

