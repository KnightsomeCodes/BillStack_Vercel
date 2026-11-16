import { useState } from 'react'
import {
  formatCurrency,
  getMonthKey,
  getMonthLabel,
  formatDate,
} from '../utils/billUtils'

function AnalyticsPage({ bills = [], onSelectBill }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('all') // 'all' | 'recent'

  // Filter bills if timeframe selected
  const activeBills = bills

  // Core Financial Aggregations
  const totalSpent = activeBills.reduce(
    (sum, bill) => sum + Number(bill.amount || 0),
    0
  )

  const averageSpend =
    activeBills.length > 0 ? Math.round(totalSpent / activeBills.length) : 0

  // Largest Single Purchase
  const largestPurchase = activeBills.length > 0
    ? [...activeBills].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0]
    : null

  // Monthly Spending Aggregation
  const monthlyMap = {}
  activeBills.forEach((bill) => {
    const key = getMonthKey(bill.fullDate || bill.date)
    if (!key) return
    monthlyMap[key] = (monthlyMap[key] || 0) + Number(bill.amount || 0)
  })

  const sortedMonthKeys = Object.keys(monthlyMap).sort()
  const displayMonthKeys = selectedTimeframe === 'recent'
    ? sortedMonthKeys.slice(-4)
    : sortedMonthKeys.slice(-6)

  const monthlyData = displayMonthKeys.map((key) => ({
    key,
    label: getMonthLabel(key),
    amount: monthlyMap[key],
  }))

  const maxMonthlyAmount = Math.max(
    ...monthlyData.map((item) => item.amount),
    1
  )

  // Month-over-month calculation (last 2 months)
  let monthOverMonthChange = null
  if (sortedMonthKeys.length >= 2) {
    const lastKey = sortedMonthKeys[sortedMonthKeys.length - 1]
    const prevKey = sortedMonthKeys[sortedMonthKeys.length - 2]
    const lastAmount = monthlyMap[lastKey] || 0
    const prevAmount = monthlyMap[prevKey] || 0
    if (prevAmount > 0) {
      const diff = Math.round(((lastAmount - prevAmount) / prevAmount) * 100)
      monthOverMonthChange = diff
    }
  }

  // Category Spending Aggregation
  const categoryMap = {}
  const categoryCountMap = {}

  activeBills.forEach((bill) => {
    const category = bill.category || 'General'
    categoryMap[category] =
      (categoryMap[category] || 0) + Number(bill.amount || 0)
    categoryCountMap[category] = (categoryCountMap[category] || 0) + 1
  })

  const categoryData = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      count: categoryCountMap[category] || 0,
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  const maxCategoryAmount = Math.max(
    ...categoryData.map((item) => item.amount),
    1
  )

  const highestCategory = categoryData.length > 0 ? categoryData[0] : null

  // Merchant Spending Aggregation (Top Vendors)
  const vendorMap = {}
  activeBills.forEach((bill) => {
    const vendor = bill.vendor || 'Unknown'
    vendorMap[vendor] = (vendorMap[vendor] || 0) + Number(bill.amount || 0)
  })

  const topVendors = Object.entries(vendorMap)
    .map(([vendor, amount]) => ({
      vendor,
      amount,
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4)

  return (
    <div className="analytics-page page-container">
      {/* Page Header */}
      <div className="section-header analytics-page-header">
        <div>
          <span className="section-eyebrow">FINANCIAL INTELLIGENCE</span>
          <h2>Expense Analytics & Insights</h2>
          <p className="page-subheading">
            Comprehensive overview of consumer expenditures, category allocations, and monthly trends.
          </p>
        </div>

        <div className="timeframe-toggle-pills" role="tablist" aria-label="Select timeframe">
          <button
            type="button"
            className={`filter-pill ${selectedTimeframe === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('all')}
          >
            All Time
          </button>
          <button
            type="button"
            className={`filter-pill ${selectedTimeframe === 'recent' ? 'active' : ''}`}
            onClick={() => setSelectedTimeframe('recent')}
          >
            Recent Cycles
          </button>
        </div>
      </div>

      {/* KPI Metric Overview Cards (Spacious 4-grid) */}
      <div className="analytics-kpi-grid">
        <div className="analytics-kpi-card kpi-primary">
          <div className="kpi-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Expenditure</span>
            <div className="kpi-val-row">
              <strong className="kpi-val">{formatCurrency(totalSpent)}</strong>
            </div>
            <span className="kpi-subtext">Across {activeBills.length} recorded receipts</span>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-icon-wrap icon-blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Average per Receipt</span>
            <div className="kpi-val-row">
              <strong className="kpi-val">{formatCurrency(averageSpend)}</strong>
            </div>
            <span className="kpi-subtext">Mean transaction value</span>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-icon-wrap icon-emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Top Spending Category</span>
            <div className="kpi-val-row">
              <strong className="kpi-val">
                {highestCategory ? highestCategory.category : '—'}
              </strong>
            </div>
            <span className="kpi-subtext">
              {highestCategory
                ? `${formatCurrency(highestCategory.amount)} (${highestCategory.percentage}%)`
                : 'No data recorded'}
            </span>
          </div>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-icon-wrap icon-amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Largest Single Purchase</span>
            <div className="kpi-val-row">
              <strong className="kpi-val">
                {largestPurchase ? formatCurrency(largestPurchase.amount) : '—'}
              </strong>
            </div>
            <span className="kpi-subtext">
              {largestPurchase
                ? `${largestPurchase.vendor} • ${formatDate(largestPurchase.fullDate || largestPurchase.date)}`
                : 'No purchases'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Split */}
      <div className="analytics-charts-container">
        {/* Monthly Trend Card (Spacious Bar Chart) */}
        <div className="analytics-chart-card monthly-deepdive-card">
          <div className="chart-header-row">
            <div>
              <h3>Monthly Spending Velocity</h3>
              <p>Purchases grouped by calendar month over active billing cycles</p>
            </div>
            {monthOverMonthChange !== null && (
              <span className={`trend-badge ${monthOverMonthChange <= 0 ? 'trend-down' : 'trend-up'}`}>
                {monthOverMonthChange > 0 ? `+${monthOverMonthChange}%` : `${monthOverMonthChange}%`} vs prior cycle
              </span>
            )}
          </div>

          {monthlyData.length === 0 ? (
            <div className="chart-empty-state">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p>No monthly spending recorded yet.</p>
            </div>
          ) : (
            <div className="spacious-monthly-chart" role="img" aria-label="Monthly spending bar chart">
              {monthlyData.map((item) => {
                const heightPercentage = Math.max(
                  Math.round((item.amount / maxMonthlyAmount) * 100),
                  10
                )

                return (
                  <div className="spacious-bar-col" key={item.key}>
                    <span className="spacious-bar-val">{formatCurrency(item.amount)}</span>
                    <div className="spacious-bar-track">
                      <div
                        className="spacious-bar-fill"
                        style={{ height: `${heightPercentage}%` }}
                        title={`${item.label}: ${formatCurrency(item.amount)}`}
                      />
                    </div>
                    <span className="spacious-bar-lbl">{item.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Monthly Breakdown Table / Summary Strip */}
          {monthlyData.length > 0 && (
            <div className="monthly-stats-strip">
              {monthlyData.map((item) => (
                <div key={item.key} className="monthly-mini-stat">
                  <span className="mini-lbl">{item.label}</span>
                  <strong className="mini-val">{formatCurrency(item.amount)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown Card */}
        <div className="analytics-chart-card category-deepdive-card">
          <div className="chart-header-row">
            <div>
              <h3>Category Allocation</h3>
              <p>Percentage share of total consumer expenditure</p>
            </div>
            <span className="section-count">{categoryData.length} categories</span>
          </div>

          <div className="category-deepdive-list">
            {categoryData.length === 0 ? (
              <div className="chart-empty-state">
                <p>No category spending data available.</p>
              </div>
            ) : (
              categoryData.map((item) => {
                const widthPercentage = (item.amount / maxCategoryAmount) * 100
                const catClass = item.category.toLowerCase().replace(/[^a-z0-9]/g, '-')

                return (
                  <div className="category-deepdive-row" key={item.category}>
                    <div className="cat-deepdive-header">
                      <div className="cat-title-group">
                        <span className={`cat-avatar-dot cat-dot-${catClass}`} />
                        <strong className="cat-title">{item.category}</strong>
                        <span className="cat-count-pill">{item.count} bill{item.count > 1 ? 's' : ''}</span>
                      </div>
                      <div className="cat-value-group">
                        <strong className="cat-sum">{formatCurrency(item.amount)}</strong>
                        <span className="cat-pct">{item.percentage}%</span>
                      </div>
                    </div>

                    <div className="category-track">
                      <div
                        className={`category-fill fill-${catClass}`}
                        style={{ width: `${widthPercentage}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Merchants & Key Purchase Highlights */}
      <div className="analytics-secondary-grid">
        <div className="analytics-chart-card">
          <div className="chart-header-row">
            <div>
              <h3>Top Merchant Outlets</h3>
              <p>Stores where you spend the highest volume</p>
            </div>
          </div>

          <div className="top-merchants-list">
            {topVendors.length === 0 ? (
              <p className="empty-subtext">No merchant data available.</p>
            ) : (
              topVendors.map((v, idx) => (
                <div className="merchant-row" key={v.vendor}>
                  <div className="merchant-left">
                    <span className="merchant-rank">#{idx + 1}</span>
                    <strong className="merchant-name">{v.vendor}</strong>
                  </div>
                  <div className="merchant-right">
                    <strong className="merchant-val">{formatCurrency(v.amount)}</strong>
                    <span className="merchant-pct">{v.percentage}% of total</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="analytics-chart-card">
          <div className="chart-header-row">
            <div>
              <h3>Recent Significant Receipts</h3>
              <p>Highest value purchases recorded in vault</p>
            </div>
          </div>

          <div className="top-receipts-list">
            {[...activeBills]
              .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
              .slice(0, 3)
              .map((b) => (
                <div
                  className="significant-receipt-item"
                  key={b.id}
                  onClick={() => onSelectBill && onSelectBill(b)}
                  role={onSelectBill ? 'button' : undefined}
                  tabIndex={onSelectBill ? 0 : undefined}
                >
                  <div className="receipt-item-left">
                    <span className="vendor-avatar-sm">{b.vendor?.charAt(0) || 'B'}</span>
                    <div>
                      <strong>{b.vendor}</strong>
                      <p>{b.category} • {formatDate(b.fullDate || b.date)}</p>
                    </div>
                  </div>
                  <strong className="receipt-item-amount">{formatCurrency(b.amount)}</strong>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
