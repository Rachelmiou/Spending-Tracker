import { useState, useCallback, useRef } from "react";

const CATEGORIES = [
  { id: "groceries", label: "🛒 Groceries", color: "#16a34a" },
  { id: "dining", label: "🍽️ Dining & Bars", color: "#ea580c" },
  { id: "transport", label: "🚗 Transport", color: "#2563eb" },
  { id: "shopping", label: "🛍️ Shopping", color: "#db2777" },
  { id: "utilities", label: "💡 Utilities", color: "#ca8a04" },
  { id: "entertainment", label: "🎬 Entertainment", color: "#7c3aed" },
  { id: "health", label: "💊 Health & Wellness", color: "#0891b2" },
  { id: "travel", label: "✈️ Travel", color: "#0284c7" },
  { id: "subscriptions", label: "📱 Subscriptions", color: "#9333ea" },
  { id: "income", label: "💰 Income", color: "#15803d" },
  { id: "transfer", label: "🔄 Transfer", color: "#64748b" },
  { id: "other", label: "📦 Other", color: "#dc2626" },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

function guessCategory(description) {
  const d = description.toLowerCase();
  if (/payroll|salary|deposit|direct dep|paycheck|e-transfer|etransfer|interac/i.test(d)) return "income";
  if (/transfer|zelle|venmo|paypal|wire|interac|e-tfr/i.test(d)) return "transfer";
  if (/grocery|safeway|kroger|whole foods|trader joe|costco|aldi|publix|wegmans|sprouts|market|loblaws|sobeys|metro |food basics|no frills|freshco|superstore|maxi |iga |provigo|farm boy|longos|co-op food/i.test(d)) return "groceries";
  if (/restaurant|mcdonald|starbucks|coffee|cafe|pizza|sushi|taco|burger|diner|chipotle|doordash|ubereats|grubhub|skip the dishes|skipthedishes|bar |tavern|brew|tim hortons|harveys|swiss chalet|boston pizza|east side mario|the keg|second cup|a&w|dairy queen|wendys|popeyes/i.test(d)) return "dining";
  if (/uber|lyft|taxi|parking|gas|shell|chevron|bp |exxon|sunoco|transit|metro|bus |train|toll|petro canada|petrocanada|esso|husky|pioneer gas|presto card|ttc |translink|stm |oct card|go transit|via rail/i.test(d)) return "transport";
  if (/amazon|walmart|target|ebay|etsy|apple store|best buy|macy|nordstrom|zara|h&m|gap|nike|adidas|canadian tire|winners|homesense|sport chek|atmosphere|marks |reitmans|simons|hudson bay|the bay|dollarama|staples/i.test(d)) return "shopping";
  if (/netflix|spotify|hulu|disney|youtube|prime|hbo|apple tv|subscription|software|adobe|microsoft|crave |cravetv|paramount|dazn/i.test(d)) return "subscriptions";
  if (/electric|water|gas bill|internet|comcast|verizon|at&t|tmobile|utility|pg&e|hydro |bc hydro|enbridge|fortis|atco|bell canada|rogers|telus|shaw|videotron|fido|koodo|virgin mobile|freedom mobile/i.test(d)) return "utilities";
  if (/doctor|pharmacy|cvs|walgreens|rite aid|dental|vision|gym|fitness|yoga|medical|hospital|shoppers drug|rexall|jean coutu|pharmasave|remedy|lawtons|health/i.test(d)) return "health";
  if (/hotel|airbnb|flight|airline|delta|united|southwest|marriott|hilton|expedia|booking|air canada|westjet|porter air|sunwing|transat|fairmont|via rail/i.test(d)) return "travel";
  if (/cinema|movie|theater|theatre|concert|ticketmaster|steam|playstation|xbox|cineplex|landmark cinema/i.test(d)) return "entertainment";
  return "other";
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const transactions = [];
  let skippedHeader = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());

    if (!skippedHeader && isNaN(parseFloat(cols[cols.length - 1])) && isNaN(parseFloat(cols[cols.length - 2]))) {
      skippedHeader = true;
      continue;
    }
    skippedHeader = true;

    let date = "", description = "", amount = 0;

    const dateCol = cols.find((c) => /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(c) || /\d{4}-\d{2}-\d{2}/.test(c));
    date = dateCol || cols[0];

    const numericCols = cols.map((c, i) => ({ val: parseFloat(c.replace(/[$,]/g, "")), i })).filter((c) => !isNaN(c.val));

    if (numericCols.length >= 2) {
      const debit = numericCols[numericCols.length - 2]?.val || 0;
      const credit = numericCols[numericCols.length - 1]?.val || 0;
      amount = credit > 0 ? credit : -Math.abs(debit);
    } else if (numericCols.length === 1) {
      amount = numericCols[0].val;
    }

    const usedIndices = new Set([cols.indexOf(dateCol)]);
    numericCols.forEach((n) => usedIndices.add(n.i));
    description = cols.filter((_, i) => !usedIndices.has(i) && cols[i].length > 1).join(" ") || cols[1] || "Unknown";

    if (!description || description.length < 2) continue;

    transactions.push({
      id: Math.random().toString(36).slice(2),
      date: date || "—",
      description,
      amount,
      category: guessCategory(description),
    });
  }
  return transactions;
}

