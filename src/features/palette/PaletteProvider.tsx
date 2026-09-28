import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CommandPalette } from './CommandPalette';

interface PaletteApi {
  open: () => void;
}

const PaletteContext = createContext<PaletteApi | null>(null);

/** Holds the command palette and the global Ctrl/Cmd + K shortcut. */
export function PaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const api = useMemo(() => ({ open }), [open]);

  return (
    <PaletteContext.Provider value={api}>
      {children}
      <CommandPalette open={isOpen} onOpenChange={setOpen} />
    </PaletteContext.Provider>
  );
}

export function usePalette(): PaletteApi {
  const context = useContext(PaletteContext);
  if (!context) throw new Error('usePalette must be used inside PaletteProvider');
  return context;
}

/** "Ctrl K" on Windows/Linux, "⌘K" on Mac. */
export function shortcutLabel(): string {
  const mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  return mac ? '⌘K' : 'Ctrl K';
}
