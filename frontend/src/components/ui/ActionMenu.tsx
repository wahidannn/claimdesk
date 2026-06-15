import { MoreHorizontal } from 'lucide-react';
import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/utils';

type ActionMenuItem = {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  asChild?: ReactNode;
};

type ActionMenuProps = {
  items: ActionMenuItem[];
  label?: string;
};

export function ActionMenu({ items, label = 'Open row actions' }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', closeOnPointerDown);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnPointerDown);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function toggleMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        top: rect.bottom + 6,
        left: Math.min(window.innerWidth - 188, Math.max(8, rect.right - 176)),
      });
    }
    setOpen((value) => !value);
  }

  function closeAndRun(action?: () => void) {
    setOpen(false);
    action?.();
  }

  const availableItems = items.filter(Boolean);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-mutedText transition hover:border-accent/30 hover:bg-accentSoft hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        aria-label={label}
        aria-expanded={open}
        onClick={toggleMenu}
      >
        <MoreHorizontal size={17} />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="fixed z-50 w-44 rounded-lg border border-border bg-surface p-1 shadow-dropdown"
          style={{ top: position.top, left: position.left }}
        >
          {availableItems.map((item) =>
            item.asChild && isValidElement(item.asChild) ? (
              cloneElement(item.asChild as ReactElement<{ className?: string; onClick?: () => void }>, {
                key: item.label,
                className: cn(menuItemClassName(item.danger, item.disabled), item.asChild.props.className),
                onClick: () => closeAndRun(item.onClick),
              })
            ) : (
              <button
                key={item.label}
                type="button"
                className={menuItemClassName(item.danger, item.disabled)}
                disabled={item.disabled}
                onClick={() => closeAndRun(item.onClick)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ),
          )}
        </div>
      )}
    </>
  );
}

function menuItemClassName(danger?: boolean, disabled?: boolean) {
  return cn(
    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition',
    danger ? 'text-red-600 hover:bg-red-50' : 'text-ink hover:bg-accentSoft hover:text-accent',
    disabled && 'pointer-events-none opacity-50',
  );
}
