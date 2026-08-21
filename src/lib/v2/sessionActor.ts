const ACTOR_KEY = "partiq-session-actor-v1";

export type SessionActor = {
  name: string;
  email: string;
};

function canUseStorage() {
  return typeof window !== "undefined";
}

export function readSessionActor(): SessionActor {
  if (!canUseStorage()) return { name: "Plant operator", email: "" };
  try {
    const raw = window.localStorage.getItem(ACTOR_KEY);
    if (!raw) return { name: "Plant operator", email: "" };
    const parsed = JSON.parse(raw) as Partial<SessionActor>;
    const name = (parsed.name ?? "").trim() || "Plant operator";
    const email = (parsed.email ?? "").trim();
    return { name, email };
  } catch {
    return { name: "Plant operator", email: "" };
  }
}

export function writeSessionActor(actor: SessionActor) {
  if (!canUseStorage()) return;
  const name = actor.name.trim() || "Plant operator";
  const email = actor.email.trim();
  window.localStorage.setItem(ACTOR_KEY, JSON.stringify({ name, email }));
}

export function actorDisplayName(actor: SessionActor = readSessionActor()) {
  if (actor.email) return `${actor.name} · ${actor.email}`;
  return actor.name;
}
