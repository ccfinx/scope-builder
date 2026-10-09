/*
 * The free Scope Builder's page (ccfinx ADR-0059): it shows one step at a
 * time, keeps the one Scope in memory while the tab is open, fills the sheet
 * from it, and hands the file to the browser to save.
 *
 * It holds no wording. Every label, sentence and "not set" is in
 * scope-builder.html, and is read from there, so the text is changed in one
 * place. The rules are in scope-builder-file.js.
 *
 * It sends nothing and keeps nothing: no request, no cookie, no storage. The
 * page's policy (_headers) allows this site's own script and no connection to
 * anywhere, and a test reads this file for the calls that would make one.
 */

import {
  FILE_NAME,
  STEPS,
  emptyScope,
  fileText,
  hasContent,
  stepDone,
  stepsDone,
  toggled,
  withCapabilityToggled,
  withCorner,
  withMaturity,
} from './scope-builder-file.js';

const root = document.getElementById('builder');
const all = (selector, within = root) => Array.from(within.querySelectorAll(selector));
const one = (selector, within = root) => within.querySelector(selector);

let scope = emptyScope();
let step = STEPS[0];
/** True from the first change until the file is saved: leaving then loses work. */
let unsaved = false;

/* ── Reading the page's own words ─────────────────────────────────────────── */

const text = (element) => (element ? element.textContent.trim() : '');

/** The label of an option, as the page writes it. */
function optionLabel(list, id) {
  return text(one(`[data-list="${list}"][data-id="${CSS.escape(id)}"]`));
}

function capabilityButton(id) {
  return one(`[data-capability="${CSS.escape(id)}"]`);
}

/** The Capabilities in the order of the board, not the order they were chosen in. */
function chosenCapabilities() {
  return all('[data-capability]')
    .map((button) => button.dataset.capability)
    .filter((id) => scope.capabilityIds.includes(id));
}

const rowTemplate = document.getElementById('sb-maturity-row');
const notRated = text(document.getElementById('sb-not-rated').content);

/** The label of a maturity level, read from the row template. */
function levelLabel(level) {
  return level ? text(rowTemplate.content.querySelector(`[data-level="${level}"]`)) : notRated;
}

/* ── Drawing ──────────────────────────────────────────────────────────────── */

function drawSteps() {
  for (const section of all('.sb-step')) section.hidden = section.dataset.step !== step;
  for (const button of all('[data-goto]')) {
    const id = button.dataset.goto;
    const done = stepDone(id, scope);
    button.classList.toggle('is-done', done);
    if (id === step) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
    const mark = one('.sb-done', button);
    if (mark) mark.hidden = !done;
  }
  one('[data-out="stepsDone"]').textContent = String(stepsDone(scope));
  const at = STEPS.indexOf(step);
  one('[data-do="back"]').hidden = at === 0;
  one('[data-do="next"]').hidden = at === STEPS.length - 1;
}

function drawChoices() {
  for (const button of all('[data-list]')) {
    button.setAttribute('aria-pressed', String(scope[button.dataset.list].includes(button.dataset.id)));
  }
  for (const button of all('[data-capability]')) {
    button.setAttribute('aria-pressed', String(scope.capabilityIds.includes(button.dataset.capability)));
  }
  for (const button of all('[data-corner]')) {
    button.setAttribute('aria-pressed', String(scope.tradeoff === button.dataset.corner));
  }
  for (const says of all('[data-corner-says]')) says.hidden = says.dataset.cornerSays !== scope.tradeoff;
  one('[data-corner-chosen]').hidden = scope.tradeoff === '';
}

/** One row for each chosen Capability, each with its two rows of levels. */
function drawMaturity() {
  const holder = one('[data-out="maturity"]');
  const ids = chosenCapabilities();
  // A row is kept when its Capability is still chosen, so focus stays on the button that was pressed.
  for (const row of all('.sb-maturity-row', holder)) {
    if (!ids.includes(row.dataset.capabilityId)) row.remove();
  }
  ids.forEach((id, index) => {
    let row = one(`.sb-maturity-row[data-capability-id="${CSS.escape(id)}"]`, holder);
    if (!row) {
      row = rowTemplate.content.firstElementChild.cloneNode(true);
      row.dataset.capabilityId = id;
      const name = one('[data-part="name"]', row);
      name.textContent = text(capabilityButton(id));
      name.id = `sb-m-${id}`;
      for (const part of ['today', 'target']) {
        const label = one(`[data-part="${part}"]`, row);
        label.id = `sb-m-${id}-${part}`;
        label.parentElement.setAttribute('aria-labelledby', `${name.id} ${label.id}`);
      }
    }
    if (holder.children[index] !== row) holder.insertBefore(row, holder.children[index] ?? null);
    const target = scope.maturityTargets.find((m) => m.capabilityId === id);
    for (const button of all('[data-level]', row)) {
      button.setAttribute('aria-pressed', String(target?.[button.dataset.which] === button.dataset.level));
    }
  });
  for (const element of all('[data-when="no-capabilities"]')) element.hidden = ids.length > 0;
  for (const element of all('[data-when="capabilities"]')) element.hidden = ids.length === 0;
}

