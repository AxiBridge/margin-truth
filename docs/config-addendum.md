# Margin Truth — configuration addendum

Same layout, same single page. This adds one collapsible panel above the entry controls so
a different operator can put their own numbers in and see their own floor.

## Principle

They adjust, they never author. Every field arrives pre-filled from `pack-detailing.json`.
There is no empty form anywhere in this app. A blank field is a bug.

## The panel

Collapsed by default, one line: `Your numbers — $61.06/hour loaded` with a chevron.
Expanded, four sections in this order.

### 1. Pay

- What you pay yourself, $/hour

### 2. Overhead

Show the total as a single row: `Monthly overhead — $1,915` with a chevron.
Expanding it reveals the 13 line items from `overheadLines`, each editable, summing live.

Never ask for hourly overhead. The operator will divide by hours worked instead of hours
billed and the floor comes out roughly a third too low. Collect monthly dollars and compute
the rate.

### 3. Capacity

- Jobs per week
- Average hours per job
- Number of techs

Below these, read-only: `173.2 billable hours per month` and `$11.06 overhead per hour`.
Show the arithmetic in small muted text. This is the number operators dispute, so it has to
be visibly derived rather than asserted.

### 4. Services

A simple table, one row per service, three editable columns:

| Service | Minutes | You charge |

Name is editable too. No add or delete in the demo — ten rows is enough to prove the point.

## Consumables

Not in this panel. They stay editable inline from the product row of the floor stack, which
is already spec'd. An operator who wants to change a coverage rate is deep enough in to find
it there, and putting 68 rows in a settings panel makes the app look like accounting
software.

## Persistence

`localStorage`, one key, the whole config object as JSON. Load on mount, fall back to the
pack when nothing is stored. Save on every change, debounced.

A `Reset to defaults` button at the bottom of the panel, restoring straight from
`pack-detailing.json`. This gets used every time the laptop is handed to the next detailer,
so it needs a confirm step but not a modal.

## Recompute

Every edit updates the floor live. No save button anywhere.

## Not in scope

Accounts, server, sync, multiple saved profiles, adding or deleting services, adding
consumables, importing from a spreadsheet, exporting. Styling comes after this works.
