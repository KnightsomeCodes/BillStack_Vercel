import {
  formatCurrency,
  getMonthKey,
  getMonthLabel,
} from '../utils/billUtils'

function ExpenseAnalytics({ bills = [] }) {
  const totalSpent = bills.reduce(
    (sum, bill) => sum + Number(bill.amount || 0),
    0
  )

  const averageSpend =
    bills.length > 0 ? Math.round(totalSpent / bills.length) : 0

  // Monthly Spending Aggregation
  const monthlyMap = {}

  bills.forEach((bill) => {
    const key = getMonthKey(bill.fullDate || bill.date)
    if (!key) return

    monthlyMap[key] = (monthlyMap[key] || 0) + Number(bill.amount || 0)
  })

  const monthKeys = Object.keys(monthlyMap)
    .sort()
    .slice(-6)

  const monthlyData = monthKeys.map((key) => ({
    key,
    label: getMonthLabel(key),
    amount: monthlyMap[key],
  }))

  const maxMonthlyAmount = Math.max(
    ...monthlyData.map((item) => item.amount),
    1
  )

  // Category Spending Aggregation
  const categoryMap = {}

  bills.forEach((bill) => {
    const category = bill.category || 'Other'
    categoryMap[category] =
      (categoryMap[category] || 0) + Number(bill.amount || 0)
  })

  const categoryData = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  const maxCategoryAmount = Math.max(
    ...categoryData.map((item) => item.amount),
    1
  )

  const highestCategory = categoryData.length > 0 ? categoryData[0] : null

  return (
    <section className="analytics-section" aria-labelledby="analytics-heading">
      <div className="analytics-header">
        <div>
          <span className="section-eyebrow">SPENDING INSIGHTS</span>
          <h2 id="analytics-heading">Monthly Expense Analytics</h2>
          <p className="section-subtitle">
            Track spending velocity, trends, and category distribution over time.
          </p>
        </div>
      </div>

      {/* Mini Summary Cards */}
      <div className="analytics-summary">
        <div className="analytics-mini-card">
          <span className="mini-card-label">Total Spent</span>
          <strong className="mini-card-val">{formatCurrency(totalSpent)}</strong>
          <span className="mini-card-sub">{bills.length} purchases recorded</span>
        </div>

        <div className="analytics-mini-card">
          <span className="mini-card-label">Average Bill</span>
          <strong className="mini-card-val">{formatCurrency(averageSpend)}</strong>
          <span className="mini-card-sub">Per receipt average</span>
        </div>

        <div className="analytics-mini-card">
          <span className="mini-card-label">Top Category</span>
          <strong className="mini-card-val">
            {highestCategory ? highestCategory.category : '—'}
          </strong>
          <span className="mini-card-sub">
            {highestCategory ? `${highestCategory.percentage}% of all spend` : 'No data'}
          </span>
        </div>
      </div>

      {/* Charts Grid: Monthly Bar Chart + Category Breakdown */}
      <div className="charts-grid">
        {/* Monthly Spending Trend Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Monthly Spending Trend</h3>
              <p>Spending timeline over recent active billing cycles</p>
            </div>
          </div>

          {monthlyData.length === 0 ? (
            <div className="chart-empty">
              <span>No monthly spending data recorded yet.</span>
            </div>
          ) : (
            <div className="monthly-chart" role="img" aria-label="Monthly spending bar chart">
              {monthlyData.map((item) => {
                const heightPercentage = Math.max(
                  Math.round((item.amount / maxMonthlyAmount) * 100),
                  8
                )

                return (
                  <div className="bar-column" key={item.key}>
                    <span className="bar-value">{formatCurrency(item.amount)}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ height: `${heightPercentage}%` }}
                        title={`${item.label}: ${formatCurrency(item.amount)}`}
                      />
                    </div>
                    <span className="bar-label">{item.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Category Spending Bars */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Spending by Category</h3>
              <p>Proportional breakdown of your largest expense areas</p>
            </div>
          </div>

          <div className="category-chart">
            {categoryData.length === 0 ? (
              <div className="chart-empty">
                <span>No category spending data available.</span>
              </div>
            ) : (
              categoryData.map((item) => {
                const widthPercentage = (item.amount / maxCategoryAmount) * 100
                const catClass = item.category.toLowerCase().replace(/[^a-z0-9]/g, '-')

                return (
                  <div className="category-row" key={item.category}>
                    <div className="category-row-top">
                      <span className="cat-row-name">
                        <span className={`cat-dot-mini cat-dot-${catClass}`} />
                        {item.category}
                      </span>
                      <strong className="cat-row-amount">
                        {formatCurrency(item.amount)}
                        <span className="cat-row-percent">({item.percentage}%)</span>
                      </strong>
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
    </section>
  )
}

export default ExpenseAnalytics
