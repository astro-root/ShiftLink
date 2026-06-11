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
  const defs: { title: string; s: Strategy }[] = [
    { title: '希望優先案', s: 'preference' },
    { title: '均等配分案', s: 'balance' },
    { title: 'バリエーション案', s: 'variety' },
  ];
  return defs.map(({ title, s }) => {
    const assignments = build(slots, staff, getPref, s);
    return { title, ...calcScore(assignments, getPref) };
  });
}

function build(slots: AlgoSlot[], staff: AlgoStaff[], getPref: PG, strategy: Strategy): AssignedSlot[] {
  const load = new Map<number, number>(staff.map(s => [s.id, 0]));
  return slots.map(slot => {
    const avail = staff.filter(s => getPref(s.id, slot.id) !== 'unavailable');
    const ps = (s: AlgoStaff) => getPref(s.id, slot.id) === 'preferred' ? 2 : 1;
    let sorted: AlgoStaff[];
    if (strategy === 'preference') {
      sorted = [...avail].sort((a, b) => ps(b) - ps(a));
    } else if (strategy === 'balance') {
      sorted = [...avail].sort((a, b) => {
        const d = (load.get(a.id) ?? 0) - (load.get(b.id) ?? 0);
        return d !== 0 ? d : ps(b) - ps(a);
      });
    } else {
      sorted = [...avail].sort((a, b) => {
        const va = (a.id * 31 + slot.id * 17) % 11;
        const vb = (b.id * 31 + slot.id * 17) % 11;
        return va !== vb ? va - vb : ps(b) - ps(a);
      });
    }
    const pick = sorted.slice(0, slot.requiredCount);
    const dur = (toMin(slot.endTime) - toMin(slot.startTime)) / 60;
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
