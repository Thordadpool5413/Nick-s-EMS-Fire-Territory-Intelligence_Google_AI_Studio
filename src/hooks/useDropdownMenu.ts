/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useClickOutside } from './useClickOutside';

export interface UseDropdownMenuOptions {
  hoverDelay?: number;
  closeOnSelect?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useDropdownMenu(options: UseDropdownMenuOptions = {}) {
  const { hoverDelay = 250, onClose, onOpen } = options;
  const [isOpen, setIsOpen] = useState(false);
  const [openMode, setOpenMode] = useState<'hover' | 'click' | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const open = useCallback(
    (mode: 'hover' | 'click' = 'click') => {
      clearLeaveTimer();
      setIsOpen(true);
      setOpenMode(mode);
      onOpen?.();
    },
    [clearLeaveTimer, onOpen]
  );

  const close = useCallback(() => {
    clearLeaveTimer();
    setIsOpen(false);
    setOpenMode(null);
    onClose?.();
  }, [clearLeaveTimer, onClose]);

  const toggle = useCallback(
    (mode: 'click' = 'click') => {
      clearLeaveTimer();
      setIsOpen((prev) => {
        const next = !prev;
        setOpenMode(next ? mode : null);
        if (next) onOpen?.();
        else onClose?.();
        return next;
      });
    },
    [clearLeaveTimer, onClose, onOpen]
  );

  const handleMouseEnter = useCallback(() => {
    clearLeaveTimer();
    // Only engage hover mode if not explicitly locked open via click
    if (!isOpen) {
      open('hover');
    }
  }, [clearLeaveTimer, isOpen, open]);

  const handleMouseLeave = useCallback(() => {
    clearLeaveTimer();
    // Pinned/clicked menus stay open until click-away or escape; hover menus close after delay
    if (openMode === 'hover') {
      leaveTimerRef.current = setTimeout(() => {
        close();
      }, hoverDelay);
    }
  }, [clearLeaveTimer, openMode, hoverDelay, close]);

  // Click-away listener: closes menu when user clicks outside the container
  useClickOutside(
    containerRef,
    () => {
      if (isOpen) {
        close();
      }
    },
    { enabled: isOpen, closeOnEscape: true }
  );

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearLeaveTimer();
    };
  }, [clearLeaveTimer]);

  return {
    isOpen,
    openMode,
    open,
    close,
    toggle,
    containerRef,
    triggerRef,
    menuRef,
    handleMouseEnter,
    handleMouseLeave
  };
}
