/*
 * The free Scope Builder's rules, with no page in them: what one Scope holds,
 * what choosing something does to it, when a step counts as filled in, and the
 * file that is saved. scope-builder.js draws the page and calls these; the
 * tests in ../scope-builder/ call them with no browser.
 *
 * Written for this page (ccfinx ADR-0059 Decision 3). Nothing here is copied
 * from ccfinx: the two share the file's format and the wording of the steps,
 * which is in scope-builder.html, and no code.
 *
 * Nothing here reads or writes anything outside its arguments: no network, no
 * storage, no clock. The date in a file is handed in.
 */

/** The version of the file's format. ccfinx reads it to know which fields to expect. */
export const FORMAT_VERSION = 2;

/** The name the file is saved under, which is the name ccfinx's import asks for. */
export const FILE_NAME = 'finops-scope-profile.json';

/** What the file says made it. */
export const MADE_WITH = 'cloud-cost.com/scope-builder';

export const LEVELS = ['crawl', 'walk', 'run'];
export const CORNERS = ['cost', 'speed', 'quality'];

/** The steps that collect something, in order. Review collects only the notes and is never "filled in". */
export const COLLECTING_STEPS = ['why', 'outcome', 'technology', 'personas', 'capabilities', 'maturity'];
export const STEPS = [...COLLECTING_STEPS, 'review'];

/** How many "why?" lines the page offers. */
export const WHYS = 5;

export const NAME_MAX = 120;

/** One Scope, as the page holds it while the tab is open. */
export function emptyScope() {
  return {
    name: '',
    triggerQuestion: '',
    whyChain: Array.from({ length: WHYS }, () => ''),
    businessOutcome: '',
    tradeoff: '',
    technologyCategoryIds: [],
    personaIds: [],
    capabilityIds: [],
    maturityTargets: [],
    cadence: '',
    notes: '',
  };
}

const filled = (text) => text.trim().length > 0;

/** The list with the id added when it was not there, and taken out when it was. */
export function toggled(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/**
 * Choose or drop a Capability. A chosen one gets a maturity target of Crawl
 * and no rating for today; a dropped one takes its target with it.
 */
export function withCapabilityToggled(scope, id) {
  if (scope.capabilityIds.includes(id)) {
    return {
      ...scope,
      capabilityIds: scope.capabilityIds.filter((x) => x !== id),
      maturityTargets: scope.maturityTargets.filter((m) => m.capabilityId !== id),
    };
  }
  return {
    ...scope,
    capabilityIds: [...scope.capabilityIds, id],
    maturityTargets: [...scope.maturityTargets, { capabilityId: id, target: 'crawl' }],
  };
}

/**
 * Set where a chosen Capability is today ('current') or where it should get to
 * ('target'). Today's rating can be taken back by choosing it again; a target
 * is always one of the three.
 */
export function withMaturity(scope, capabilityId, which, level) {
  if (!LEVELS.includes(level) || (which !== 'current' && which !== 'target')) return scope;
  return {
    ...scope,
    maturityTargets: scope.maturityTargets.map((m) => {
      if (m.capabilityId !== capabilityId) return m;
      if (which === 'target') return { ...m, target: level };
      const next = { ...m };
      if (m.current === level) delete next.current;
      else next.current = level;
      return next;
    }),
  };
}

/** Choose a corner; choosing the chosen one again clears it. */
export function withCorner(scope, corner) {
  if (!CORNERS.includes(corner)) return scope;
  return { ...scope, tradeoff: scope.tradeoff === corner ? '' : corner };
}

/**
 * Whether a step's own fields are filled in. The favoured corner never counts:
 * it is optional. Maturity and cadence needs a cadence, at least one chosen
 * Capability, and a rating for today on every chosen one, because the Crawl
 * target a Capability starts with is not an answer.
 */
export function stepDone(step, scope) {
  switch (step) {
    case 'why':
      return filled(scope.triggerQuestion) || scope.whyChain.some(filled);
    case 'outcome':
      return filled(scope.businessOutcome);
    case 'technology':
      return scope.technologyCategoryIds.length > 0;
    case 'personas':
      return scope.personaIds.length > 0;
    case 'capabilities':
      return scope.capabilityIds.length > 0;
    case 'maturity': {
      const rated = new Set(scope.maturityTargets.filter((m) => m.current).map((m) => m.capabilityId));
      return filled(scope.cadence) && scope.capabilityIds.length > 0 && scope.capabilityIds.every((id) => rated.has(id));
    }
    default:
      return false;
  }
}

/** How many of the six collecting steps are filled in. */
export function stepsDone(scope) {
  return COLLECTING_STEPS.filter((step) => stepDone(step, scope)).length;
}

/** True once anything at all was typed or chosen. */
export function hasContent(scope) {
  return (
    filled(scope.name) ||
    filled(scope.notes) ||
    scope.tradeoff !== '' ||
    COLLECTING_STEPS.some((step) => stepDone(step, scope)) ||
    filled(scope.cadence)
  );
}

/**
 * The file: one Scope, with Framework ids and never labels, so that it means
 * the same when a label is reworded. `savedAt` is a Date. Text is trimmed,
 * empty "why?" lines are left out, a corner that was not chosen and a rating
 * that was not given are absent, and a maturity target is written only for a
 * Capability that is chosen.
 */
export function scopeFile(scope, savedAt) {
  const file = {
    formatVersion: FORMAT_VERSION,
    madeWith: MADE_WITH,
    exportedAt: savedAt.toISOString(),
    scopeProfile: scope.name.trim().slice(0, NAME_MAX),
    triggerQuestion: scope.triggerQuestion.trim(),
    whyChain: scope.whyChain.map((why) => why.trim()).filter((why) => why.length > 0),
    businessOutcome: scope.businessOutcome.trim(),
  };
  if (CORNERS.includes(scope.tradeoff)) file.tradeoff = scope.tradeoff;
  file.technologyCategoryIds = [...scope.technologyCategoryIds];
  file.personaIds = [...scope.personaIds];
  file.capabilityIds = [...scope.capabilityIds];
  file.maturityTargets = scope.maturityTargets
    .filter((m) => scope.capabilityIds.includes(m.capabilityId))
    .map((m) => (m.current ? { capabilityId: m.capabilityId, current: m.current, target: m.target } : { capabilityId: m.capabilityId, target: m.target }));
  file.cadence = scope.cadence.trim();
  file.notes = scope.notes.trim();
  return file;
}

/** The file as the text that is saved: two spaces of indent and a last line break. */
export function fileText(scope, savedAt) {
  return `${JSON.stringify(scopeFile(scope, savedAt), null, 2)}\n`;
}
