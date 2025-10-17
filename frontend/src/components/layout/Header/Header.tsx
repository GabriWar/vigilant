import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@constants/routes';
import { Icon } from '@components/atoms/Icon/Icon';
import { Badge } from '@components/atoms/Badge/Badge';
import './Header.css';

export const Header: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const handleNotificationToggle = async () => {
    try {
      if (!notificationsEnabled) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          // TODO: Subscribe to push notifications
          console.log('Notifications enabled');
        }
      } else {
        setNotificationsEnabled(false);
        // TODO: Unsubscribe from push notifications
        console.log('Notifications disabled');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  return (
    <header className="header">
      <nav className="header-nav">
        <Link to={ROUTES.DASHBOARD} className="header-logo">
          <Icon name="monitor" size="md" />
          <span>Vigilant</span>
        </Link>

        <div className="header-links">
          <Link to={ROUTES.WATCHERS} className="header-link">
            <Icon name="eye" size="sm" />
            Watchers
          </Link>
          <Link to={ROUTES.WORKFLOWS} className="header-link">
            <Icon name="workflow" size="sm" />
            Workflows
          </Link>
          <Link to={ROUTES.CHANGE_LOGS} className="header-link">
            <Icon name="calendar" size="sm" />
            Change Logs
          </Link>
          <Link to={ROUTES.IMAGES} className="header-link">
            <Icon name="image" size="sm" />
            Images
          </Link>
          <Link to={ROUTES.COOKIES} className="header-link">
            <Icon name="cookie" size="sm" />
            Cookies
          </Link>
        </div>

        <div className="header-actions">
          <button
            onClick={handleNotificationToggle}
            className={`header-notification-btn ${notificationsEnabled ? 'active' : ''}`}
            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            <Icon name="bell" size="md" />
            {notificationsEnabled && <Badge variant="success" size="sm" className="header-notification-badge">ON</Badge>}
          </button>
        </div>
      </nav>
    </header>
  );
};
