import { useState, useEffect } from 'react'

function ScanBillModal({ isOpen, onClose, onAddBill }) {
  const [isScanning, setIsScanning] = useState(true)
  const [scannedBill, setScannedBill] = useState(null)

  const handleClose = () => {
    setIsScanning(true)
    setScannedBill(null)
    onClose()
  }

  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      setIsScanning(false)
      setScannedBill({
        id: `bill-${Date.now()}`,
        vendor: 'Apple Store',
        category: 'Electronics',
        amount: 4900,
        formattedAmount: '4,900',
        date: 'Today',
        fullDate: new Date().toISOString().split('T')[0],
        hasWarranty: true,
        warrantyPeriod: '12 months',
        warrantyMonths: 12,
        returnDays: 14,
        warrantyExpiry: 'Oct 2025',
        warrantyStatus: 'active',
        status: 'Verified',
        receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        paymentMethod: 'UPI'
      })
    }, 1400)

    return () => clearTimeout(timer)
  }, [isOpen])

  if (!isOpen) return null

  const handleRescan = () => {
    setIsScanning(true)
    setScannedBill(null)
    setTimeout(() => {
      setIsScanning(false)
      setScannedBill({
        id: `bill-${Date.now()}`,
        vendor: 'Apple Store',
        category: 'Electronics',
        amount: 4900,
        formattedAmount: '4,900',
        date: 'Today',
        fullDate: new Date().toISOString().split('T')[0],
        hasWarranty: true,
        warrantyPeriod: '12 months',
        warrantyMonths: 12,
        returnDays: 14,
        warrantyExpiry: 'Oct 2025',
        warrantyStatus: 'active',
        status: 'Verified',
        receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        paymentMethod: 'UPI'
      })
    }, 1400)
  }

  const handleSave = () => {
    if (scannedBill) {
      onAddBill(scannedBill)
      handleClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="scan-bill-title">
      <div className="modal-content scan-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="scan-bill-title" className="modal-title">Scan Bill</h2>
            <p className="modal-subtitle">Instant receipt scanner & smart OCR</p>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {isScanning ? (
          <div className="scan-simulator">
            <div className="scanner-frame">
              <div className="scanner-line"></div>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M7 8h10" />
                <path d="M7 12h10" />
                <path d="M7 16h6" />
              </svg>
            </div>
            <p className="scanner-text">Scanning receipt data with smart OCR...</p>
          </div>
        ) : (
          scannedBill && (
            <div className="scan-results-container">
              <div className="scan-success-banner">
                <div className="scan-success-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <strong>Receipt Captured Successfully</strong>
                  <p>Smart OCR extracted merchant and purchase details</p>
                </div>
              </div>

              <div className="scan-preview-card">
                <div className="scan-preview-row">
                  <span className="scan-label">Merchant</span>
                  <span className="scan-val font-bold">{scannedBill.vendor}</span>
                </div>
                <div className="scan-preview-row">
                  <span className="scan-label">Amount</span>
                  <span className="scan-val amount-highlight">₹{scannedBill.formattedAmount}</span>
                </div>
                <div className="scan-preview-row">
                  <span className="scan-label">Category</span>
                  <span className="scan-val">{scannedBill.category}</span>
                </div>
                <div className="scan-preview-row">
                  <span className="scan-label">Date</span>
                  <span className="scan-val">{scannedBill.date}</span>
                </div>
                <div className="scan-preview-row">
                  <span className="scan-label">Warranty</span>
                  <span className="scan-val warranty-tag-inline">
                    <span className="warranty-dot"></span>
                    {scannedBill.warrantyPeriod} Coverage
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleRescan}>
                  Rescan
                </button>
                <button type="button" className="btn-primary" onClick={handleSave}>
                  Save Receipt
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default ScanBillModal
