# Margin Truth — Validation plan

Five detailers, two weeks, one question: **when they see their own floor, do they accept
it or reject it?**

Everything else — feature requests, pricing opinions, "you should add" — is noise until
that question is answered.

---

## Who

Five operators from the network. Mix:

- Two solo mobile, under two years in
- Two solo or two-person, five-plus years in
- One with a shop or a second van

Not friends who'll be nice. People who'll tell you the number is wrong.

---

## Setup

- Demo on your phone, config panel reset to pack defaults before each session
- Fifteen minutes, in person or on video with screen share, never a link sent cold
- No slides, no pitch, no explanation of what the product is

---

## Script

**Open (30 seconds).**
*"I built something that shows what a job actually costs you. Takes three minutes. I want
you to tell me where it's wrong."*

That last sentence is the whole framing. You are asking for disagreement. It makes the
number they'd otherwise politely accept into something they'll argue with, and the
argument is the data.

**Onboarding (3 minutes).** Hand them the phone. Say nothing unless they're stuck.
Watch for:

- Do they hesitate on the pay question? What do they say?
- On overhead, which lines do they change, and which do they skip?
- On capacity, do they react to the derived hourly number?
- Do they type prices from memory or ask what things should cost?

**The job (1 minute).** *"Think of one from last week you felt good about."* Let them pick.
Do not steer toward a big job.

**The floor (5 minutes).** This is the session. Say nothing for the first thirty seconds.

Then, whichever they haven't done on their own:

- *"Does that number look right?"*
- *"Tap the line you trust least."*
- *"What would you change?"*

Let them edit. Watch what they change and whether the floor lands somewhere they accept.

**Close (2 minutes).**

- *"If this existed, would you use it before you quoted?"*
- *"What would you pay for it a month?"* — number only, do not react
- *"Who else should see this?"*

---

## What to record

For each session, same day, one page:

| Field | |
|---|---|
| Job they chose | service, what they charged |
| Floor shown | |
| First reaction, verbatim | the first sentence out of their mouth |
| Line they disputed | labour / overhead / product / none |
| Edits made | which, from what to what |
| Floor after edits | |
| Accepted or rejected | see rule below |
| Would use before quoting | yes / no / maybe, verbatim |
| Price named | $ |
| Feature asks | list, but do not act on any of them |

---

## Accept vs reject

**Accepted:** after editing lines they disputed, the operator agrees the floor is within
range of true. Signals: *"yeah, that's about right,"* going quiet, doing a second job
unprompted, asking how to get it.

**Rejected:** the operator disputes the total rather than a line, blames the tool, or says
*"nobody around here would pay that"* without engaging the stack. Signals: pushing the phone
back, changing subject to what the market charges.

The distinction is whether they argue with a **line** or with the **total**. Line = the
transparency is working. Total = it isn't.

---

## Decision rule

| Result | Action |
|---|---|
| 4–5 accept, 3+ would use before quoting | Proceed to launch build. Start the washing pack. |
| 3 accept | Proceed, but the rejecting sessions are the priority: which line failed, fix the stack. |
| 2 or fewer accept | Stop. The floor is being rejected. Either the pack is wrong (fixable) or operators won't accept a floor above market (not fixable by product). Diagnose before writing more code. |

The line you're watching for in the rejects is *"I know I'm under, but that's the market."*
If three people say that, the product is a reporting tool, not a pricing tool, and the
whole positioning shifts.

---

## Ceiling questions — ask, do not build

Ask each operator, after the floor session, in passing:

- *"When was the last time you lost a job on price?"*
- *"How did you know?"*
- *"Do you ever wonder if you could have charged more?"*

Record verbatim. This is the only validation the ceiling gets before month three. Do not
show a ceiling, do not describe price bands, do not build anything from these answers yet.

---

## What not to do

- Do not demo the config panel. They see it only if they open it.
- Do not explain the formula. If they ask, tap the line.
- Do not defend the number. Say *"change it"* and hand them the phone.
- Do not take feature requests as validation. *"It should sync with Jobber"* is a
  preference, not evidence.
- Do not sell. If they ask for it, take their email and say *"soon."*
- Do not run more than one session a day. Write up the same day, every time.

---

## After five

Read the five pages together. Answer in one paragraph each:

1. Which stack line was disputed most, and was the pack wrong or the operator?
2. Did anyone reject the total? What did they say?
3. What did they name as a price? Median?
4. Did anyone do a second job without being asked?

Then apply the decision rule and act on it within a week.
