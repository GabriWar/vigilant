import { useState, useEffect } from 'react';
import { notificationService } from '@services/notifications';
import { Button } from '@components/atoms/Button/Button';

export const NotificationToggle: React.FC = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    const subscribed = await notificationService.isSubscribed();
    setIsSubscribed(subscribed);
  };

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        await notificationService.unsubscribe();
        setIsSubscribed(false);
      } else {
        const success = await notificationService.subscribe();
        if (success) setIsSubscribed(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleToggle} disabled={isLoading} variant={isSubscribed ? 'secondary' : 'primary'}>
      {isLoading ? 'Loading...' : isSubscribed ? '🔔 Notifications On' : '🔕 Enable Notifications'}
    </Button>
  );
};
