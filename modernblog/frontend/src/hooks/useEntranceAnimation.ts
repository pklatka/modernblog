import { HistoryAction } from '@tanstack/history';

// Global variable to track the navigation action
let globalAction: HistoryAction | undefined = undefined;

export const setGlobalAction = (action: { type: HistoryAction }) => {
  globalAction = action.type;
};

/**
 * Hook to determine if entrance animations should play.
 *
 * @returns Object containing `shouldAnimate` boolean
 */
export function useEntranceAnimation() {
  return {
    shouldAnimate: globalAction !== 'BACK',
  };
}
