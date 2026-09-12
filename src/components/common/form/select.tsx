import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

export interface SelectOption {
    value: string;
    label: string;
    /** Muted text shown on the right of the row, e.g. a raw enum name. */
    hint?: string;
    disabled?: boolean;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    /** Shown when `value` matches no option. */
    placeholder?: string;
    disabled?: boolean;
    /** Accessible name. Pass this, or point `labelledBy` at a <label>. */
    ariaLabel?: string;
    labelledBy?: string;
    id?: string;
    /** Width utilities for the wrapper, e.g. "w-full sm:w-[13rem]". */
    className?: string;
    /** `sm` matches the compact filter controls, `md` matches .form-control. */
    size?: 'sm' | 'md';
    /** Leading icon class on the trigger, e.g. "ri-filter-3-line". */
    icon?: string;
    /** Red-flagged trigger for validation errors. */
    invalid?: boolean;
}

const SIZES = {
    sm: 'py-[0.45rem] ps-3 pe-8 text-[0.8rem]',
    md: 'py-2 ps-[0.85rem] pe-9 text-[0.875rem]',
};

/**
 * Themed replacement for a native <select>.
 *
 * A native select paints its own arrow and renders its option list through the
 * OS, so it cannot follow the panel's theme - which is why the stock ones stood
 * out. This is the button + listbox pattern, so both the trigger and the list
 * are ours to style, and it keeps the keyboard and screen-reader behaviour a
 * select is expected to have: type-ahead, arrow/Home/End navigation,
 * Enter/Space to choose, Escape to dismiss, and focus returned to the trigger.
 */
