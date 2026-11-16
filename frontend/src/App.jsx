import { useState, useMemo } from 'react'
import Header from './components/Header'
import BillCard from './components/BillCard'
import MobileNav from './components/MobileNav'
import AddBillModal from './components/AddBillModal'
import ScanBillModal from './components/ScanBillModal'
import ReceiptDetailModal from './components/ReceiptDetailModal'
import ExpenseAnalytics from './components/ExpenseAnalytics'
import AnalyticsPage from './components/AnalyticsPage'
import Notifications from './components/Notifications'
import WarrantyAlerts from './components/WarrantyAlerts'
import {
  getWarrantyStatus,
  getWarrantyExpiry,
  getDaysRemaining,
  getBillWarrantyMonths,
  getBillNotifications,
} from './utils/billUtils'
import { useTheme } from './theme'

const INITIAL_BILLS = [
  {
    id: 'bill-1',
    vendor: 'Croma',
    category: 'Electronics',
    amount: 8999,
    formattedAmount: '8,999',
    date: 'Sep 12',
    fullDate: 'Sep 12, 2024',
    hasWarranty: true,
    warrantyMonths: 11,
    warrantyPeriod: '11 months',
    warrantyDateText: 'Warranty: 11 months',
    warrantyStatus: 'active',
    returnDays: 0,
    status: 'Verified',
    paymentMethod: 'Credit Card (••4821)',
    receiptNumber: 'REC-CR-8991'
  },
  {
    id: 'bill-2',
    vendor: 'Amazon',
    category: 'Food',
    amount: 2499,
    formattedAmount: '2,499',
    date: 'Sep 10',
    fullDate: 'Sep 10, 2024',
    hasWarranty: false,
    warrantyMonths: 0,
    warrantyPeriod: null,
    warrantyDateText: null,
    warrantyStatus: null,
    returnDays: 7,
    status: 'Verified',
    paymentMethod: 'UPI (GPay)',
    receiptNumber: 'REC-AMZ-2499'
  },
  {
    id: 'bill-3',
    vendor: 'Flipkart',
    category: 'Electronics',
    amount: 1299,
    formattedAmount: '1,299',
    date: 'Sep 08',
    fullDate: 'Sep 08, 2024',
    hasWarranty: true,
    warrantyMonths: 10,
    warrantyPeriod: '10 months',
    warrantyDateText: 'Warranty: 10 months',
    warrantyStatus: 'active',
    returnDays: 0,
    status: 'Verified',
    paymentMethod: 'Debit Card (••1102)',
    receiptNumber: 'REC-FK-1299'
  }
]

