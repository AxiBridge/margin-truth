# Margin Truth — Build plan, step by step

What you do, in order, from where you are today. Each step says who does it (you or
Claude Code), what to hand over, and what "done" looks like. Do not skip ahead; every
step gates the next.

**Where you are:** demo runs on your machine with your numbers. Config panel spec'd, not built.

---

## How to work with Claude Code — read once

- **One feature per session.** Never "build Phase 1." Always "build the quote screen per
  section X of file Y."
- **Commit before every session.** `git add -A && git commit -m "before: <feature>"`.
  If it wanders, `git checkout .` gets you back.
- **Paste the acceptance criteria into the prompt.** Every brief in this package has them.
  End every prompt with: *"Run `npm run build` and fix all errors before you report done."*
- **Point it at the file, don't paraphrase.** *"Read 03-onboarding-flow.md and build screens
  0 through 3 exactly as written"* beats a description you type from memory.
- **Check the numbers, not the code.** You verify that $275 on a full detail shows a
  $377.75 floor. You do not read TypeScript.
- **Keep the docs in the repo.** `docs/` folder, all eleven files. Claude Code reads them
  from there.

---

## Week 1 — Finish the demo

**1. Config panel.** *(Claude Code)*
Prompt: *"Read docs/config-addendum.md. Build it. Persist to localStorage per
docs/02-data-model.md. Include Reset to defaults."*
Done when: you change your pay to $60, the floor moves, you reload, it's still $60, you
reset, it's $50.

**2. Style.** *(Claude Code)*
Prompt: *"Read docs/04-design-system.md. Apply it to every screen. No new features."*
Done when: it looks like warm paper and a ledger on your phone. One saturated block.

**3. Acceptance.** *(You)*
Full detail at $275 → floor $377.75, loss $102.75. Boat polish at $400 → clears by
$237.65. Every stack row expands. Every editable field moves the floor. 380px wide, no
horizontal scroll.

**4. Deploy.** *(You, ten minutes)*
- Create a GitHub account if you don't have one. Push the repo.
- Create a Vercel account. Import the repo. It deploys on every push.
- Open the URL on your phone. Add to home screen.
Done when: it opens from your home screen without the browser bar.

**5. Tag it.** `git tag demo-v1`. This is the version you demo. Don't touch it during
the sessions.

---

## Weeks 2–3 — Five sessions

**6. Book them.** *(You)* Per docs/06-validation-plan.md. Two under two years, two five-plus,
one with a shop or second van. Fifteen minutes each, in person or screen share.

**7. Run them.** Reset the config before each. Hand over the phone. Say nothing for thirty
seconds after the floor appears. Write up the same day.

**8. Decide.** Apply the rule in 06. Four or five accept → step 9. Two or fewer → stop and
diagnose. Do not start Phase 1 on a maybe.

---

## Week 4 — Set up the business, fix the pack

**9. Price.** *(You)* Median of the five named prices, rounded to $49 or $59. That's the
launch price. Phase 2 moves it up.

**10. Name, domain, entity.** *(You)*
- Check the name. Search Canadian and US trademark databases, and the App Store, for
  "Margin Truth." If clear, register margintruth.com or .ca and a matching handle.
- Entity: an Alberta corporation is the normal choice once you're charging money;
  a sole proprietorship is faster. I'm not a lawyer — spend an hour with one.
- Business bank account. Needed for Stripe and any aggregator.

**11. Pack provenance.** *(You, with pads and a scale)*
Per docs/05-vertical-pack-guide.md. The top ten cost lines must be measured or
operator-reported. Concretely: count pads on your next three corrections, weigh a
compound bottle before and after, count towel sets. Re-baseline every quantity to a
mid-size sedan. Update the workbook, regenerate the JSON.

**12. Start the washing pack.** *(Collaborator)* Hand over 05. Seven services, SH
consumption per 100 sq ft at stated mix strength. This runs in parallel with everything
below and gates the second vertical, not launch.

---

## Weeks 5–10 — Phase 1 build

Accounts to create first, all free tier: **Supabase** (database + auth), **Twilio** (SMS),
**Resend** (email), **Stripe** (your subscription billing only — not customer payments yet).

