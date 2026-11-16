function BillCard({ vendor, category, amount, date, onClick, fullBill }) {
  const isWarrantyItem = typeof date === 'string' && date.toLowerCase().includes('warranty')
  
  // Extract category initials/colors
  const categoryClass = (category || '').toLowerCase().replace(/[^a-z0-9]/g, '-')

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick(fullBill || { vendor, category, amount, date })
    }
  }

  return (
    <div
      className={`bill ${isWarrantyItem ? 'bill-warranty-card' : ''}`}
      onClick={() => onClick && onClick(fullBill || { vendor, category, amount, date })}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      onKeyDown={handleKeyDown}
      aria-label={`${vendor}, ${category}, amount ₹${amount}, ${date}`}
    >
      <div className="bill-left">
        <div className={`vendor-avatar cat-${categoryClass}`}>
          <span>{vendor ? vendor.charAt(0).toUpperCase() : 'B'}</span>
        </div>

        <div className="bill-info">
          <div className="bill-title-row">
            <h3 className="bill-vendor">{vendor}</h3>
            {isWarrantyItem && (
              <span className="warranty-tag-inline">
                <span className="warranty-dot"></span>
                Active
              </span>
            )}
          </div>

          <div className="bill-category">
            <span className={`cat-indicator cat-dot-${categoryClass}`}></span>
            <p>{category}</p>
          </div>
        </div>
      </div>

      <div className="bill-amount">
        <strong className="amount-value">₹{amount}</strong>
        <p className={`bill-date ${isWarrantyItem ? 'warranty-highlight' : ''}`}>
          {isWarrantyItem ? (
            <span className="warranty-time-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {date}
            </span>
          ) : (
            date
          )}
        </p>
      </div>
    </div>
  )
}

export default BillCard
