import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Resilient memory mock store for instant local dev without requiring cloud credentials
const memoryStore = {
  triage_leads: [],
  appointments: [],
  milestone_orders: [],
  audit_events: []
};

function createMockSupabase() {
  console.warn("[GARUDA Boilerplate] Running with In-Memory Mock Supabase Store (Set NEXT_PUBLIC_SUPABASE_URL for production PostgreSQL)");
  
  return {
    from: (table) => ({
      insert: async (records) => {
        const arr = Array.isArray(records) ? records : [records];
        const withId = arr.map(item => ({
          id: item.id || `mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          created_at: new Date().toISOString(),
          ...item
        }));
        if (!memoryStore[table]) memoryStore[table] = [];
        memoryStore[table].push(...withId);
        return { data: withId, error: null };
      },
      select: (cols = "*") => ({
        eq: (field, val) => ({
          single: async () => {
            const list = memoryStore[table] || [];
            const found = list.find(x => x[field] === val);
            return { data: found || null, error: found ? null : { message: "Not found" } };
          },
          order: () => Promise.resolve({ data: (memoryStore[table] || []).filter(x => x[field] === val), error: null })
        }),
        order: () => Promise.resolve({ data: memoryStore[table] || [], error: null })
      }),
      update: (patch) => ({
        eq: (field, val) => {
          const list = memoryStore[table] || [];
          const idx = list.findIndex(x => x[field] === val);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...patch, updated_at: new Date().toISOString() };
            return Promise.resolve({ data: [list[idx]], error: null });
          }
          return Promise.resolve({ data: [], error: null });
        }
      })
    })
  };
}

export const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : createMockSupabase();
