"use client";

import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PartThumbnail } from "@/components/garage/PartThumbnail";
import type { CanonicalPart } from "@/lib/schema";

type Props = {
  title: string;
  options: CanonicalPart[];
  selectedId: number;
  open: boolean;
  onPick: (id: number) => void;
  onClose: () => void;
};

const TITLE_ID = "ac6-assembly-picker-title";
const HINT_ID = "ac6-assembly-picker-hint";

export function GarageAssemblyPartPicker({
  title,
  options,
  selectedId,
  open,
  onPick,
  onClose,
}: Props) {
  const dlg = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
      const id = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    if (el.open) el.close();
    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((p) => p.identity.name.toLowerCase().includes(s));
  }, [options, q]);

  function focusListRow(index: number) {
    const root = listRef.current;
    if (!root) return;
    const btns = [...root.querySelectorAll<HTMLButtonElement>("button.ac6-assembly-picker-row")];
    const clamped = Math.max(0, Math.min(btns.length - 1, index));
    btns[clamped]?.focus();
  }

  function listKeyNav(e: ReactKeyboardEvent<HTMLUListElement>) {
    const t = e.target;
    if (!(t instanceof HTMLButtonElement) || !t.classList.contains("ac6-assembly-picker-row")) {
      return;
    }
    const root = listRef.current;
    if (!root) return;
    const btns = [...root.querySelectorAll<HTMLButtonElement>("button.ac6-assembly-picker-row")];
    const i = btns.indexOf(t);
    if (i < 0) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      let next = i;
      if (e.key === "ArrowDown") next = Math.min(btns.length - 1, i + 1);
      else if (e.key === "ArrowUp") next = Math.max(0, i - 1);
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = btns.length - 1;
      btns[next]?.focus();
    }
  }

  return (
    <dialog
      ref={dlg}
      className="ac6-assembly-picker-dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onClose={onClose}
    >
      <div className="ac6-assembly-picker-inner">
        <div className="ac6-strip ac6-assembly-picker-head">
          <p
            id={TITLE_ID}
            className="ac6-block-title m-0 leading-none"
          >
            {title}
          </p>
          <form method="dialog">
            <button
              type="submit"
              className="ac6-assembly-picker-close"
            >
              CLOSE
            </button>
          </form>
        </div>
        <p
          id={HINT_ID}
          className="sr-only"
        >
          Filter the list. Arrow keys move between parts when a row is focused; Arrow Down from
          filter jumps to the list. Enter chooses the focused part. Escape closes.
        </p>
        <label className="ac6-assembly-picker-search">
          <span className="sr-only">Filter parts</span>
          <input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" && filtered.length > 0) {
                e.preventDefault();
                requestAnimationFrame(() => focusListRow(0));
              }
            }}
            placeholder="FILTER…"
            className="ac6-inset-field w-full px-2 py-1 text-[11px] uppercase tracking-wide"
            autoComplete="off"
            aria-describedby={HINT_ID}
          />
        </label>
        {filtered.length === 0 ? (
          <p className="ac6-chart-hint px-2 py-4 text-center uppercase tracking-wide">
            NO MATCHING PARTS.
          </p>
        ) : (
          <ul
            ref={listRef}
            className="ac6-assembly-picker-list"
            aria-label="Matching parts"
            onKeyDown={listKeyNav}
          >
            {filtered.map((p) => {
              const id = p.identity.id;
              const active = id === selectedId;
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    className={
                      active ? "ac6-assembly-picker-row is-active" : "ac6-assembly-picker-row"
                    }
                    onClick={() => {
                      onPick(id);
                      onClose();
                    }}
                  >
                    <PartThumbnail
                      partName={p.identity.name}
                      size="sm"
                    />
                    <span className="ac6-assembly-picker-name">{p.identity.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </dialog>
  );
}
