export interface FantasyArchetype {
  id: number;
  slug: string;
  name: string;
  image_url: string | null;
}

export interface FantasyEvent {
  id: number;
  tournament_id: number | null;
  name: string;
  event_date: string | null;
  status: "upcoming" | "live" | "completed";
}

export interface StandingsSnapshot {
  id: number;
  fantasy_event_id: number;
  snapshot_at: string;
  payload: SnapshotPayload;
  source: string;
}

export interface SnapshotPayload {
  archetypes: ArchetypeResult[];
  recorded_at?: string;
}

export interface StandingsEntry {
  player_name: string;
  deck_name: string;
  placement: number;
  wins?: number;
  losses?: number;
}

export interface ArchetypeResult {
  archetype_slug: string;
  archetype_name: string;
  variant_name?: string;    // Which variant placed (e.g. "Charizard ex / Pidgeot ex")
  placement?: number;       // Best single placement (legacy; prefer count fields for scoring)
  top32_count: number;      // Number of players who made top 32
  top8_count: number;       // Number of players who made top 8
  made_day2: boolean;
  top8: boolean;
  won: boolean;
  win_rate: number;
  had_win: boolean;
}

export interface ArchetypeScoreLive {
  fantasy_event_id: number;
  archetype_id: number;
  points: number;
  placement: number | null;
  computed_at: string;
}

export interface TeamScoreLive {
  fantasy_event_id: number;
  user_id: string;
  points: number;
  breakdown: TeamScoreBreakdown;
  computed_at: string;
}

export interface TeamScoreBreakdown {
  slots: SlotScore[];
  total: number;
}

export interface SlotScore {
  slot: string; // "active" | "bench_1" | ...
  archetype_slug: string | null;
  variant_name?: string | null;  // Which variant was matched for this slot
  base_points: number;
  multiplier: number;
  final_points: number;
  warning?: string;              // Set if deck couldn't be matched
}
