import { topics } from './contactTopics';

export type ContactDraft = {
  name: string;
  email: string;
  company: string;
  topic: string;
  message: string;
  consent: boolean;
};

const key = 'apcosys-contact-draft-v1:' + import.meta.env.BASE_URL;
const lifetime = 24 * 60 * 60 * 1000;
let memory: { updatedAt: number; draft: ContactDraft } | undefined;

const emptyContactDraft = (): ContactDraft => ({
  name: '',
  email: '',
  company: '',
  topic: '',
  message: '',
  consent: false,
});

function clearContactDraft() {
  memory = undefined;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* Storage can be disabled. */
  }
}

export function saveContactDraft(draft: ContactDraft) {
  memory = { updatedAt: Date.now(), draft: { ...draft } };
  try {
    sessionStorage.setItem(key, JSON.stringify(memory));
  } catch {
    /* Keep the in-memory draft. */
  }
}

export function readContactDraft(): ContactDraft {
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(key) ?? 'null');
    if (stored && typeof stored === 'object' && 'updatedAt' in stored && 'draft' in stored) {
      const { updatedAt, draft } = stored;
      if (
        typeof updatedAt === 'number' &&
        (!memory || updatedAt > memory.updatedAt) &&
        Date.now() - updatedAt >= 0 &&
        Date.now() - updatedAt < lifetime &&
        draft &&
        typeof draft === 'object'
      ) {
        const fields = draft as Record<string, unknown>;
        if (
          ['name', 'email', 'company', 'topic', 'message'].every(
            (field) => typeof fields[field] === 'string',
          )
        ) {
          memory = {
            updatedAt,
            draft: {
              name: (fields.name as string).slice(0, 100),
              email: (fields.email as string).slice(0, 200),
              company: (fields.company as string).slice(0, 120),
              topic: topics.find((topic) => topic === fields.topic) ?? '',
              message: (fields.message as string).slice(0, 6000),
              consent: fields.consent === true,
            },
          };
        }
      }
    }
  } catch {
    /* Invalid or unavailable storage must not prevent writing a message. */
  }
  if (memory && Date.now() - memory.updatedAt >= 0 && Date.now() - memory.updatedAt < lifetime)
    return { ...memory.draft };
  clearContactDraft();
  return emptyContactDraft();
}
