# Deck Analytics Dashboard - Implementation Roadmap

## 📊 Overview

This document tracks the implementation of the comprehensive deck analytics dashboard inspired by the fantasy analytics mockup.

---

## ✅ Phase 1: Core Analytics (IMPLEMENTED)

### **Metrics Available Now**

**Top Stats Banner:**
- ✅ Fantasy Price (from deck cost)
- ✅ Fantasy Points (total accumulated)
- ✅ Points/Event (average per tournament)
- ✅ Recent Form (last 3 events)
- ⏳ Selected By % (requires squad tracking - Phase 2)

**Core Competitive Metrics:**
- ✅ Meta Share (from Limitless sync)
- ✅ Meta Rank (from tier system)
- ✅ Day 2 Conversion (calculated from Top 32 appearances)
- ✅ Top 32 Conversion  
- ⏳ Win Rate (requires W/L data in standings)

**Tournament Results:**
- ✅ Event name & date
- ✅ Placement (1st, 2nd, 3rd, etc.)
- ✅ Points scored
- ⏳ Top 32 Copies (requires detailed standings data)

**Meta Efficiency:**
- ✅ Top 32 Share
- ✅ Meta Share
- ✅ Efficiency Score (Top 32 / Meta Share)
- ✅ Dynamic description based on score

**Placement Breakdown:**
- ✅ Top 64 count
- ✅ Top 32 count
- ✅ Top 16 count
- ✅ Top 8 count
- ✅ Finals (Top 4) count
- ✅ Wins count

### **Implementation Details**

**New Files:**
- `src/lib/fantasy/deckAnalytics.ts` - Analytics calculation engine
- `src/app/decks/[slug]/analytics/page.tsx` - Full analytics dashboard UI
- Updated `src/app/decks/[slug]/page.tsx` - Added link to full analytics

**Access:**
```
https://pokeleague.vercel.app/decks/[slug]/analytics
```

Example:
```
https://pokeleague.vercel.app/decks/charizard-ex/analytics
```

---

## 🔄 Phase 2: Squad & Ownership Tracking (TODO)

### **Fantasy Ownership Section**

Track how users are selecting decks in their squads:

**Metrics to Add:**
- Selected By % - (users with this deck / total users) × 100
- Captain Rate % - (users with this as active deck / users with this deck) × 100
- Transfers In (Week) - Count of squads that added this deck
- Transfers Out (Week) - Count of squads that removed this deck

**Required Database Changes:**
```sql
-- Track squad history for transfer analysis
CREATE TABLE squad_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  deck_id INTEGER REFERENCES decks(id),
  action TEXT, -- 'added' | 'removed' | 'captain'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Or expand existing squads table with timestamps
ALTER TABLE squads ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
```

**Implementation:**
1. Add triggers to track squad changes
2. Create weekly aggregation job
3. Query ownership stats per deck
4. Display in UI

---

## 📈 Phase 3: Win Rate & Match Data (TODO)

### **Enhanced Tournament Data**

**Win Rate:**
Currently showing "—" because standings don't include W/L records.

**Options:**
1. **Parse from RK9/Limitless** - Some sources show round-by-round records
2. **Infer from placement** - Estimate W/L from final standing
3. **Manual entry** - Admin can input W/L for key events

**Implementation:**
```typescript
// Add to StandingsEntry type
interface StandingsEntry {
  player_name: string;
  deck_name: string;
  placement: number;
  wins?: number;    // Add these
  losses?: number;  // Add these
}

// Update standingsMapper to compute win rate
```

---

## 🕷️ Phase 4: Meta Radar & Matchups (TODO)

### **Spider Chart (Meta Radar)**

**Dimensions:**
- **Power** - Average points scored per event
- **Consistency** - Standard deviation of placements (lower = more consistent)
- **Conversion** - Top 32 conversion rate
- **Meta Share** - Current play rate
- **Form** - Trend over last 3 events (improving/declining)

