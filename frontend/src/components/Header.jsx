import { useState, useRef, useEffect } from 'react'

function Header({
  searchQuery,
  setSearchQuery,
  activePage,
  setActivePage,
  theme,
  toggleTheme,
  onOpenProfile,
  onOpenSettings,
  onOpenAbout,
  notifications = [],
  unreadNotifCount = 0,
  onSelectNotification,
  onMarkAllNotificationsRead,
}) {
  const [localSearch, setLocalSearch] = useState('')
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const searchInputRef = useRef(null)
  const notifRef = useRef(null)
  const mobileMenuRef = useRef(null)

  // Support controlled or uncontrolled search
  const currentSearch = searchQuery !== undefined ? searchQuery : localSearch
  const handleSearchChange = (val) => {
    if (setSearchQuery) {
      setSearchQuery(val)
    } else {
      setLocalSearch(val)
    }
  }

  // Keyboard shortcut to focus search ('/' or 'Cmd+K')
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) &&
        document.activeElement !== searchInputRef.current
      ) {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'Escape') {
        setIsNotifOpen(false)
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMobileMenuNavigate = (page, subpage) => {
    setIsMobileMenuOpen(false)
    if (subpage === 'settings' && onOpenSettings) {
      onOpenSettings()
    } else if (subpage === 'profile' && onOpenProfile) {
      onOpenProfile()
    } else if (subpage === 'about' && onOpenAbout) {
      onOpenAbout()
    } else if (setActivePage) {
      setActivePage(page)
    }
  }

  return (
    <header className="topbar">
      <div className="header-top">
        {/* Brand */}
        <div
          className="brand-group"
          onClick={() => setActivePage && setActivePage('home')}
          role="button"
          tabIndex={0}
          aria-label="BillStack Home"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && setActivePage) setActivePage('home')
          }}
        >
          <img
            src="/billstack-symbol.png"
            alt="BillStack Brand Symbol"
            className="brand-symbol-img symbol-light"
          />
          <img
            src="/billstack-symbol-dark.png"
            alt="BillStack Brand Symbol"
            className="brand-symbol-img symbol-dark"
          />
          <span className="brand-wordmark">
            <span className="wordmark-bill">Bill</span>
            <span className="wordmark-stack">Stack</span>
          </span>
          <span className="brand-badge">Receipt Hub</span>
        </div>

        {/* Desktop Navigation */}
        {setActivePage && (
          <nav className="desktop-nav" aria-label="Main Navigation">
            <button
              type="button"
              className={`desktop-nav-link ${activePage === 'home' ? 'active' : ''}`}
              onClick={() => setActivePage('home')}
            >
              <span>Home</span>
            </button>
            <button
              type="button"
              className={`desktop-nav-link ${activePage === 'bills' ? 'active' : ''}`}
              onClick={() => setActivePage('bills')}
            >
              <span>All Bills</span>
            </button>
            <button
              type="button"
              className={`desktop-nav-link ${activePage === 'warranty' ? 'active' : ''}`}
              onClick={() => setActivePage('warranty')}
            >
              <span>Warranties</span>
            </button>
            <button
              type="button"
              className={`desktop-nav-link ${activePage === 'analytics' ? 'active' : ''}`}
              onClick={() => setActivePage('analytics')}
            >
              <span>Analytics</span>
            </button>
            <button
              type="button"
              className={`desktop-nav-link ${activePage === 'more' ? 'active' : ''}`}
              onClick={() => {
                if (onOpenSettings) onOpenSettings()
                else setActivePage('more')
              }}
            >
              <span>Settings</span>
            </button>
          </nav>
        )}

        {/* Header Actions: Theme Toggle -> Notification Bell -> Profile Icon */}
        <div className="header-actions">
          {/* 1. Theme Toggle Button */}
          {toggleTheme && (
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                /* Sun Icon */
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                /* Moon Icon */
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          )}

          {/* 2. Notification Bell */}
          <div className="notification-bell-container" ref={notifRef}>
            <button
              type="button"
              className={`notification-bell-btn ${isNotifOpen ? 'active' : ''}`}
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              aria-label={`Notifications (${unreadNotifCount} unread)`}
              aria-expanded={isNotifOpen}
              title="Notifications"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotifCount > 0 && (
                <span className="bell-badge" aria-hidden="true">
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </span>
              )}
            </button>

            {/* Notification Popover Panel */}
            {isNotifOpen && (
              <div className="notification-popover" role="dialog" aria-modal="true" aria-label="Notifications Panel">
                <div className="popover-header">
                  <div className="popover-title-row">
                    <h4>Notifications</h4>
                    {unreadNotifCount > 0 && (
                      <span className="popover-unread-badge">{unreadNotifCount} new</span>
                    )}
                  </div>
                  {unreadNotifCount > 0 && onMarkAllNotificationsRead && (
                    <button
                      type="button"
                      className="popover-mark-all"
                      onClick={onMarkAllNotificationsRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="popover-list">
                  {notifications.length === 0 ? (
                    <div className="popover-empty">
                      <div className="empty-bell-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <p>You&apos;re all caught up!</p>
                      <span>No urgent warranty or return alerts.</span>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`popover-item ${notif.type}`}
                        onClick={() => {
                          if (onSelectNotification) onSelectNotification(notif)
                          setIsNotifOpen(false)
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            if (onSelectNotification) onSelectNotification(notif)
                            setIsNotifOpen(false)
                          }
                        }}
                      >
                        <div className={`popover-item-icon ${notif.type}`}>
                          {notif.type === 'expired' ? '!' : '⚠'}
                        </div>
                        <div className="popover-item-content">
                          <div className="popover-item-top">
                            <strong>{notif.title}</strong>
                            <span className="popover-item-date">{notif.date}</span>
                          </div>
                          <p>{notif.message}</p>
                          <span className={`popover-item-badge ${notif.type}`}>{notif.badge}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Profile Circle */}
          <button
            type="button"
            className="profile-circle"
            aria-label="Profile and preferences"
            onClick={() => {
              if (onOpenProfile) onOpenProfile()
              else if (setActivePage) setActivePage('more')
            }}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Global Search Bar with Compact Mobile Menu Control at Top-Left */}
      <div className="search-bar-row">
        {/* Mobile Menu Control - strictly visible on mobile, positioned at top-left of search bar */}
        <div className="mobile-menu-anchor" ref={mobileMenuRef}>
          <button
            type="button"
            className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Open mobile navigation menu"
            aria-expanded={isMobileMenuOpen}
            title="Menu & Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>

          {/* Compact Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="mobile-menu-dropdown" role="menu" aria-label="Mobile Navigation Menu">
              <div className="mobile-menu-dropdown-header">
                <span className="dropdown-title">Menu & Preferences</span>
              </div>

              <div className="mobile-menu-options">
                <button
                  type="button"
                  className="mobile-dropdown-item"
                  role="menuitem"
                  onClick={() => handleMobileMenuNavigate('more', 'settings')}
                >
                  <span className="dropdown-item-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </span>
                  <div className="dropdown-item-text">
                    <strong>Settings</strong>
                    <span>Currencies & alerts</span>
                  </div>
                  <span className="dropdown-chevron">›</span>
                </button>

                <button
                  type="button"
                  className="mobile-dropdown-item"
                  role="menuitem"
                  onClick={() => handleMobileMenuNavigate('more', 'profile')}
                >
                  <span className="dropdown-item-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <div className="dropdown-item-text">
                    <strong>Profile</strong>
                    <span>Alex Morgan</span>
                  </div>
                  <span className="dropdown-chevron">›</span>
                </button>

                <button
                  type="button"
                  className="mobile-dropdown-item"
                  role="menuitem"
                  onClick={() => handleMobileMenuNavigate('more', 'about')}
                >
                  <span className="dropdown-item-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </span>
                  <div className="dropdown-item-text">
                    <strong>About BillStack</strong>
                    <span>v1.2.0 • Security</span>
                  </div>
                  <span className="dropdown-chevron">›</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Input Box */}
        <div className="search-bar">
          <span className="search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>

          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by vendor, category, or amount... (Press / to focus)"
            value={currentSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search bills and receipts"
          />

          {currentSearch && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => handleSearchChange('')}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