const Select = ({
    value,
    onChange,
    options,
    placeholder = 'Select…',
    disabled = false,
    ariaLabel,
    labelledBy,
    id,
    className = '',
    size = 'sm',
    icon,
    invalid = false,
}: SelectProps) => {
    const reactId = useId();
    const listboxId = `${id ?? reactId}-listbox`;

    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [dropUp, setDropUp] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const typeahead = useRef({ query: '', at: 0 });

    const selectedIndex = useMemo(() => options.findIndex((o) => o.value === value), [options, value]);
    const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

    const firstEnabled = useCallback(
        (from: number, step: number) => {
            for (let i = 0; i < options.length; i += 1) {
                const index = (from + step * i + options.length * options.length) % options.length;
                if (!options[index]?.disabled) return index;
            }
            return -1;
        },
        [options],
    );

    const close = useCallback((focusTrigger = true) => {
        setOpen(false);
        setActiveIndex(-1);
        if (focusTrigger) buttonRef.current?.focus();
    }, []);

    const openList = useCallback(() => {
        if (disabled) return;
        // Flip above the trigger when the viewport cannot fit the panel below.
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) setDropUp(window.innerHeight - rect.bottom < 260 && rect.top > 260);
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled(0, 1));
        setOpen(true);
    }, [disabled, selectedIndex, firstEnabled]);

    const commit = useCallback(
        (index: number) => {
            const option = options[index];
            if (!option || option.disabled) return;
            onChange(option.value);
            close();
        },
        [options, onChange, close],
    );

    // Dismiss on a click elsewhere. Scrolling deliberately does NOT close the
    // panel: it is absolutely positioned inside the trigger's wrapper, so it
    // travels with the trigger, and closing on wheel events would fight anyone
    // scrolling a long form with the list open.
    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) close(false);
        };
        document.addEventListener('mousedown', onPointerDown);
        return () => document.removeEventListener('mousedown', onPointerDown);
    }, [open, close]);

    // Keep the highlighted row in view while arrowing through a long list.
    useEffect(() => {
        if (!open || activeIndex < 0) return;
        listRef.current?.querySelectorAll('[role="option"]')[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }, [open, activeIndex]);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (disabled) return;

        if (!open) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
                event.preventDefault();
                openList();
            }
            return;
        }

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                close();
                break;
            case 'Tab':
                close(false);
                break;
            case 'ArrowDown':
                event.preventDefault();
                setActiveIndex((i) => firstEnabled(i + 1, 1));
                break;
            case 'ArrowUp':
                event.preventDefault();
                setActiveIndex((i) => firstEnabled(i - 1, -1));
                break;
            case 'Home':
                event.preventDefault();
                setActiveIndex(firstEnabled(0, 1));
                break;
            case 'End':
                event.preventDefault();
                setActiveIndex(firstEnabled(options.length - 1, -1));
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                commit(activeIndex);
                break;
            default: {
                // Type-ahead: printable keys jump to the next matching label.
                if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return;
                const now = Date.now();
                const state = typeahead.current;
                state.query = now - state.at > 600 ? event.key : state.query + event.key;
                state.at = now;
                const query = state.query.toLowerCase();
                const match = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(query));
                if (match >= 0) setActiveIndex(match);
            }
        }
    };

    return (
        <Fragment>
            <div ref={wrapperRef} className={`relative ${className}`}>
                <button
                    ref={buttonRef}
                    id={id}
                    type="button"
                    role="combobox"
                    aria-controls={listboxId}
                    aria-expanded={open}
                    aria-haspopup="listbox"
                    aria-label={ariaLabel}
                    aria-labelledby={labelledBy}
                    aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
                    disabled={disabled}
                    onClick={() => (open ? close() : openList())}
                    onKeyDown={handleKeyDown}
                    className={`flex w-full items-center gap-2 rounded-md border bg-white text-start font-normal leading-[1.6] transition-colors
                        dark:bg-bodybg
                        ${SIZES[size]}
                        ${invalid ? 'border-danger' : 'border-inputborder dark:border-white/10'}
                        ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/60'}
                        ${open ? '!border-primary ring-1 ring-primary/30' : ''}`}
                >
                    {icon && <i className={`${icon} text-[0.9rem] text-textmuted shrink-0`}></i>}
                    <span
                        className={`grow truncate ${selected ? 'text-defaulttextcolor dark:text-defaulttextcolor/80' : 'text-textmuted'}`}
                    >
                        {selected ? selected.label : placeholder}
                    </span>
                    <i
                        className={`ri-arrow-down-s-line absolute end-2 top-1/2 -translate-y-1/2 text-[1rem] text-textmuted transition-transform ${open ? 'rotate-180' : ''}`}
                    ></i>
                </button>

                {open && (
                    <ul
                        ref={listRef}
                        id={listboxId}
                        role="listbox"
                        aria-label={ariaLabel}
                        tabIndex={-1}
                        className={`absolute z-[90] max-h-[15rem] w-full min-w-max overflow-y-auto rounded-md border border-defaultborder bg-white py-1 shadow-lg
                            dark:border-white/10 dark:bg-bodybg
                            ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                    >
                        {options.length === 0 && (
                            <li className="px-3 py-2 text-[0.8rem] text-textmuted">No options</li>
                        )}

                        {options.map((option, index) => {
                            const isSelected = option.value === value;
                            const isActive = index === activeIndex;
                            return (
                                <li
                                    key={option.value}
                                    id={`${listboxId}-${index}`}
                                    role="option"
                                    aria-selected={isSelected}
                                    aria-disabled={option.disabled || undefined}
                                    onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                                    onClick={() => commit(index)}
                                    className={`flex cursor-pointer items-center gap-2 px-3 py-[0.4rem] text-[0.8rem] transition-colors
                                        ${option.disabled ? 'cursor-not-allowed opacity-50' : ''}
                                        ${isActive && !option.disabled ? 'bg-primary/10' : ''}
                                        ${isSelected ? 'font-semibold text-primary' : 'text-defaulttextcolor dark:text-defaulttextcolor/80'}`}
                                >
                                    <span className="grow truncate">{option.label}</span>
                                    {option.hint && (
                                        <span className="shrink-0 text-[0.6875rem] text-textmuted">{option.hint}</span>
                                    )}
                                    <i
                                        className={`ri-check-line shrink-0 text-[0.85rem] text-primary ${isSelected ? '' : 'invisible'}`}
                                    ></i>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Fragment>
    );
};

export default Select;
