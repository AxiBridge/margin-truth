# Margin Truth — Onboarding flow

Every screen, every line of copy, in order. Time budget from first tap to floor breach:
**under three minutes.** Anything that adds time without adding a number the floor needs
is cut.

Voice throughout: plain, direct, second person, no exclamation marks, no reassurance.
Dollars, never percent. Copy is final unless it tests badly.

---

## Screen 0 — Pick your trade

One question, four cards. No account, no email, nothing before this.

> **What do you do?**
>
> [ Detailing ] [ Pressure / soft washing ] [ Lawn and turf ] [ Something else ]

Selecting a card loads its pack. "Something else" → *"We don't have your numbers yet.
Leave an email and we'll tell you when we do."* One field, one button, exit.

Lawn and turf is greyed with *"Coming"* until the pack exists.

---

## Screen 1 — Your pay

> **What do you pay yourself?**
>
> [ $ 50 ] per hour
>
> *Not what you charge. What you'd pay someone else to do your job.*

Prefilled from the pack default. One field. Next.

---

## Screen 2 — Your overhead

> **What does it cost to be open each month?**
>
> Vehicle payments        [ $ 650 ]
> Vehicle insurance       [ $ 220 ]
> Business insurance      [ $  85 ]
> Fuel                    [ $ 300 ]
> Vehicle maintenance     [ $ 120 ]
> Equipment replacement   [ $ 150 ]
> Phone and internet      [ $  90 ]
> Software                [ $  80 ]
> Marketing               [ $ 150 ]
> Licences and accounting [ $  70 ]
> Facility rent           [ $   0 ]
> Facility utilities      [ $   0 ]
> Other                   [ $   0 ]
> ───────────────────────────────
> **Total                  $1,915 a month**
>
> *Most people guess about half of this the first time. Leave anything at zero if it
> doesn't apply.*

All thirteen visible, no collapse on this screen. This is the one place the app slows the
operator down on purpose, because the number they'd give unprompted is wrong.

Never ask for hourly overhead.

---

## Screen 3 — Your capacity

> **How much do you work?**
>
> Jobs per week           [ 10 ]
> Hours per job, average  [ 4  ]
> People doing the work   [ 1  ]
>
> ───────────────────────────────
> That's 173 billable hours a month.
> Your overhead comes to **$11.06 an hour** on top of your pay.
> Every hour you work costs **$61.06** before you open a bottle.

The derived lines update live as they type. The operator sees the allocation happen. This
is the number they will dispute later, so it has to be visibly built in front of them.

---

## Screen 4 — Your prices

> **What do you charge today?**
>
> Maintenance wash                  [ $  75 ]
> Full exterior decon + sealant     [ $ 175 ]
> Full interior detail              [ $ 200 ]
> Interior + exterior full detail   [ $ 275 ]
> Engine bay clean                  [ $  75 ]
> 1-step paint correction           [ $ 450 ]
> Ceramic coating                   [ $ 700 ]
> Headlight restoration             [ $  75 ]
>
> *Roughly is fine. You can fix these later.*

Service names and minutes are from the pack; only price is asked. Minutes are editable
later, not here — asking for minutes on this screen adds a minute and changes nothing the
first floor needs to land.

Supplier prices are **not** asked. The pack carries defaults. Asking here costs two minutes
and moves the floor by cents.

---

## Screen 5 — One job

> **Think of a job from last week you felt good about.**
>
> Which service?     [ Interior + exterior full detail ▾ ]
> What did you charge?  [ $ 275 ]
>
> [ Show me the floor ]

"Felt good about" is deliberate. Good feelings come from jobs that closed easily. Jobs that
close easily are the underpriced ones.

---

## Screen 6 — The floor

This is the whole product. Everything before it exists to make this number credible.

> Interior + exterior full detail · 6 hours
>
> ┌─────────────────────────────────────┐
> │ You charged $275. Your floor was $378. │
> │                                       │
> │ **That job cost you $103**            │
> └─────────────────────────────────────┘
>
> Where the floor comes from
>
> Labour · 360 min           $300.00
> Overhead · 360 min          $66.34
> Product · 11 items          $11.41
> ─────────────────────────────────
> **Floor                     $377.75**
>
> *Every number here is yours except product coverage rates. Tap any line to change it.*
>
> [ Price my next one ]

If the job clears the floor:

> ┌─────────────────────────────────────┐
> │ You charged $450. Your floor was $348. │
> │                                       │
> │ **You cleared it by $102**            │
> │ At your target margin this is $696.   │
> └─────────────────────────────────────┘

Then: *"Try one you weren't sure about."* Three jobs in, most operators find a breach.
Do not manufacture one.

### Line detail (tap any row)

**Labour** — `360 min × $50.00/hr ÷ 60 = $300.00`. Minutes editable.

**Overhead** — the thirteen lines, then `$1,915 ÷ 173.2 hours = $11.06/hr × 6 hrs = $66.34`.
Amounts editable. This is the row that gets disputed; show all of it.

**Product** — every consumable for the service:

> pH neutral soap        8 oz    $0.24
> Wheel cleaner          4 oz    $0.15
> Iron remover           5 oz    $1.25
> Clay lube              6 oz    $0.09
> Spray sealant          8 oz    $2.81
> Interior cleaner       7 oz    $0.10
> Carpet shampoo        12 oz    $0.88
> Glass cleaner          3 oz    $0.07
> Tire dressing          5 oz    $1.09
> Microfiber (sets)      2       $4.00
> Gloves                 1       $0.72
>
> *Quantities are our coverage estimates for a mid-size vehicle. Change any you know better.*

Quantity editable. The disclosure line is mandatory — it is the only place the app admits a
number isn't the operator's, and that honesty is what makes the rest of the stack trusted.

---

## After onboarding

The operator lands on the quote screen with their config saved. There is no dashboard.
There is no "welcome." There is a service dropdown and a price.

---

## What is deliberately absent

- Account creation before the floor. Email is asked after screen 6, once, with the copy
  *"Save your numbers"* — not before.
- Supplier prices during onboarding.
- Labour minutes during onboarding.
- Consumable quantities during onboarding.
- Any progress bar, step counter, or "you're almost there."
- Any screen that shows nothing until something is entered.
