export interface Perspective {
  id: string;
  /** Drawn line icon (stroke) */
  icon: JSX.Element;
}

/**
 * Interpretation perspectives — each maps to a dedicated system prompt in
 * api/interpret.js. Display names come from i18n keys: perspectives.{id}.name
 */
export const PERSPECTIVES: Perspective[] = [
  {
    id: 'general',
    icon: <svg className="icon" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>,
  },
  {
    id: 'islamic',
    icon: <svg className="icon" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M12 3a6 6 0 0 0 0 12 4 4 0 0 1 0 6" /><path d="M12 3a6 6 0 0 1 0 12" /></svg>,
  },
  {
    id: 'christian',
    icon: <svg className="icon" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M12 4v16M8 9h8" /><circle cx="12" cy="19" r="2" /></svg>,
  },
  {
    id: 'jewish',
    icon: <svg className="icon" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M12 3l8 9-8 9-8-9z" /><path d="M12 8l4 4-4 4-4-4z" /></svg>,
  },
  {
    id: 'hindu',
    icon: <svg className="icon" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M12 3c-4 3-6 6-6 9a6 6 0 0 0 12 0c0-3-2-6-6-9z" /><path d="M12 12v9" /></svg>,
  },
  {
    id: 'buddhist',
    icon: <svg className="icon" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M12 3v18M12 12c3 0 6-2 6-6-3 0-6 2-6 6zM12 12c-3 0-6-2-6-6 3 0 6 2 6 6zM6 21h12" /></svg>,
  },
  {
    id: 'psychology',
    icon: <svg className="icon" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><path d="M9 3a6 6 0 0 0-6 6c0 2 1 4 3 5v4h6v-3" /><path d="M15 3a6 6 0 0 1 6 6c0 4-3 6-6 6v6" /></svg>,
  },
  {
    id: 'chinese',
    icon: <svg className="icon" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18 4.5 4.5 0 0 1 0-9 4.5 4.5 0 0 0 0-9z" /><circle cx="9" cy="9" r="0.5" /><circle cx="15" cy="15" r="0.5" /></svg>,
  },
];

export const PERSPECTIVE_IDS = PERSPECTIVES.map((p) => p.id);
