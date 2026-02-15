import { readFileSync, writeFileSync } from "fs";
import { parse } from "path";

// --- CSV helpers (no dependencies) ---
function parseCSV(text) {
  const lines = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "\n" && !inQuotes) {
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h.trim()] = (values[i] || "").trim()));
    return row;
  });
}

function splitCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function toCSV(rows, columns) {
  const header = columns.join(",");
  const lines = rows.map((r) =>
    columns
      .map((c) => {
        const val = r[c] ?? "";
        return String(val).includes(",") ? `"${val}"` : val;
      })
      .join(",")
  );
  return [header, ...lines].join("\n");
}

// --- Fetch World Bank internet data ---
async function fetchInternetData() {
  // IT.NET.USER.ZS = Individuals using the Internet (% of population)
  // Fetch pages of 300 to get all countries, most recent value (MRV=1)
  const url =
    "https://api.worldbank.org/v2/country/all/indicator/IT.NET.USER.ZS?format=json&per_page=300&mrnev=1";
  const res = await fetch(url);
  const json = await res.json();
  const data = json[1] || [];

  const map = new Map();
  for (const entry of data) {
    if (entry.value != null && entry.countryiso3code) {
      map.set(entry.countryiso3code, {
        internet_pct: Math.round(entry.value * 100) / 100,
        year: entry.date,
      });
    }
  }
  return map;
}

// --- Main ---
async function main() {
  console.log("Fetching World Bank internet penetration data...");
  const internetMap = await fetchInternetData();
  console.log(`  Got data for ${internetMap.size} countries`);

  // Read existing CSVs
  const wbRaw = readFileSync("data-wb.csv", "utf-8");
  const votingRaw = readFileSync("data-voting.csv", "utf-8");

  const wbData = parseCSV(wbRaw);
  const votingData = parseCSV(votingRaw);

  // Build election lookup from voting data (by ISO code)
  const electionMap = new Map();
  for (const row of votingData) {
    const iso = row.ISO?.trim();
    if (!iso) continue;
    electionMap.set(iso, {
      freedom_status: row.freedom_status || "",
      freedom_score: row.freedom_score || "",
      internet_pct_voting: row["Internet %"] || "",
      election_type: row.Type || "",
    });
  }

  // Merge: start from wb data (broadest country list)
  const combined = [];
  const seen = new Set();

  for (const row of wbData) {
    const iso = row["Country Code"]?.trim();
    if (!iso || iso === "INX") continue; // skip "Not classified"

    const name = row["Country Name"]?.replace(/"/g, "").trim();
    const region = row.Region?.trim() || "";
    const incomeGroup = row["Income group"]?.trim() || "";

    // Internet % — prefer World Bank API, fall back to voting CSV
    const wbInet = internetMap.get(iso);
    const elec = electionMap.get(iso);
    let internet_pct = wbInet?.internet_pct ?? null;

    if (internet_pct == null && elec?.internet_pct_voting) {
      const parsed = parseFloat(elec.internet_pct_voting);
      if (!isNaN(parsed)) internet_pct = Math.round(parsed * 100) / 100;
    }

    // Skip countries with no internet data at all
    if (internet_pct == null) continue;

    combined.push({
      country: name,
      iso,
      region,
      income_group: incomeGroup,
      internet_pct,
      has_election: electionMap.has(iso) ? "TRUE" : "FALSE",
      freedom_status: elec?.freedom_status || "",
      freedom_score: elec?.freedom_score || "",
      election_type: elec?.election_type || "",
    });

    seen.add(iso);
  }

  // Add any voting-data countries not in wb data
  for (const row of votingData) {
    const iso = row.ISO?.trim();
    if (!iso || seen.has(iso)) continue;

    const inetStr = row["Internet %"]?.trim();
    const wbInet = internetMap.get(iso);
    let internet_pct = wbInet?.internet_pct ?? null;

    if (internet_pct == null && inetStr && inetStr !== "#N/A") {
      const parsed = parseFloat(inetStr);
      if (!isNaN(parsed)) internet_pct = Math.round(parsed * 100) / 100;
    }
    if (internet_pct == null) continue;

    combined.push({
      country: row.country?.trim(),
      iso,
      region: "",
      income_group: "",
      internet_pct,
      has_election: "TRUE",
      freedom_status: row.freedom_status || "",
      freedom_score: row.freedom_score || "",
      election_type: row.Type || "",
    });
  }

  // Sort by internet_pct ascending
  combined.sort((a, b) => a.internet_pct - b.internet_pct);

  const columns = [
    "country",
    "iso",
    "region",
    "income_group",
    "internet_pct",
    "has_election",
    "freedom_status",
    "freedom_score",
    "election_type",
  ];

  writeFileSync("data-radial.csv", toCSV(combined, columns));
  console.log(`Wrote data-radial.csv with ${combined.length} countries`);

  // Summary
  const elecCount = combined.filter((r) => r.has_election === "TRUE").length;
  console.log(`  ${elecCount} election countries, ${combined.length - elecCount} non-election`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
