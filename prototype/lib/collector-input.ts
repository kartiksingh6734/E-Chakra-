import { z } from 'zod';
import { categoryOf, DomainError, type Lot, type Profile } from './domain';

export const defaultProfile: Profile = { name: '', location: 'Mayapuri, Delhi', language: 'hi' };
export const profileInput = z.object({
  name: z.string().trim().max(60),
  location: z.string().trim().min(2).max(150),
  language: z.enum(['hi', 'mr', 'en']),
});

const draftInput = z.object({
  id: z.string().uuid(),
  category: z.enum(['pcb','cables','lcd','crt','batteries','motors','magnets','plastics']),
  quantity: z.number().positive().max(100000),
  condition: z.enum(['scrap', 'reusable']),
  location: z.string().trim().min(2).max(150),
  notes: z.string().max(500).default(''),
  photoId: z.string().uuid().optional(),
  audioId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
});

export function lotFromDraft(input: unknown): Lot {
  const draft = draftInput.parse(input);
  if (categoryOf(draft.category).unit === 'piece' && !Number.isInteger(draft.quantity)) {
    throw new DomainError('Enter a whole number of pieces');
  }
  const at = new Date().toISOString();
  return {
    ...draft, updatedAt: at, stage: 'open', version: 1,
    offers: [], payments: [], operations: [], events: [{ at, action: 'create_lot', role: 'collector' }],
  };
}
