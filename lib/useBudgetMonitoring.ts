import { useEffect, useRef, useCallback } from 'react';
import { Project } from './types';
import { checkProjectBudgetAndMargin } from './notificationService';

export function useBudgetMonitoring(
  projects: Project[],
  onAlert: (title: string, message: string, type: 'urgent' | 'reminder' | 'success') => void
) {
  const notifiedBudgetAlertsRef = useRef<Set<string>>(new Set());

  const evaluateAndTriggerBudgetMarginAlerts = useCallback(
    (projectList: Project[], forceImmediate: boolean = false): number => {
      let triggeredCount = 0;

      projectList.forEach((proj) => {
        const margin = proj.expectedProfitMarginPercent ?? 15;
        const alerts = checkProjectBudgetAndMargin(proj, margin);

        alerts.forEach((alert) => {
          const alertKey = `${alert.projectId}-${alert.type}`;
          const shouldEmit = forceImmediate || !notifiedBudgetAlertsRef.current.has(alertKey);

          if (shouldEmit) {
            if (!forceImmediate) {
              notifiedBudgetAlertsRef.current.add(alertKey);
            }

            onAlert(alert.title, alert.message, 'urgent');
            triggeredCount += 1;
          }
        });
      });

      return triggeredCount;
    },
    [onAlert]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      evaluateAndTriggerBudgetMarginAlerts(projects, false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [projects, evaluateAndTriggerBudgetMarginAlerts]);

  return { evaluateAndTriggerBudgetMarginAlerts };
}
