import React, { createContext, useCallback, useEffect, useState } from 'react';
import { fetchInitialAlerts } from './alerts.api';
import useAlertSocket from './useAlertSocket';

export const AlertsContext = createContext({
  alerts: [],
  markHandled: () => {},
});

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  // load initial
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    (async () => {
      const initial = await fetchInitialAlerts(controller.signal);
      if (!mounted) return;
      setAlerts(Array.isArray(initial) ? initial.slice(0, 100) : []);
    })();
    return () => { mounted = false; controller.abort(); };
  }, []);

  const onNewAlert = useCallback((a) => {
    setAlerts((prev) => {
      if (prev.find(x => x.image_id === a.image_id && x.timestamp === a.timestamp)) return prev;
      const next = [a, ...prev];
      return next.slice(0, 100);
    });
  }, []);

  useAlertSocket({ onNewAlert });

  const markHandled = useCallback((alert) => {
    setAlerts((prev) => prev.filter(a => !(a.image_id === alert.image_id && a.timestamp === alert.timestamp)));
  }, []);

  return (
    <AlertsContext.Provider value={{ alerts, markHandled }}>
      {children}
    </AlertsContext.Provider>
  );
}
