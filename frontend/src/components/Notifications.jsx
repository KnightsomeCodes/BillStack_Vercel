import { getBillNotifications } from '../utils/billUtils'

function Notifications({ bills = [], onSelectBill }) {
  const notifications = getBillNotifications(bills)

  return (
    <section className="notifications-section" aria-labelledby="notifications-heading">
      <div className="notifications-header">
        <div>
          <span className="section-eyebrow">SMART REMINDERS</span>
          <h2 id="notifications-heading">Notifications & Alerts</h2>
          <p className="section-subtitle">
            Automated alerts for expiring warranties and return windows.
          </p>
        </div>

        <div className={`notification-count ${notifications.length > 0 ? 'has-alerts' : ''}`}>
          {notifications.length}
        </div>
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <div className="empty-notification-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h3>All Caught Up</h3>
              <p>No urgent warranty expirations or return deadlines requiring attention right now.</p>
            </div>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              className={`notification-card ${notification.type}`}
              key={notification.id}
              onClick={() => onSelectBill && onSelectBill(notification.bill)}
              role={onSelectBill ? 'button' : undefined}
              tabIndex={onSelectBill ? 0 : undefined}
              onKeyDown={(e) => {
                if (onSelectBill && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onSelectBill(notification.bill)
                }
              }}
            >
              <div className="notification-icon">
                {notification.type === 'expired' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
              </div>

              <div className="notification-content">
                <div className="notification-top-row">
                  <h3>{notification.title}</h3>
                  <span className={`notification-pill ${notification.type}`}>
                    {notification.badge}
                  </span>
                </div>
                <p>{notification.message}</p>
              </div>

              <span className="notification-arrow" aria-hidden="true">
                →
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default Notifications