function CategoryDropdown({ value, onChange }) {
  const cat = CAT_MAP[value];
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "#ffffff",
        border: `1.5px solid ${cat?.color || "#d1d5db"}`,
        color: cat?.color || "#374151",
        borderRadius: "6px",
        padding: "4px 8px",
        fontSize: "12px",
        cursor: "pointer",
        outline: "none",
        fontFamily: "inherit",
        minWidth: "170px",
        fontWeight: "500",
      }}
    >
      {CATEGORIES.map((c) => (
        <option key={c.id} value={c.id}>{c.label}</option>
      ))}
    </select>
  );
}

function SummaryCard({ cat, amount, count }) {
  const pct = Math.min(100, Math.abs(amount) / 50);
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: "12px",
      padding: "14px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: cat.color }} />
      <div style={{ fontSize: "13px", color: "#6b7280" }}>{cat.label}</div>
      <div style={{ fontSize: "22px", fontWeight: "700", color: amount >= 0 ? "#16a34a" : "#111827", fontVariantNumeric: "tabular-nums" }}>
        {amount >= 0 ? "+" : ""}${Math.abs(amount).toFixed(2)}
      </div>
      <div style={{ fontSize: "11px", color: "#9ca3af" }}>{count} transaction{count !== 1 ? "s" : ""}</div>
      <div style={{ height: "3px", background: "#f3f4f6", borderRadius: "2px" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: cat.color, borderRadius: "2px", transition: "width 0.6s ease", opacity: 0.7 }} />
      </div>
    </div>
  );
}