Build as a PWA, not a native app. App Store review, a $99/year developer account, and a
second codebase are Phase 3 problems at earliest. A PWA on the home screen is
indistinguishable to a detailer.

**13. Backend and auth.** *(Claude Code)*
Prompt: *"Add Supabase. Tables per docs/02-data-model.md: operators, overhead_lines,
services, consumables, service_consumables, jobs, quotes, customers. Magic-link auth.
Move config from localStorage to the operator's row."*
Done when: you sign in with your email on two devices and see the same numbers.

**14. Onboarding.** *(Claude Code)*
Prompt: *"Read docs/03-onboarding-flow.md. Build screens 0–6 exactly as written. Pack loads
by vertical on screen 0."*
Done when: a fresh email reaches the floor screen in under three minutes with no blank
field anywhere.

**15. Quote screen.** *(Claude Code)*
Prompt: *"Quote screen per docs/01-product-spec.md §4.1: service, units, price slider with
hard floor rail, target line, reason code required below floor."*
Done when: the slider stops at the floor and won't pass without a reason.

**16. Send.** *(Claude Code)*
Prompt: *"Quote → PDF (operator's name and logo only, no Margin Truth branding) → SMS via
Twilio with an accept/decline link. Accept creates the job. Decline records 'lost.'"*
Done when: you text yourself a quote and accept it from your phone.

**17. Customers.** *(Claude Code)*
Prompt: *"First quote to a new phone number creates a customer record: name, phone, vehicle.
No add-customer screen exists."*
Done when: there is no way to create a customer except by quoting one.

**18. Close-out.** *(Claude Code)*
Prompt: *"Close-out per §5: actual minutes, actual product, one-tap 'as quoted.' Realised
margin stored per job. Under 20 seconds."*
Done when: you time it. If it's over 20 seconds, cut fields.

**19. Weekly digest.** *(Claude Code)*
Prompt: *"Sunday 6pm email via Resend. Three lines: jobs closed, realised vs quoted in
dollars, one decision. Per docs/04 voice table."*

**20. Subscription.** *(Claude Code)*
Prompt: *"Stripe Billing, one plan at $[step 9]/month, 14-day trial, card required. Lock the
quote screen on expiry, leave the floor screen open."*
Leaving the floor open on expiry is deliberate. It's the hook, and a lapsed operator who
can still see they're underpricing comes back.

**21. Landing page.** *(Claude Code)*
One page. Warm paper. One line: *"You're underquoting and you can't see it."* One button
into onboarding. No feature grid, no testimonials, no pricing table — price is on the
signup screen.

**22. Beta.** *(You)* Your five, plus five more from the network. Sixty days. Watch
close-out rate weekly. Under 60% by week four means step 18 has friction — fix it before
anything else.

---

## Phase 2 — Money (after ten paying operators)

**23. Aggregator quotes.** *(You, week 1 of Phase 2)* Email VoPay and Flinks Pay. Ask for
Request Money platform pricing, per-operator settlement, onboarding time. Pick one.

**24. Invoice.** *(Claude Code)* One tap from close-out. Carries realised numbers.

**25. Interac.** *(Claude Code)* Request Money from the invoice via the aggregator. Job ID
in the request. Webhook on acceptance marks paid and updates realised margin.

**26. Stripe Connect.** *(Claude Code)* Second rail. Deposits on coating and correction,
tap-to-pay. Accounts v2 API. Pass-through fees.

**27. Monthly report.** *(Claude Code)* Per §8. Quoted vs realised by service and customer,
breaches, reason-code dollars, one decision.

**28. QuickBooks.** *(Claude Code)* Invoices out, supplier costs in. Read the QBO API rate
limits first — they're strict.

**29. Price increase.** New signups to the $70–110 band. Existing grandfathered six months.

---

## The list of things you personally own

Everything Claude Code can't do:

- GitHub, Vercel, Supabase, Twilio, Resend, Stripe accounts
- Domain and trademark check
- Legal entity and bank account
- Pad counts, product weights, towel life — the pack
- Five sessions and five write-ups
- The price
- Aggregator sales calls
- Ten beta operators

That's the whole job. Everything else is a prompt.
