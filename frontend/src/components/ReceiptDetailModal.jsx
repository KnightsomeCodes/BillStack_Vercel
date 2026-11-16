function ReceiptDetailModal({ bill, isOpen, onClose }) {
  if (!isOpen || !bill) return null

  const isWarrantyItem =
    Boolean(bill.hasWarranty) ||
    Boolean(bill.warrantyPeriod) ||
    (typeof bill.date === 'string' && bill.date.toLowerCase().includes('warranty'))

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="receipt-detail-title">
      <div className="modal-content receipt-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="receipt-brand-badge">
            <span className="vendor-avatar-lg">{bill.vendor?.charAt(0) || 'B'}</span>
            <div>
              <h2 id="receipt-detail-title" className="modal-title">{bill.vendor}</h2>
              <span className="receipt-tag">{bill.category}</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="receipt-hero-amount">
          <span className="currency-symbol">₹</span>
          <span className="amount-number">{bill.amount?.toLocaleString ? bill.amount.toLocaleString('en-IN') : bill.amount}</span>
          <div className="verified-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Verified Purchase</span>
          </div>
        </div>

        <div className={`receipt-spec-table ${isWarrantyItem ? 'warranty-spec-table' : ''}`}>
          <div className="spec-row">
            <span className="spec-label">Purchase Date</span>
            <span className="spec-value">{bill.fullDate || bill.date}</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">Receipt Identifier</span>
            <span className="spec-value code-font">{bill.receiptNumber || 'BS-2024-9102'}</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">Payment Method</span>
            <span className="spec-value">{bill.paymentMethod || 'UPI / Digital'}</span>
          </div>
          <div className="spec-row">
            <span className="spec-label">Category</span>
            <span className="spec-value">{bill.category}</span>
          </div>
          {bill.returnDays > 0 && (
            <div className="spec-row">
              <span className="spec-label">Return Window</span>
              <span className="spec-value">{bill.returnDays} Days</span>
            </div>
          )}
          <div className="spec-row">
            <span className="spec-label">Warranty Status</span>
            <span className="spec-value">
              {isWarrantyItem ? (
                <span className="warranty-pill-active">
                  <span className="status-dot-active"></span>
                  {bill.warrantyPeriod || bill.date}
                </span>
              ) : (
                <span className="warranty-pill-none">Standard Coverage</span>
              )}
            </span>
          </div>
        </div>

        {!isWarrantyItem && (
          <>
            <div className="receipt-paper-cut">
              <div className="paper-tear-edge"></div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  alert(`Receipt for ${bill.vendor} (₹${bill.amount}) exported.`)
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ReceiptDetailModal