function fillList(element, items) {
  element.replaceChildren(
    ...items.map((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      return li;
    }),
  );
}

/** The sheet, filled from the Scope. An empty field shows its own data-empty, from the stylesheet. */
function drawSheet() {
  const out = (name) => one(`.sb-sheet [data-out="${name}"]`);
  out('name').textContent = scope.name.trim();
  out('date').textContent = new Date().toLocaleDateString(undefined, { dateStyle: 'long' });
  for (const field of ['triggerQuestion', 'businessOutcome', 'cadence', 'notes']) out(field).textContent = scope[field].trim();
  fillList(out('whyChain'), scope.whyChain.map((why) => why.trim()).filter(Boolean));
  out('tradeoff').textContent = scope.tradeoff ? text(one(`[data-corner-says="${scope.tradeoff}"]`)) : '';
  for (const list of ['technologyCategoryIds', 'personaIds']) {
    // In the order of the page, as the Capabilities are.
    const ids = all(`[data-list="${list}"]`).map((b) => b.dataset.id).filter((id) => scope[list].includes(id));
    fillList(out(list), ids.map((id) => optionLabel(list, id)));
  }
  out('capabilities').replaceChildren(
    ...chosenCapabilities().map((id) => {
      const button = capabilityButton(id);
      const target = scope.maturityTargets.find((m) => m.capabilityId === id);
      const row = document.createElement('tr');
      const cells = [
        text(button),
        text(one('.sb-domain-name', button.closest('.sb-domain'))),
        levelLabel(target?.current),
        levelLabel(target?.target),
      ];
      cells.forEach((value, index) => {
        const cell = document.createElement(index === 0 ? 'th' : 'td');
        if (index === 0) cell.scope = 'row';
        cell.textContent = value;
        row.append(cell);
      });
      return row;
    }),
  );
}

function draw() {
  drawSteps();
  drawChoices();
  drawMaturity();
  drawSheet();
}

/* ── Changing ─────────────────────────────────────────────────────────────── */

function change(next) {
  scope = next;
  unsaved = hasContent(scope);
  one('[data-when="saved"]').hidden = true;
  draw();
}

function goTo(id) {
  if (!STEPS.includes(id) || id === step) return;
  step = id;
  drawSteps();
  // Focus goes to the step's heading, so a keyboard and a screen reader start at its top.
  const heading = one(`.sb-step[data-step="${id}"] .title`);
  heading.focus({ preventScroll: true });
  root.scrollIntoView({ block: 'start' });
}

/** Hand the file to the browser. It is made in memory and goes nowhere but the person's own disk. */
function save() {
  const url = URL.createObjectURL(new Blob([fileText(scope, new Date())], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = FILE_NAME;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  unsaved = false;
  one('[data-when="saved"]').hidden = false;
}

root.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button || !root.contains(button)) return;
  const data = button.dataset;
  if (data.goto) goTo(data.goto);
  else if (data.do === 'back') goTo(STEPS[STEPS.indexOf(step) - 1]);
  else if (data.do === 'next') goTo(STEPS[STEPS.indexOf(step) + 1]);
  else if (data.do === 'save') save();
  else if (data.do === 'print') window.print();
  else if (data.list) change({ ...scope, [data.list]: toggled(scope[data.list], data.id) });
  else if (data.capability) change(withCapabilityToggled(scope, data.capability));
  else if (data.corner) change(withCorner(scope, data.corner));
  else if (data.level) change(withMaturity(scope, button.closest('.sb-maturity-row').dataset.capabilityId, data.which, data.level));
});

root.addEventListener('input', (event) => {
  const field = event.target;
  if (field.dataset.field) change({ ...scope, [field.dataset.field]: field.value });
  else if (field.dataset.why !== undefined) {
    const whyChain = [...scope.whyChain];
    whyChain[Number(field.dataset.why)] = field.value;
    change({ ...scope, whyChain });
  }
});

// The browser's own question before a tab with unsaved work is closed: nothing here is kept anywhere else.
window.addEventListener('beforeunload', (event) => {
  if (unsaved) event.preventDefault();
});

// A browser may put back what was typed before a reload; the Scope starts from what the fields hold.
for (const field of all('[data-field]')) scope[field.dataset.field] = field.value;
for (const field of all('[data-why]')) scope.whyChain[Number(field.dataset.why)] = field.value;

root.classList.add('is-ready');
draw();
