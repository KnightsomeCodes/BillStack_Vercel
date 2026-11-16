import { useState, useRef } from 'react'

function AddBillModal({ isOpen, onClose, onAddBill, initialMode = 'upload' }) {
  const [mode, setMode] = useState(initialMode)
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Electronics')
  const [date, setDate] = useState('Today')
  const [hasWarranty, setHasWarranty] = useState(false)
  const [warrantyPeriod, setWarrantyPeriod] = useState('12 months')
  const [returnDays, setReturnDays] = useState('')
  const [fileName, setFileName] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractStatus, setExtractStatus] = useState(null) // 'success' | 'fallback' | null
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleFileChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  setFileName(file.name)
  setIsExtracting(true)
  setExtractStatus(null)

  const formData = new FormData()
  formData.append('bill', file)

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || `Upload failed (${response.status})`)
    }

    const ext = result.extractedData || {}

    if (ext.vendor) {
      setVendor(ext.vendor)
    } else if (!vendor) {
      const cleanName = file.name.split('.')[0].replace(/[-_]/g, ' ')
      setVendor(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
    }

    if (ext.numericAmount > 0) {
      setAmount(String(ext.numericAmount))
    } else if (ext.totalAmount) {
      const num = String(ext.totalAmount).replace(/[^0-9.]/g, '')
      if (num) setAmount(num)
    }

    if (ext.category) {
      const cat = ext.category.toLowerCase()

      if (cat.includes('food') || cat.includes('dine') || cat.includes('rest')) setCategory('Food')
      else if (cat.includes('groc') || cat.includes('super')) setCategory('Groceries')
      else if (cat.includes('elec') || cat.includes('tech') || cat.includes('gadg')) setCategory('Electronics')
      else if (cat.includes('fash') || cat.includes('cloth') || cat.includes('wear')) setCategory('Fashion')
      else if (cat.includes('health') || cat.includes('pharm') || cat.includes('med')) setCategory('Health')
      else if (cat.includes('trav') || cat.includes('fuel') || cat.includes('transport')) setCategory('Travel')
      else setCategory('Other')
    }

    if (ext.date) setDate(ext.date)

    if (ext.warranty?.trim()) {
      setHasWarranty(true)
      setWarrantyPeriod(ext.warranty.trim())
    }

    if (ext.returnPolicy) {
      const parsedDays = parseInt(ext.returnPolicy.replace(/[^0-9]/g, ''), 10)
      if (!isNaN(parsedDays) && parsedDays > 0) {
        setReturnDays(String(parsedDays))
      }
    }

    setExtractStatus('success')

  } catch (err) {
    console.error('Receipt extraction failed:', err.message)

    setExtractStatus('fallback')

    if (!vendor) {
      const cleanName = file.name.split('.')[0].replace(/[-_]/g, ' ')
      setVendor(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
    }

  } finally {
    setIsExtracting(false)
  }
}

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!vendor.trim() || !amount.trim()) return

    const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0
    const formattedAmount = numericAmount.toLocaleString('en-IN')
    const parsedWarrantyMonths = hasWarranty ? parseInt(warrantyPeriod, 10) || 12 : 0
    const parsedReturnDays = parseInt(returnDays, 10) || 0

    const newBill = {
      id: `bill-${Date.now()}`,
      vendor: vendor.trim(),
      category: category || 'General',
      amount: numericAmount,
      formattedAmount,
      date: date || 'Today',
      fullDate: new Date().toISOString().split('T')[0],
      hasWarranty,
      warrantyPeriod: hasWarranty ? warrantyPeriod : null,
      warrantyMonths: parsedWarrantyMonths,
      returnDays: parsedReturnDays,
      warrantyExpiry: hasWarranty ? 'Oct 2025' : null,
      warrantyStatus: hasWarranty ? 'active' : null,
      status: 'Verified',
      receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentMethod: 'UPI'
    }

    onAddBill(newBill)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="add-bill-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="add-bill-title" className="modal-title">Add Purchase Receipt</h2>
            <p className="modal-subtitle">Keep your receipts organized and track warranties</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tab switch */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab ${mode === 'upload' ? 'active' : ''}`}
            onClick={() => setMode('upload')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload File
          </button>
          <button
            type="button"
            className={`modal-tab ${mode === 'manual' ? 'active' : ''}`}
            onClick={() => setMode('manual')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Manual Entry
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
            {mode === 'upload' && (
              <div
                className="dropzone"
                onClick={() => fileInputRef.current?.click()}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click()
                  }
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
                <div className="dropzone-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m16 16-4-4-4 4" />
                  </svg>
                </div>
                {isExtracting ? (
                  <div className="file-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                    <span>Extracting details via OCR & AI...</span>
                  </div>
                ) : fileName ? (
                  <div className="file-badge">
                    <span>✓ {fileName}</span>
                    {extractStatus === 'success' && <span style={{ opacity: 0.85, fontSize: '0.85em', marginLeft: '6px' }}>(Details auto-filled)</span>}
                    {extractStatus === 'fallback' && <span style={{ opacity: 0.85, fontSize: '0.85em', marginLeft: '6px' }}>(Ready for manual entry)</span>}
                  </div>
                ) : (
                  <>
                    <p className="dropzone-prompt">
                      <strong>Click to upload</strong> or drag receipt here
                    </p>
                    <p className="dropzone-hint">Supports PNG, JPG, PDF up to 4MB</p>
                  </>
                )}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="vendor-name">Merchant / Store *</label>
                <input
                  id="vendor-name"
                  type="text"
                  placeholder="e.g. Reliance Digital, Ikea"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="bill-amount">Amount (₹) *</label>
                <input
                  id="bill-amount"
                  type="text"
                  placeholder="e.g. 3,499"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="bill-category">Category</label>
                <select
                  id="bill-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Food">Food & Dining</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Fashion">Fashion & Apparel</option>
                  <option value="Health">Health & Pharmacy</option>
                  <option value="Travel">Travel & Fuel</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bill-date">Date</label>
                <input
                  id="bill-date"
                  type="text"
                  placeholder="e.g. Sep 15 or Today"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="bill-return-days">Return Window (Days)</label>
                <input
                  id="bill-return-days"
                  type="number"
                  placeholder="e.g. 7 or 30 (optional)"
                  value={returnDays}
                  onChange={(e) => setReturnDays(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div className="warranty-toggle-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasWarranty}
                  onChange={(e) => setHasWarranty(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span>This item includes a warranty</span>
              </label>

              {hasWarranty && (
                <div className="warranty-period-input">
                  <input
                    type="text"
                    placeholder="e.g. 12 months"
                    value={warrantyPeriod}
                    onChange={(e) => setWarrantyPeriod(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={!vendor.trim() || !amount.trim()}>
                Save Receipt
              </button>
            </div>
          </form>
      </div>
    </div>
  )
}

export default AddBillModal
