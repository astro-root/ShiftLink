export interface AlgoStaff { id: number; name: string }
export interface AlgoSlot {
  id: number; date: string; startTime: string; endTime: string; requiredCount: number;
}
export type PrefStatus = 'preferred' | 'available' | 'unavailable';
export interface AlgoPref { staffId: number; slotId: number; status: PrefStatus }
export interface AssignedSlot {
  slotId: number; slotDate: string; slotStart: string; slotEnd: string;
  requiredCount: number; assigned: { staffId: number; name: string }[];
}
export interface GeneratedProposal {
  title: string; score: number; coverageRate: number; assignments: AssignedSlot[];
}

type Strategy = 'preference' | 'balance' | 'variety';
type PG = (sId: number, slId: number) => PrefStatus;

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number); return h * 60 + m;
}

export function generateProposals(
  slots: AlgoSlot[], staff: AlgoStaff[], prefs: AlgoPref[]
): GeneratedProposal[] {
  if (!slots.length || !staff.length) return [];
  const prefMap = new Map<string, PrefStatus>();
  prefs.forEach(p => prefMap.set(`${p.staffId}-${p.slotId}`, p.status));
  const getPref: PG = (sId, slId) => prefMap.get(`${sId}-${slId}`) ?? 'available';

  // 各戦略で異なるスタッフ並び順をtiebreakに使う
  const staffAsc  = [...staff].sort((a, b) => a.id - b.id);
  const staffDesc = [...staff].sort((a, b) => b.id - a.id);

  const defs: { title: string; s: Strategy; base: AlgoStaff[] }[] = [
    { title: '希望優先案',       s: 'preference', base: staffAsc  },
    { title: '均等配分案',       s: 'balance',    base: staffAsc  },
    { title: 'バリエーション案', s: 'variety',    base: staffDesc },
  ];
  return defs.map(({ title, s, base }) => {
    const assignments = build(slots, staff, base, getPref, s);
    return { title, assignments, ...calcScore(assignments, getPref) };
  });
}

function build(
  slots: AlgoSlot[], staff: AlgoStaff[], base: AlgoStaff[],
  getPref: PG, strategy: Strategy
): AssignedSlot[] {
  const load = new Map<number, number>(staff.map(s => [s.id, 0]));
  const baseIdx = (s: AlgoStaff) => base.findIndex(x => x.id === s.id);
  const pScore  = (s: AlgoStaff, slotId: number) =>
    getPref(s.id, slotId) === 'preferred' ? 2 : 1;

  return slots.map(slot => {
    const avail = staff.filter(s => getPref(s.id, slot.id) !== 'unavailable');
    let sorted: AlgoStaff[];

    if (strategy === 'preference') {
      // 希望優先 → 同点はload少 → 同点はbase順(ASC)
      sorted = [...avail].sort((a, b) => {
        const pd = pScore(b, slot.id) - pScore(a, slot.id);
        if (pd !== 0) return pd;
        const ld = (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0);
        if (ld !== 0) return ld;
        return baseIdx(a) - baseIdx(b);
      });
    } else if (strategy === 'balance') {
      // load少 → 希望優先 → base順(ASC)
      sorted = [...avail].sort((a, b) => {
        const ld = (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0);
        if (ld !== 0) return ld;
        const pd = pScore(b, slot.id) - pScore(a, slot.id);
        if (pd !== 0) return pd;
        return baseIdx(a) - baseIdx(b);
      });
    } else {
      // variety: load少 → base順(DESC) — 希望を考慮しないので必ず別解になる
      sorted = [...avail].sort((a, b) => {
        const ld = (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0);
        if (ld !== 0) return ld;
        return baseIdx(a) - baseIdx(b); // baseはDESC順
      });
    }

    const pick = sorted.slice(0, slot.requiredCount);
    const dur = Math.max(0.5, (toMin(slot.endTime) - toMin(slot.startTime)) / 60);
    pick.forEach(s => load.set(s.id, (load.get(s.id) ?? 0) + dur));
    return {
      slotId: slot.id, slotDate: slot.date, slotStart: slot.startTime,
      slotEnd: slot.endTime, requiredCount: slot.requiredCount,
      assigned: pick.map(s => ({ staffId: s.id, name: s.name })),
    };
  });
}

function calcScore(assignments: AssignedSlot[], getPref: PG): { score: number; coverageRate: number } {
  let pScore = 0, maxP = 0, req = 0, asgn = 0;
  assignments.forEach(a => {
    req += a.requiredCount; asgn += a.assigned.length;
    a.assigned.forEach(s => {
      const p = getPref(s.staffId, a.slotId);
      pScore += p === 'preferred' ? 2 : p === 'available' ? 1 : 0;
      maxP += 2;
    });
  });
  return {
    score: maxP > 0 ? Math.round((pScore / maxP) * 100) : 100,
    coverageRate: req > 0 ? Math.round((asgn / req) * 100) : 100,
  };
}
