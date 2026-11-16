import { useState } from 'react'

function MobileNav({ activePage, setActivePage, onTriggerAction }) {
  const [showAddMenu, setShowAddMenu] = useState(false)

  const handleAction = (mode) => {
    setShowAddMenu(false)
    if (onTriggerAction) {
      onTriggerAction(mode)
    }
  }

  return (
    <>
      {showAddMenu && (
        <>
          <div
            className="add-menu-overlay"
            onClick={() => setShowAddMenu(false)}
            aria-hidden="true"
          />

          <div className="add-menu" role="menu" aria-label="Add receipt options">
            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction('upload')}
              className="add-menu-option"
            >
              <span className="add-menu-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </span>
              <div className="add-menu-text">
                <strong>Upload Bill</strong>
                <span>From files or photos</span>
              </div>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => handleAction('scan')}
              className="add-menu-option"
            >
              <span className="add-menu-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7V4h3" />
                  <path d="M20 7V4h-3" />
                  <path d="M4 17v3h3" />
                  <path d="M20 17v3h-3" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                </svg>
              </span>
              <div className="add-menu-text">
                <strong>Scan Bill</strong>
                <span>Instant smart OCR</span>
              </div>
            </button>
          </div>
        </>
      )}

      <nav className="mobile-nav" aria-label="Mobile Navigation">
        {/* 1. Home */}
        <button
          type="button"
          className={activePage === 'home' ? 'active' : ''}
          onClick={() => setActivePage('home')}
          aria-label="Home page"
        >
          <span className="nav-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          Home
        </button>

        {/* 2. Bills */}
        <button
          type="button"
          className={activePage === 'bills' ? 'active' : ''}
          onClick={() => setActivePage('bills')}
          aria-label="All Bills page"
        >
          <span className="nav-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </span>
          Bills
        </button>

        {/* 3. Central Add Button */}
        <button
          type="button"
          className="add-button"
          onClick={() => {
            setShowAddMenu(!showAddMenu)
          }}
          aria-label="Add bill options"
          aria-expanded={showAddMenu}
        >
          <span className="add-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          Add
        </button>

        {/* 4. Warranty */}
        <button
          type="button"
          className={activePage === 'warranty' ? 'active' : ''}
          onClick={() => setActivePage('warranty')}
          aria-label="Warranty page"
        >
          <span className="nav-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </span>
          Warranty
        </button>

        {/* 5. Analytics (Replaces More) */}
        <button
          type="button"
          className={activePage === 'analytics' ? 'active' : ''}
          onClick={() => setActivePage('analytics')}
          aria-label="Analytics page"
        >
          <span className="nav-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </span>
          Analytics
        </button>
      </nav>
    </>
  )
}

export default MobileNav
