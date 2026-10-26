import React, { useState } from "react";
import { UserPlus, Trash2, PhoneCall, MessageSquare, Plus } from "lucide-react";
import { useApp, Contact } from "../context/AppContext";
import { cn } from "../lib/utils";

const ROLES: NonNullable<Contact["role"]>[] = ["Family", "Embassy", "Medical", "Emergency"];

export function ContactsScreen() {
  const { contacts, addContact, removeContact, location, activeCity } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<NonNullable<Contact["role"]>>("Family");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) {
      addContact({
        name: name.trim(),
        phone: phone.trim(),
        role,
      });
      setName("");
      setPhone("");
      setIsAdding(false);
    }
  };

  const coordsString = location
    ? `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`
    : `${activeCity.lat.toFixed(4)},${activeCity.lng.toFixed(4)}`;

  const smsBody = encodeURIComponent(
    `SafeVoyage AI Location Update: I am in ${activeCity.name} (${coordsString}). Map: https://maps.google.com/?q=${coordsString}`
  );

  return (
    <div className="flex flex-col flex-1 px-5 pt-4 pb-5 gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Emergency Contacts</h2>
          <p className="text-[11px] text-slate-500">
            One-tap dial or send live GPS SMS
          </p>
        </div>
        <span className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full tabular-nums">
          {contacts.length} Linked
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 no-scrollbar">
        {contacts.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center text-center py-16 text-slate-400">
            <UserPlus className="w-10 h-10 mb-2 stroke-1" />
            <p className="text-xs">
              No emergency contacts saved yet.
              <br />
              Add local emergency numbers or family below.
            </p>
          </div>
        )}

        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between gap-3 p-3.5 border border-slate-200/80 rounded-2xl bg-white shadow-xs"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-indigo-600">
                  {contact.role || "Trusted"}
                </span>
                {contact.notes && (
                  <span className="text-[10px] text-slate-400 truncate">
                    · {contact.notes}
                  </span>
                )}
              </div>
              <p className="font-bold text-slate-900 text-sm truncate mt-0.5">
                {contact.name}
              </p>
              <p className="text-xs font-mono font-semibold text-slate-500 tabular-nums">
                {contact.phone}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`sms:${contact.phone}?body=${smsBody}`}
                className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors"
                title="Send GPS Location SMS"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
              <a
                href={`tel:${contact.phone}`}
                className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                title="Call Contact"
              >
                <PhoneCall className="w-4 h-4" />
              </a>
              <button
                onClick={() => removeContact(contact.id)}
                className="w-8 h-9 rounded-xl text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors cursor-pointer"
                title="Delete Contact"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAdding ? (
        <form
          onSubmit={handleAdd}
          className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 space-y-3"
        >
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Name
            </label>
            <input
              type="text"
              placeholder="e.g. Hotel Desk, Embassy, Mom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Phone
            </label>
            <input
              type="tel"
              placeholder="+1 234 567 8900"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer",
                  role === r
                    ? "bg-indigo-50 border-indigo-500 text-indigo-600"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 bg-slate-100 text-slate-600 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              Save Contact
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add Trusted Contact
        </button>
      )}
    </div>
  );
}