**Implementation:**
1. Calculate each dimension (0-100 scale)
2. Use chart library (recharts, Chart.js)
3. Render pentagon/hexagon chart

### **Matchup Analysis**

**Strong/Weak vs. Other Decks:**

Requires head-to-head data:
- Parse tournament brackets (if available)
- Track which decks face each other in finals
- Calculate win rate by matchup

**Data Structure:**
```sql
CREATE TABLE deck_matchups (
  id SERIAL PRIMARY KEY,
  deck_a_id INTEGER REFERENCES fantasy_archetypes(id),
  deck_b_id INTEGER REFERENCES fantasy_archetypes(id),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  source TEXT -- 'bracket' | 'inferred' | 'manual'
);
```

**Predicted Meta Score:**
Weighted formula:
```
Score = (Power × 0.3) + (Consistency × 0.2) + (Form × 0.2) + 
        (Favorable Matchups × 0.2) + (Meta Position × 0.1)
```

---

## 🎨 Phase 5: UI Polish & Styling (TODO)

### **Match Mockup Styling**

The current implementation uses a clean, dark theme. To fully match the mockup:

1. **Gradient backgrounds** - Purple/golden gradients like mockup
2. **Card styling** - Decorative borders and shadows
3. **Icons** - Trophy/crown icons for placements
4. **Animations** - Smooth transitions for stats
5. **Mobile responsive** - Ensure all sections work on mobile

### **Recommended Libraries**

- `recharts` - For spider chart
- `framer-motion` - For animations
- `lucide-react` - For icons

---

## 📋 Data Requirements Summary

### **Currently Using:**
- ✅ `decks` table - Meta share, cost, tier
- ✅ `fantasy_archetypes` - Deck registry
- ✅ `fantasy_archetype_scores_live` - Points per event
- ✅ `fantasy_standings_snapshots` - Raw tournament data

### **Need to Add:**
- ⏳ Squad change tracking (for ownership/transfers)
- ⏳ W/L records in standings (for win rate)
- ⏳ Matchup data (for strong/weak analysis)
- ⏳ Weekly aggregations (for trends)

---

## 🚀 Deployment Checklist

**Phase 1 (Current):**
- [x] Create analytics calculation library
- [x] Build analytics page UI
- [x] Link from deck page
- [ ] Merge feature branch to main
- [ ] Deploy to production
- [ ] Test with real tournament data

**Phase 2 (Next):**
- [ ] Add squad history tracking
- [ ] Create transfer analysis queries
- [ ] Implement ownership metrics
- [ ] Update UI to show ownership data

---

## 🧪 Testing

**To test current implementation:**

1. Go to `/decks/charizard-ex/analytics`
2. Should see:
   - Fantasy points from ingested tournaments
   - Placement breakdown (if tournaments have placement data)
   - Meta efficiency calculation
   - Tournament results list

**Sample data needed:**
- At least 1 tournament with standings
- Archetype must have scores in `fantasy_archetype_scores_live`

---

## 💡 Future Enhancements

1. **Export analytics** - Download as CSV/PDF
2. **Compare decks** - Side-by-side comparison view
3. **Historical trends** - Graph of meta share over time
4. **Predictions** - ML model to predict next event performance
5. **Alerts** - Notify when deck enters/exits meta
6. **Custom time ranges** - Filter analytics by date range

---

## 📞 Questions & Decisions Needed

1. **Pricing system:** How should Fantasy Price be calculated? Based on cost, or separate pricing?
2. **Captain feature:** Do you want users to designate an "active" deck (captain) with 2x/3x multiplier?
3. **Transfers:** Track daily, weekly, or per-event gameweek?
4. **Win rate source:** Should we scrape W/L from external sources or manually enter?
5. **Matchup data:** Worth investing in bracket parsing, or start with manual entry?

---

## 📚 References

- Mockup inspiration: Fantasy sports analytics dashboard
- Current implementation: `/decks/[slug]/analytics`
- Calculation engine: `src/lib/fantasy/deckAnalytics.ts`
