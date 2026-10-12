import { useEffect, useRef, type RefObject } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

export * from './useMoney';
export * from './useAsync';
export * from './useCartTotals';

/** Sets document.title as "<title> · KitchenScaleCo". */
export function useDocumentTitle(title?: string) {
  const storeName = useSettingsStore((s) => s.settings.storeName);
  useEffect(() => {
    document.title = title ? `${title} · ${storeName}` : `${storeName} — Mini Spoon Scale`;
  }, [title, storeName]);
}

/** Prevent background scrolling while a drawer/modal is open. */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

/** Call `handler` when a pointerdown happens outside `ref`, or Escape is pressed. */
export function useDismiss<T extends HTMLElement>(ref: RefObject<T | null>, handler: () => void, active = true) {
  const cb = useRef(handler);
  cb.current = handler;
  useEffect(() => {
    if (!active) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cb.current();
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, active]);
}
