/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

export type RefOrElement =
  | React.RefObject<HTMLElement | null>
  | HTMLElement
  | null
  | undefined;

export type TargetRef = RefOrElement | RefOrElement[];

export interface UseClickOutsideOptions {
  enabled?: boolean;
  closeOnEscape?: boolean;
  eventType?: 'mousedown' | 'mouseup' | 'click' | 'pointerdown';
}

/**
 * Robust click-outside / click-away hook.
 * Handles single or multiple refs/elements, touch events, and Escape key dismissals.
 */
export function useClickOutside(
  targetRefs: TargetRef,
  onClickOutside: (event: MouseEvent | TouchEvent | KeyboardEvent) => void,
  options: UseClickOutsideOptions = {}
) {
  const { enabled = true, closeOnEscape = true, eventType = 'mousedown' } = options;
  const handlerRef = useRef(onClickOutside);

  // Keep callback reference updated without triggering re-subscriptions
  useEffect(() => {
    handlerRef.current = onClickOutside;
  }, [onClickOutside]);

  useEffect(() => {
    if (!enabled) return;

    const refs = Array.isArray(targetRefs) ? targetRefs : [targetRefs];

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      // Verify whether the click landed inside any of the tracked element refs
      const isInside = refs.some((ref) => {
        if (!ref) return false;
        const el = typeof ref === 'object' && 'current' in ref ? ref.current : ref;
        return el ? el.contains(target) : false;
      });

      if (!isInside) {
        handlerRef.current(event);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        handlerRef.current(event);
      }
    };

    document.addEventListener(eventType, handlePointerDown as EventListener, true);
    if (eventType !== 'pointerdown') {
      document.addEventListener('touchstart', handlePointerDown as EventListener, true);
    }
    if (closeOnEscape) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener(eventType, handlePointerDown as EventListener, true);
      if (eventType !== 'pointerdown') {
        document.removeEventListener('touchstart', handlePointerDown as EventListener, true);
      }
      if (closeOnEscape) {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [enabled, closeOnEscape, eventType, targetRefs]);
}