function App() {
  const [activePage, setActivePage] = useState('home')
  const [bills, setBills] = useState(INITIAL_BILLS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [warrantyTabFilter, setWarrantyTabFilter] = useState('All')
  
  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [selectedBillForDetail, setSelectedBillForDetail] = useState(null)
  const [moreSubpage, setMoreSubpage] = useState(null) // 'profile' | 'settings' | 'about' | null

  // Notification state
  const [readNotifIds, setReadNotifIds] = useState(() => new Set())

  // Theme hook
  const { theme, toggleTheme, setTheme } = useTheme()

  // Real computed financial metrics
  const totalExpenditure = useMemo(() => {
    return bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
  }, [bills])

  const warrantyItems = useMemo(() => {
    return bills.filter((b) => b.hasWarranty || (typeof b.date === 'string' && b.date.includes('Warranty')))
  }, [bills])

  const categoryStats = useMemo(() => {
    const stats = {}
    bills.forEach((b) => {
      const cat = b.category || 'General'
      stats[cat] = (stats[cat] || 0) + (Number(b.amount) || 0)
    })
    return Object.entries(stats).map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpenditure > 0 ? Math.round((amount / totalExpenditure) * 100) : 0
    }))
  }, [bills, totalExpenditure])

  // Computed warranty and alert counts from real receipt dates
  const warrantyAlertsCount = useMemo(() => {
    return bills.filter((bill) => {
      if (!getBillWarrantyMonths(bill) && !bill.hasWarranty) return false
      const expiry = getWarrantyExpiry(bill)
      const days = getDaysRemaining(expiry)
      return days !== null && days <= 30
    }).length
  }, [bills])

  const warrantyHealthStats = useMemo(() => {
    let active = 0
    let expiring = 0
    let expired = 0

    bills.forEach((b) => {
      const status = getWarrantyStatus(b)
      if (status === 'active') active++
      else if (status === 'expiring') expiring++
      else if (status === 'expired') expired++
    })

    return { active, expiring, expired }
  }, [bills])

  // Notifications calculation and unread counter
  const allNotifications = useMemo(() => getBillNotifications(bills), [bills])
  const unreadNotifCount = useMemo(() => {
    return allNotifications.filter((n) => !readNotifIds.has(n.id)).length
  }, [allNotifications, readNotifIds])

  const handleSelectNotification = (notif) => {
    setReadNotifIds((prev) => new Set([...prev, notif.id]))
    if (notif.bill) {
      setSelectedBillForDetail(notif.bill)
    }
  }

  const handleMarkAllNotificationsRead = () => {
    setReadNotifIds(new Set(allNotifications.map((n) => n.id)))
  }

  // Filtered bills based on search & category
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const matchesSearch =
        !searchQuery.trim() ||
        bill.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(bill.amount).includes(searchQuery)

      const matchesCat =
        selectedCategory === 'All' || bill.category.toLowerCase() === selectedCategory.toLowerCase()

      return matchesSearch && matchesCat
    })
  }, [bills, searchQuery, selectedCategory])

  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true)
  }

  const handleOpenScanModal = () => {
    setIsScanModalOpen(true)
  }

  const handleAddBill = (newBill) => {
    setBills((prev) => [newBill, ...prev])
  }

  return (
    <div className="app">
      {/* Global Responsive Topbar */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activePage={activePage}
        setActivePage={setActivePage}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenProfile={() => {
          setActivePage('more')
          setMoreSubpage('profile')
        }}
        onOpenSettings={() => {
          setActivePage('more')
          setMoreSubpage('settings')
        }}
        onOpenAbout={() => {
          setActivePage('more')
          setMoreSubpage('about')
        }}
        notifications={allNotifications}
        unreadNotifCount={unreadNotifCount}
        onSelectNotification={handleSelectNotification}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      />

      <main className="main-content">
        {/* ======================================================== */}
        {/* 1. HOME SCREEN */}
        {/* ======================================================== */}
        {activePage === 'home' && (
          <div className="dashboard-view">
            {/* Greeting & Headline */}
            <div className="dashboard-hero">
              <div className="hero-text">
                <span className="hero-eyebrow">Financial Overview</span>
                <h1 className="hero-title">Purchase & Warranty Vault</h1>
                <p className="hero-description">
                  Track stored bills, monitor active warranties, and analyze your consumer expenses.
                </p>
              </div>

              {/* Fast Action Buttons */}
              <div className="hero-actions">
                <button
                  type="button"
                  className="hero-btn-primary"
                  onClick={handleOpenUploadModal}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Upload Receipt</span>
                </button>
                <button
                  type="button"
                  className="hero-btn-secondary"
                  onClick={handleOpenScanModal}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M4 7V4h3" />
                    <path d="M20 7V4h-3" />
                    <path d="M4 17v3h3" />
                    <path d="M20 17v3h-3" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                  </svg>
                  <span>Scan Bill</span>
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid">
              <div className="metric-card metric-primary">
                <div className="metric-icon-wrap">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="metric-content">
                  <span className="metric-label">Total Expenditure</span>
                  <div className="metric-val-row">
                    <span className="metric-value">₹{totalExpenditure.toLocaleString('en-IN')}</span>
                  </div>
                  <span className="metric-subtext">Across {bills.length} stored receipts</span>
                </div>
              </div>

              <div
                className="metric-card"
                onClick={() => setActivePage('bills')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setActivePage('bills')
                }}
              >
                <div className="metric-icon-wrap icon-blue">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="metric-content">
                  <span className="metric-label">Stored Receipts</span>
                  <div className="metric-val-row">
                    <span className="metric-value">{bills.length}</span>
                  </div>
                  <span className="metric-subtext">100% cloud encrypted</span>
                </div>
              </div>

              <div
                className="metric-card"
                onClick={() => setActivePage('warranty')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setActivePage('warranty')
                }}
              >
                <div className="metric-icon-wrap icon-emerald">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <div className="metric-content">
                  <span className="metric-label">Active Warranties</span>
                  <div className="metric-val-row">
                    <span className="metric-value">{warrantyItems.length}</span>
                  </div>
                  <span className="metric-subtext">All devices protected</span>
                </div>
              </div>

              <div
                className="metric-card"
                onClick={() => setActivePage('warranty')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setActivePage('warranty')
                }}
              >
                <div className="metric-icon-wrap icon-amber">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="metric-content">
                  <span className="metric-label">Warranty Alerts</span>
                  <div className="metric-val-row">
                    <span className="metric-value">{warrantyAlertsCount}</span>
                  </div>
                  <span className="metric-subtext">Requires review</span>
                </div>
              </div>
            </div>

            {/* Content Row: Category Breakdown + Recent Bills */}
            <div className="dashboard-content-split">
              {/* Recent Bills Column */}
              <section className="bills-section">
                <div className="section-header">
                  <div className="section-title-wrap">
                    <h2>Recent Bills</h2>
                    <span className="section-count">{bills.length} items</span>
                  </div>
                  <button
                    type="button"
                    className="view-all-link"
                    onClick={() => setActivePage('bills')}
                  >
                    View All →
                  </button>
                </div>

                <div className="bill-list">
                  {bills.slice(0, 3).map((bill) => (
                    <BillCard
                      key={bill.id}
                      vendor={bill.vendor}
                      category={bill.category}
                      amount={bill.formattedAmount || bill.amount}
                      date={bill.date}
                      fullBill={bill}
                      onClick={() => setSelectedBillForDetail(bill)}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className="view-all"
                  onClick={() => setActivePage('bills')}
                >
                  View All Bills →
                </button>
              </section>

              {/* Expense by Category Column */}
              <section className="category-section">
                <div className="section-header">
                  <div className="section-title-wrap">
                    <h2>Spending Categories</h2>
                    <span className="section-count">{categoryStats.length} types</span>
                  </div>
                </div>

                <div className="category-card-box">
                  <div className="category-bars">
                    {categoryStats.map((cat) => (
                      <div key={cat.name} className="category-item">
                        <div className="cat-header-row">
                          <span className="cat-name">{cat.name}</span>
                          <span className="cat-amount">₹{cat.amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="cat-progress-track">
                          <div
                            className={`cat-progress-fill fill-${cat.name.toLowerCase()}`}
                            style={{ width: `${cat.percentage}%` }}
                          ></div>
                        </div>
                        <div className="cat-footer-row">
                          <span className="cat-percent">{cat.percentage}% of total spend</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="warranty-teaser-card" onClick={() => setActivePage('warranty')}>
                    <div className="teaser-left">
                      <span className="teaser-badge">Warranties</span>
                      <strong>{warrantyItems.length} items currently covered</strong>
                      <p>Flipkart & Croma items under manufacturer protection</p>
                    </div>
                    <span className="teaser-arrow">→</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Expense Analytics (Monthly Trends & Category Chart) */}
            <ExpenseAnalytics bills={bills} />

            {/* Smart Reminder Notifications */}
            <Notifications
              bills={bills}
              onSelectBill={(bill) => setSelectedBillForDetail(bill)}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. ALL BILLS SCREEN */}
        {/* ======================================================== */}
        {activePage === 'bills' && (
          <section className="bills-section page-container">
            <div className="section-header">
              <div>
                <h2>All Bills</h2>
                <p className="page-subheading">View, filter, and inspect your recorded purchase receipts</p>
              </div>
              <button
                type="button"
                className="btn-primary-compact"
                onClick={handleOpenUploadModal}
              >
                + Add Bill
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="filter-pills-row" role="tablist" aria-label="Filter receipts by category">
              {['All', 'Electronics', 'Food'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                  <span className="filter-pill-count">
                    {cat === 'All'
                      ? bills.length
                      : bills.filter((b) => b.category.toLowerCase() === cat.toLowerCase()).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Results Status */}
            <div className="bills-meta-row">
              <span className="bills-counter">
                Showing {filteredBills.length} of {bills.length} receipts
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-link"
                  onClick={() => setSearchQuery('')}
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Bills List */}
            {filteredBills.length > 0 ? (
              <div className="bill-list">
                {filteredBills.map((bill) => (
                  <BillCard
                    key={bill.id}
                    vendor={bill.vendor}
                    category={bill.category}
                    amount={bill.formattedAmount || bill.amount}
                    date={bill.date}
                    fullBill={bill}
                    onClick={() => setSelectedBillForDetail(bill)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state-box">
                <div className="empty-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3>No bills found</h3>
                <p>No receipts match your search & category filters.</p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('All')
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* ======================================================== */}
        {/* 3. DEDICATED ANALYTICS SCREEN */}
        {/* ======================================================== */}
        {activePage === 'analytics' && (
          <AnalyticsPage
            bills={bills}
            onSelectBill={(bill) => setSelectedBillForDetail(bill)}
          />
        )}

        {/* ======================================================== */}
        {/* 4. WARRANTY & PURCHASE PROTECTION SCREEN */}
        {/* ======================================================== */}
        {activePage === 'warranty' && (
          <section className="bills-section page-container">
            <div className="section-header">
              <div>
                <h2>Warranty Tracker & Protection</h2>
                <p className="page-subheading">Monitor coverage timelines, return windows, and upcoming purchase deadlines</p>
              </div>
              <span className="badge-warranty-count">
                {warrantyHealthStats.active} Active Warranties
              </span>
            </div>

            {/* Warranty Status Banner */}
            <div className="warranty-health-banner">
              <div className="health-stat">
                <span className="health-num">{warrantyHealthStats.active}</span>
                <span className="health-label">Active Coverage</span>
              </div>
              <div className="health-divider"></div>
              <div className="health-stat">
                <span className="health-num">{warrantyHealthStats.expiring}</span>
                <span className="health-label">Expiring Soon</span>
              </div>
              <div className="health-divider"></div>
              <div className="health-stat">
                <span className="health-num">{warrantyHealthStats.expired}</span>
                <span className="health-label">Expired</span>
              </div>
            </div>

            {/* Protection Deadlines & Return Alerts Section */}
            <WarrantyAlerts
              bills={bills}
              onSelectBill={(bill) => setSelectedBillForDetail(bill)}
            />

            {/* Structured Coverage Inventory with Status Tabs */}
            <div className="warranty-inventory-section">
              <div className="section-header">
                <div className="section-title-wrap">
                  <h2>Protected Purchases Vault</h2>
                  <span className="section-count">{warrantyItems.length} items</span>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="filter-pills-row" role="tablist" aria-label="Filter warranty coverage">
                {[
                  { id: 'All', label: 'All Items', count: warrantyItems.length },
                  { id: 'Active', label: 'Active Coverage', count: warrantyHealthStats.active },
                  { id: 'Expiring Soon', label: 'Expiring Soon', count: warrantyHealthStats.expiring },
                  { id: 'Expired', label: 'Expired', count: warrantyHealthStats.expired }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={warrantyTabFilter === tab.id}
                    className={`filter-pill ${warrantyTabFilter === tab.id ? 'active' : ''}`}
                    onClick={() => setWarrantyTabFilter(tab.id)}
                  >
                    {tab.label}
                    <span className="filter-pill-count">{tab.count}</span>
                  </button>
                ))}
              </div>

              {/* Filtered Warranties List */}
              <div className="bill-list">
                {warrantyItems
                  .filter((bill) => {
                    if (warrantyTabFilter === 'All') return true
                    const status = getWarrantyStatus(bill)
                    if (warrantyTabFilter === 'Active') return status === 'active'
                    if (warrantyTabFilter === 'Expiring Soon') return status === 'expiring'
                    if (warrantyTabFilter === 'Expired') return status === 'expired'
                    return true
                  })
                  .map((bill) => (
                    <BillCard
                      key={bill.id}
                      vendor={bill.vendor}
                      category={bill.category}
                      amount={bill.formattedAmount || bill.amount}
                      date={bill.warrantyDateText || (bill.warrantyPeriod ? `Warranty: ${bill.warrantyPeriod}` : bill.date)}
                      fullBill={bill}
                      onClick={() => setSelectedBillForDetail(bill)}
                    />
                  ))}
              </div>
            </div>

            <div className="warranty-info-card">
              <div className="info-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <strong>Keep original invoices safe</strong>
                <p>Most retailers require the original digital invoice and serial number when processing warranty claims.</p>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* 4. MORE SCREEN */}
        {/* ======================================================== */}
        {activePage === 'more' && (
          <section className="bills-section page-container">
            <div className="section-header">
              <div>
                <h2>Account & Preferences</h2>
                <p className="page-subheading">Manage your profile, theme settings, and application preferences</p>
              </div>
            </div>

            {/* Profile Overview Card */}
            <div className="profile-hero-card">
              <div className="profile-hero-left">
                <div className="profile-large-avatar">AM</div>
                <div>
                  <h3 className="profile-name">Alex Morgan</h3>
                  <p className="profile-email">alex.morgan@example.com</p>
                  <span className="plan-badge">Verified Consumer Plan</span>
                </div>
              </div>
              <div className="profile-quick-stats">
                <div className="stat-pill">
                  <strong>{bills.length}</strong>
                  <span>Bills</span>
                </div>
                <div className="stat-pill">
                  <strong>{warrantyItems.length}</strong>
                  <span>Warranties</span>
                </div>
              </div>
            </div>

            {/* Theme & Appearance Control Card */}
            <div className="appearance-card">
              <div className="appearance-header">
                <div>
                  <strong>Appearance & Color Theme</strong>
                  <p>Choose between light and dark interface</p>
                </div>
                <span className="current-theme-pill">Current: {theme === 'dark' ? 'Dark' : 'Light'}</span>
              </div>

              <div className="theme-options-grid">
                <button
                  type="button"
                  className={`theme-option-btn ${theme === 'light' ? 'selected' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <span className="theme-btn-icon">☀️</span>
                  <strong>Light Mode</strong>
                  <span>Crisp, high-contrast surfaces</span>
                </button>

                <button
                  type="button"
                  className={`theme-option-btn ${theme === 'dark' ? 'selected' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <span className="theme-btn-icon">🌙</span>
                  <strong>Dark Mode</strong>
                  <span>Deep charcoal & slate surfaces</span>
                </button>
              </div>
            </div>

            {/* Original 3 More Actions (Enhanced) */}
            <div className="more-menu-container">
              <button
                type="button"
                className="more-item"
                onClick={() => setMoreSubpage('profile')}
              >
                <div className="more-item-left">
                  <span className="more-item-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <div>
                    <strong>Profile</strong>
                    <p>View personal info and bill storage allowance</p>
                  </div>
                </div>
                <span className="more-chevron">›</span>
              </button>

              <button
                type="button"
                className="more-item"
                onClick={() => setMoreSubpage('settings')}
              >
                <div className="more-item-left">
                  <span className="more-item-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </span>
                  <div>
                    <strong>Settings</strong>
                    <p>Currency preferences, notification alerts, and data exports</p>
                  </div>
                </div>
                <span className="more-chevron">›</span>
              </button>

              <button
                type="button"
                className="more-item"
                onClick={() => setMoreSubpage('about')}
              >
                <div className="more-item-left">
                  <span className="more-item-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </span>
                  <div>
                    <strong>About BillStack</strong>
                    <p>Version, privacy standards, and security overview</p>
                  </div>
                </div>
                <span className="more-chevron">›</span>
              </button>
            </div>

            {/* Subpage Modal / Detail Dialog */}
            {moreSubpage && (
              <div className="modal-backdrop" onClick={() => setMoreSubpage(null)} role="dialog" aria-modal="true">
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div>
                      <h2 className="modal-title">
                        {moreSubpage === 'profile' && 'User Profile'}
                        {moreSubpage === 'settings' && 'App Settings'}
                        {moreSubpage === 'about' && 'About BillStack'}
                      </h2>
                    </div>
                    <button className="modal-close-btn" onClick={() => setMoreSubpage(null)}>
                      ✕
                    </button>
                  </div>

                  {moreSubpage === 'profile' && (
                    <div className="modal-body-pad">
                      <div className="info-stat-row">
                        <span>Account Name</span>
                        <strong>Alex Morgan</strong>
                      </div>
                      <div className="info-stat-row">
                        <span>Email</span>
                        <strong>alex.morgan@example.com</strong>
                      </div>
                      <div className="info-stat-row">
                        <span>Stored Invoices</span>
                        <strong>{bills.length} receipts (Total: ₹{totalExpenditure.toLocaleString('en-IN')})</strong>
                      </div>
                      <div className="info-stat-row">
                        <span>Cloud Storage</span>
                        <strong>0.4 MB of 5.0 GB used (99% free)</strong>
                      </div>
                      <div className="info-stat-row">
                        <span>Status</span>
                        <strong className="text-emerald">Active • Synced</strong>
                      </div>
                    </div>
                  )}

                  {moreSubpage === 'settings' && (
                    <div className="modal-body-pad">
                      <div className="info-stat-row">
                        <span>Default Currency</span>
                        <strong>INR (₹) Indian Rupee</strong>
                      </div>
                      <div className="info-stat-row">
                        <span>Warranty Expiry Alerts</span>
                        <strong>30 days in advance (Enabled)</strong>
                      </div>
                      <div className="info-stat-row">
                        <span>Receipt OCR Processing</span>
                        <strong>High Accuracy (Enabled)</strong>
                      </div>
                      <div className="info-stat-row">
                        <span>Data Encryption</span>
                        <strong className="text-emerald">AES-256 Client-side</strong>
                      </div>
                    </div>
                  )}

                  {moreSubpage === 'about' && (
                    <div className="modal-body-pad">
                      <p className="about-lead">
                        <strong>BillStack</strong> is a modern digital receipt and purchase management platform engineered for consumer financial clarity.
                      </p>
                      <div className="info-stat-row">
                        <span>Release Version</span>
                        <strong>v1.2.0 (Production)</strong>
                      </div>
                      <div className="info-stat-row">
                        <span>Framework</span>
                        <strong>React 19 + Vite</strong>
                      </div>
                      <div className="info-stat-row">
                        <span>Privacy</span>
                        <strong>Zero trackers • Local client persistence</strong>
                      </div>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button type="button" className="btn-primary" onClick={() => setMoreSubpage(null)}>
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activePage={activePage}
        setActivePage={setActivePage}
        onTriggerAction={(action) => (action === 'scan' ? handleOpenScanModal() : handleOpenUploadModal())}
      />

      {/* Upload Receipt Modal (Upload File + Manual Entry) */}
      <AddBillModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddBill={handleAddBill}
      />

      {/* Scan Bill Modal (Scanning interface only) */}
      <ScanBillModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onAddBill={handleAddBill}
      />

      {/* Receipt Detail Modal */}
      <ReceiptDetailModal
        isOpen={Boolean(selectedBillForDetail)}
        bill={selectedBillForDetail}
        onClose={() => setSelectedBillForDetail(null)}
      />
    </div>
  )
}

export default App
