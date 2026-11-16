import {
  getWarrantyExpiry,
  getDaysRemaining,
  formatDate,
  getBillWarrantyMonths,
} from '../utils/billUtils'

function WarrantyAlerts({ bills = [], onSelectBill }) {
  const alertBills = bills
    .filter((bill) => {
      const months = getBillWarrantyMonths(bill)
      const returnDays = Number(bill.returnDays || 0)
      return months > 0 || returnDays > 0 || bill.hasWarranty
    })
    .slice(0, 6)

  if (alertBills.length === 0) {
    return null
  }

  return (
    <section className="dashboard-section alerts-section" aria-labelledby="alerts-heading">
      <div className="section-heading-row">
        <div>
          <span className="section-eyebrow">PROTECTION DEADLINES</span>
          <h2 id="alerts-heading">Warranty & Return Alerts</h2>
          <p className="section-subtitle">
            Keep track of upcoming purchase protection and return deadlines.
          </p>
        </div>
      </div>

      <div className="alerts-list">
        {alertBills.map((bill) => {
          const warrantyMonths = getBillWarrantyMonths(bill)
          const warrantyExpiry = getWarrantyExpiry(bill)
          const warrantyDays = getDaysRemaining(warrantyExpiry)
          const catClass = (bill.category || '').toLowerCase().replace(/[^a-z0-9]/g, '-')

          return (
            <div
              className="alert-card"
              key={bill.id}
              onClick={() => onSelectBill && onSelectBill(bill)}
              role={onSelectBill ? 'button' : undefined}
              tabIndex={onSelectBill ? 0 : undefined}
              onKeyDown={(e) => {
                if (onSelectBill && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onSelectBill(bill)
                }
              }}
            >
              <div className="alert-left">
                <div className={`vendor-avatar cat-${catClass}`}>
                  <span>{bill.vendor?.charAt(0)?.toUpperCase() || 'B'}</span>
                </div>

                <div className="alert-meta">
                  <h3>{bill.vendor}</h3>
                  <p>
                    {bill.category} • {formatDate(bill.fullDate || bill.date)}
                  </p>
                </div>
              </div>

              <div className="alert-details">
                {(warrantyMonths > 0 || bill.hasWarranty) && (
                  <span
                    className={`alert-badge ${
                      warrantyDays !== null && warrantyDays < 0
                        ? 'expired'
                        : warrantyDays !== null && warrantyDays <= 30
                        ? 'warning'
                        : 'active'
                    }`}
                  >
                    {warrantyDays !== null && warrantyDays < 0
                      ? 'Warranty Expired'
                      : warrantyDays !== null && warrantyDays <= 30
                      ? `${warrantyDays} days left`
                      : warrantyMonths > 0
                      ? `${warrantyMonths}-mo warranty`
                      : bill.warrantyPeriod || 'Protected'}
                  </span>
                )}

                {bill.returnDays > 0 && (
                  <span className="alert-badge neutral">
                    {bill.returnDays}-day return
                  </span>
                )}
              </div>

              <span className="alert-arrow" aria-hidden="true">
                →
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default WarrantyAlerts
