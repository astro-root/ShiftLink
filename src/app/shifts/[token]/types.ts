export type PrefStatus = 'available' | 'preferred' | 'unavailable';
export interface SSlot  { id: number; date: string; startTime: string; endTime: string; requiredCount: number }
export interface SStaff { id: number; name: string; note?: string }
export interface SPref  { staffId: number; slotId: number; status: PrefStatus }
export interface PSlot  { slotId: number; slotDate: string; slotStart: string; slotEnd: string; requiredCount: number; assigned: { staffId: number; name: string }[] }
export interface Proposal { id: number; title: string; score: number; coverageRate: number; data: { assignments: PSlot[] } }
export interface EditSlot { date: string; startTime: string; endTime: string; requiredCount: number }