export default function SpendingTracker() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("tracker-transactions");
    return saved ? JSON.parse(saved) : [];
  });
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState("transactions");
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState(-1);
  const fileRef = useRef();

  const updateCategory = useCallback((id, cat) => {
    setTransactions((prev) => {
      const updated = prev.map((t) => t.id === id ? { ...t, category: cat } : t);
      localStorage.setItem("tracker-transactions", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleFiles = useCallback((files) => {
    const readers = files.map((file) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(parseCSV(e.target.result));
        reader.readAsText(file);
      })
    );
    Promise.all(readers).then((results) => {
      const merged = results.flat().map((t) => ({
        ...t,
        id: Math.random().toString(36).slice(2),
      }));
      setTransactions((prev) => {
        const updated = [...prev, ...merged];
        localStorage.setItem("tracker-transactions", JSON.stringify(updated));
        return updated;
      });
    });
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFiles(files);
  }, [handleFiles]);

  const filtered = transactions
    .filter((t) => {
      const matchSearch = t.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === "all" || t.category === filterCat;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sortCol === "amount") return sortDir * (a.amount - b.amount);
      if (sortCol === "description") return sortDir * a.description.localeCompare(b.description);
      return sortDir * a.date.localeCompare(b.date);
    });

  const totals = CATEGORIES.map((cat) => {
    const catTx = transactions.filter((t) => t.category === cat.id);
    return { cat, amount: catTx.reduce((s, t) => s + t.amount, 0), count: catTx.length };
  }).filter((s) => s.count > 0).sort((a, b) => a.amount - b.amount);

  const totalSpend = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => -d);
    else { setSortCol(col); setSortDir(-1); }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#e0d7d1",
      color: "#111827",
      fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
      padding: "0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f3f4f6; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        select option { background: #ffffff; color: #111827; }
        .tx-row:hover { background: #f9fafb !important; }
        .sort-btn:hover { color: #111827 !important; }
        .tab-btn:hover { background: #f3f4f6 !important; }
        .upload-zone:hover { border-color: #6b7280 !important; background: #f3f4f6 !important; }
        .clear-btn:hover { background: #fef2f2 !important; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #e5e7eb",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
        background: "#e0d7d1",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px", color: "#736b6b" }}>
            SPENDING TRACKER<span style={{ color: "#6b7280" }}>.</span>
          </div>
          <div style={{ fontSize: "11px", color: "#8c8282", marginTop: "2px" }}>spending tracker & categorizer</div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px 18px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>INCOME</div>
            <div style={{ fontSize: "18px", fontWeight: "600", color: "#16a34a" }}>+${totalIncome.toFixed(2)}</div>
          </div>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 18px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>SPENT</div>
            <div style={{ fontSize: "18px", fontWeight: "600", color: "#dc2626" }}>${Math.abs(totalSpend).toFixed(2)}</div>
          </div>
          <div style={{
            background: (totalIncome + totalSpend) >= 0 ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${(totalIncome + totalSpend) >= 0 ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: "10px", padding: "10px 18px", textAlign: "center"
          }}>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>NET</div>
            <div style={{ fontSize: "18px", fontWeight: "600", color: (totalIncome + totalSpend) >= 0 ? "#16a34a" : "#dc2626" }}>
              {(totalIncome + totalSpend) >= 0 ? "+" : ""}${(totalIncome + totalSpend).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* Upload Zone */}
        <div
          className="upload-zone"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current.click()}
          style={{
            border: `1.5px dashed ${dragging ? "#736b6b" : "#736b6b"}`,
            borderRadius: "12px",
            padding: "20px 24px",
            textAlign: "center",
            cursor: "pointer",
            marginBottom: "24px",
            background: dragging ? "#f3f4f6" : "#ffffff",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <input ref={fileRef} type="file" accept=".csv,.txt" multiple style={{ display: "none" }} onChange={(e) => handleFiles(Array.from(e.target.files))} />
          <span style={{ fontSize: "22px" }}>📂</span>
          <div>
            <div style={{ fontSize: "13px", color: "#374151" }}>Drop one or more bank statement CSVs or click to upload</div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "3px" }}>Upload multiple files at once — statements are merged together</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {["transactions", "summary"].map((v) => (
            <button key={v} className="tab-btn" onClick={() => setView(v)} style={{
              background: view === v ? "#6a7173" : "#ffffff",
              border: `1px solid ${view === v ? "#8a9091" : "#e5e7eb"}`,
              color: view === v ? "#ffffff" : "#6b7280",
              borderRadius: "8px", padding: "8px 18px",
              fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
              textTransform: "uppercase", letterSpacing: "0.06em", transition: "all 0.15s",
            }}>
              {v === "transactions" ? `Transactions (${filtered.length})` : "Summary"}
            </button>
          ))}
          <button
            className="clear-btn"
            onClick={() => {
              setTransactions([]);
              localStorage.removeItem("tracker-transactions");
            }}
            style={{
              background: "rgba(220, 38, 38, 0.15)",
              border: "1px solid #fecaca",
              color: "#dc2626",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            Clear All
          </button>
        </div>

        {view === "transactions" && (
          <>
            {/* Filters */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
              <input
                placeholder="Search transactions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px",
                  color: "#111827", padding: "8px 14px", fontSize: "12px",
                  fontFamily: "inherit", outline: "none", flex: "1", minWidth: "180px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              />
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                style={{
                  background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px",
                  color: "#374151", padding: "8px 14px", fontSize: "12px",
                  fontFamily: "inherit", outline: "none", cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            {/* Table */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 130px 180px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "10px 16px" }}>
                {[["date", "DATE"], ["description", "DESCRIPTION"], ["amount", "AMOUNT"], [null, "CATEGORY"]].map(([col, label]) => (
                  <div
                    key={label}
                    className={col ? "sort-btn" : ""}
                    onClick={() => col && handleSort(col)}
                    style={{
                      fontSize: "10px", color: sortCol === col ? "#111827" : "#9ca3af",
                      letterSpacing: "0.1em", cursor: col ? "pointer" : "default",
                      display: "flex", alignItems: "center", gap: "4px",
                      userSelect: "none", transition: "color 0.15s", fontWeight: "500",
                    }}
                  >
                    {label}
                    {col && sortCol === col && <span style={{ fontSize: "8px" }}>{sortDir === -1 ? "▼" : "▲"}</span>}
                  </div>
                ))}
              </div>

              <div style={{ maxHeight: "480px", overflowY: "auto" }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: "48px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                    {transactions.length === 0 ? "Upload a bank statement CSV to get started" : "No transactions found"}
                  </div>
                ) : filtered.map((t, i) => (
                  <div key={t.id} className="tx-row" style={{
                    display: "grid", gridTemplateColumns: "110px 1fr 130px 180px",
                    padding: "11px 16px",
                    borderBottom: i < filtered.length - 1 ? "1px solid #f3f4f6" : "none",
                    background: "transparent", transition: "background 0.1s", alignItems: "center",
                  }}>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>{t.date}</div>
                    <div style={{ fontSize: "12px", color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "12px" }}>
                      {t.description}
                    </div>
                    <div style={{
                      fontSize: "13px", fontWeight: "600",
                      color: t.amount >= 0 ? "#16a34a" : "#dc2626",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {t.amount >= 0 ? "+" : "−"}${Math.abs(t.amount).toFixed(2)}
                    </div>
                    <div>
                      <CategoryDropdown value={t.category} onChange={(cat) => updateCategory(t.id, cat)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === "summary" && (
          <div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "16px", letterSpacing: "0.08em" }}>
              BREAKDOWN ACROSS {transactions.length} TRANSACTIONS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
              {totals.map(({ cat, amount, count }) => (
                <SummaryCard key={cat.id} cat={cat} amount={amount} count={count} />
              ))}
            </div>

            <div style={{ marginTop: "28px", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 24px", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: "10px", color: "#9ca3af", letterSpacing: "0.1em", marginBottom: "16px" }}>SPENDING BY CATEGORY</div>
              {totals.filter((t) => t.amount < 0).sort((a, b) => a.amount - b.amount).map(({ cat, amount }) => {
                const maxSpend = Math.abs(totals.filter((t) => t.amount < 0).reduce((min, t) => t.amount < min ? t.amount : min, 0));
                const pct = Math.abs(amount) / maxSpend * 100;
                return (
                  <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                    <div style={{ fontSize: "11px", color: "#6b7280", width: "160px", flexShrink: 0 }}>{cat.label}</div>
                    <div style={{ flex: 1, height: "6px", background: "#f3f4f6", borderRadius: "3px" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: cat.color, borderRadius: "3px", transition: "width 0.8s ease", opacity: 0.8 }} />
                    </div>
                    <div style={{ fontSize: "12px", color: "#dc2626", width: "80px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: "600" }}>
                      ${Math.abs(amount).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
