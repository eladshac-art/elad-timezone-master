'use client';

import React, { useMemo, useState, useRef } from 'react';
import ComboBox from '../components/ComboBox';
import AbbrevSelect from '../components/AbbrevSelect';
import { displayForIana, buildTimeZoneOptions } from '../lib/tz-data';

// ---------- helpers ----------
const pad = (n: number) => n.toString().padStart(2, '0');

function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Etc/UTC';
  } catch {
    return 'Etc/UTC';
  }
}
function toLocalDateInputValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fromDateAndTime(dateStr: string, hour24: number, minute: number, mer: 'AM' | 'PM') {
  const [y, m, day] = dateStr.split('-').map(Number);
  let h = hour24;
  if (mer === 'PM' && h < 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return new Date(y, m - 1, day, h, minute);
}
function getHourInTZ(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '0';
  return parseInt(h, 10);
}
function tzOffsetMinutes(date: Date, timeZone: string) {
  const asStr = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
  const [m, d, y, hh, mm, ss] = asStr.replace(',', '').split(/[\/\s:]/).map((v) => parseInt(v, 10));
  const utcMillis = Date.UTC(y, m - 1, d, hh, mm, ss);
  return (utcMillis - date.getTime()) / 60000;
}
const isWork = (h: number) => h >= 9 && h < 18;

// ---------- UI ----------
export default function Page() {
  // base state
  const userTZ = useMemo(getUserTimeZone, []);
  const [baseIana, setBaseIana] = useState<string>(userTZ);
  const [targets, setTargets] = useState<string[]>([]);
  const [dateStr, setDateStr] = useState(toLocalDateInputValue(new Date()));
  const [hour12, setHour12] = useState(5);
  const [minute, setMinute] = useState(0);
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('PM');
  const [contactName, setContactName] = useState('');
  const [contactTz, setContactTz] = useState<string>('Etc/UTC');
  const [contacts, setContacts] = useState<{ id: string; name: string; iana: string }[]>([]);

  // make the date input clickable anywhere (not just the icon)
  const dateRef = useRef<HTMLInputElement>(null);
  const openDate = () => {
    const el = dateRef.current;
    if (!el) return;
    try {
      // @ts-ignore
      if (typeof el.showPicker === 'function') el.showPicker();
      else el.focus();
    } catch {
      el.focus();
    }
  };

  // build computed
  const baseDate = useMemo(
    () => fromDateAndTime(dateStr, hour12 === 12 ? 12 : hour12, minute, meridiem),
    [dateStr, hour12, minute, meridiem],
  );

  const allRows = useMemo(() => {
    const all = [baseIana, ...targets];
    return all.map((iana) => {
      const datePart = new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        timeZone: iana,
      }).format(baseDate);
      const timePart = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: iana,
      }).format(baseDate);
      const hour = getHourInTZ(baseDate, iana);
      const off = tzOffsetMinutes(baseDate, iana);
      return { iana, label: displayForIana(iana), hour, datePart, timePart, offsetMin: off };
    });
  }, [baseDate, baseIana, targets]);

  const sorted = useMemo(() => [...allRows].sort((a, b) => a.offsetMin - b.offsetMin), [allRows]);

  const tzOptions = useMemo(() => buildTimeZoneOptions(), []);

  // handlers
  const addTarget = (iana: string) => {
    if (iana && !targets.includes(iana) && iana !== baseIana) setTargets((t) => [...t, iana]);
  };
  const removeTarget = (iana: string) => setTargets((t) => t.filter((x) => x !== iana));
  const saveContact = () => {
    if (!contactName || !contactTz) return;
    setContacts((arr) => [...arr, { id: crypto.randomUUID(), name: contactName, iana: contactTz }]);
    setContactName('');
    setContactTz('Etc/UTC');
  };
  const removeContact = (id: string) => setContacts((arr) => arr.filter((c) => c.id !== id));

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        {/* MAIN */}
        <div className="space-y-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-semibold">Time Zone Planner</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Schedule meetings across time zones</p>
          </header>

          {/* Row: Base TZ + Date + Time (12h/15min) */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="relative">
              <label className="text-sm font-medium">Base Time Zone</label>
              <ComboBox
                className="mt-2"
                value={baseIana}
                onChange={(opt) => {
                  if (opt) {
                    setBaseIana(opt.value);
                  }
                }}
                options={tzOptions}
                placeholder={displayForIana(baseIana)}
                clearable={false}
                badgeFor={(opt) => (opt.value === baseIana ? 'Base' : undefined)}
              />
            </div>

            <div onClick={openDate}>
              <label className="text-sm font-medium">Date</label>
              <input
                ref={dateRef}
                type="date"
                className="w-full mt-2 border rounded-xl p-3 bg-white dark:bg-neutral-900 cursor-pointer"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Time</label>
              <div className="flex gap-2 mt-2">
                <select
                  className="border rounded-xl p-3 bg-white dark:bg-neutral-900"
                  value={hour12}
                  onChange={(e) => setHour12(parseInt(e.target.value, 10))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {pad(h)}
                    </option>
                  ))}
                </select>
                <select
                  className="border rounded-xl p-3 bg-white dark:bg-neutral-900"
                  value={pad(minute)}
                  onChange={(e) => setMinute(parseInt(e.target.value, 10))}
                >
                  {['00', '15', '30', '45'].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  className="border rounded-xl p-3 bg-white dark:bg-neutral-900"
                  value={meridiem}
                  onChange={(e) => setMeridiem(e.target.value as 'AM' | 'PM')}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </section>

          {/* Add TZ + quick abbr (as searchable dropdown) + chips */}
          <section className="space-y-3">
            <label className="text-sm font-medium">Add Time Zone</label>
            <ComboBox
              value={null}
              onChange={(opt) => {
                if (opt) {
                  addTarget(opt.value);
                }
              }}
              options={tzOptions}
              placeholder="Type to search…"
              clearable={false}
            />

            {/* selected targets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {targets.map((iana) => (
                <span key={iana} className="inline-flex items-center gap-2 border rounded-full px-3 py-2">
                  <span className="text-sm font-medium">{displayForIana(iana)}</span>
                  <button className="text-neutral-500 hover:text-red-600" onClick={() => removeTarget(iana)}>
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </section>

          {/* Table */}
          <section className="overflow-x-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50 dark:bg-neutral-900">
                  <th className="p-3 font-medium">Time Zone</th>
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Time</th>
                  <th className="p-3 font-medium">UTC Offset</th>
                  <th className="p-3 font-medium">Work Window</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const oh = Math.floor(Math.abs(row.offsetMin) / 60);
                  const om = Math.abs(row.offsetMin) % 60;
                  const sign = row.offsetMin >= 0 ? '+' : '-';
                  const work = isWork(row.hour);
                  return (
                    <tr
                      key={row.iana}
                      className={`border-t ${
                        work ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50/40 dark:bg-red-950/20'
                      }`}
                    >
                      <td className="p-3 font-medium">
                        {row.label} {row.iana === baseIana && <span className="ml-1 text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Base</span>}
                      </td>
                      <td className="p-3 text-neutral-500">{row.datePart}</td>
                      <td className="p-3 font-mono text-lg font-semibold">{row.timePart}</td>
                      <td className="p-3 text-neutral-500 font-mono">
                        UTC{sign}
                        {pad(oh)}:{pad(om)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs ${
                            work
                              ? 'bg-green-600/10 text-green-700 dark:text-green-300'
                              : 'bg-red-600/10 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {work ? 'Work Hours (9–18)' : 'Outside Hours (9–18)'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <footer className="text-center text-xs text-neutral-500 pt-4">
            Built with Love ❤️ by Elad Shachar 🦊
          </footer>
        </div>

        {/* SIDEBAR: Contacts */}
        <aside className="space-y-4">
          <div className="border-l md:border-l md:pl-6">
            <h2 className="text-base font-semibold mb-2">Contacts</h2>
            <div className="space-y-3">
              <input
                className="w-full border rounded-xl p-3 bg-white dark:bg-neutral-900"
                placeholder="Contact name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              <AbbrevSelect placeholder="Quick abbreviation (ET, PT, CET…)" onPick={(iana) => setContactTz(iana)} />
              <ComboBox
                className="mt-1"
                value={contactTz}
                onChange={(opt) => {
                  if (opt) setContactTz(opt.value);
                }}
                options={tzOptions}
                placeholder="Type a time zone or city (e.g. Dallas, Tel-Aviv)"
                clearable={false}
              />
              <button onClick={saveContact} className="px-4 py-3 rounded-xl border hover:bg-neutral-50 dark:hover:bg-neutral-800">
                Add Contact
              </button>
              <div className="mt-2 space-y-2">
                {contacts.length === 0 && <div className="text-sm text-neutral-500">No contacts yet.</div>}
                {contacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between border rounded-xl p-3">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-neutral-500">{displayForIana(c.iana)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-blue-600 hover:underline" onClick={() => addTarget(c.iana)}>
                        Add
                      </button>
                      <button className="text-red-600 hover:underline" onClick={() => removeContact(c.id)}>
                        Del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}