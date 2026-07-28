# Writing for this site

Rules worked out during a full content pass, kept here so later edits — mine or
anyone's — have something to check against. Every before/after below is real.

## 1. State the fact. Let the reader draw the conclusion.

The recurring fault was a fact followed by a clause explaining how impressive it
was. The facts were fine. The clauses were the site talking itself up.

> ~~Cut iOS build times by 24% … after profiling the build graph to find the real
> bottleneck **rather than the obvious one**.~~
> Cut iOS build times by 24% through modularisation and tooling, after profiling
> the build graph.

The 24% is the claim. Anything added to it is the page telling you what to think.

## 2. Describe the work, not yourself.

> ~~I'm the engineer teams borrow when the problem sits outside anyone's patch.~~
> Seven years a software engineer, primarily iOS, branching out wherever there's
> been room — a six-month rotation on the marketing ML team, open source in my
> own time.

The second says the same thing and asserts nothing.

## 3. No superlative you cannot evidence.

> ~~One of the earliest production deployments of conversational AI in the product.~~
> Integrated a conversational virtual assistant into the banking app.

If it needs "one of the first", "the best" or "uniquely", it needs a source
instead — and usually a date does the job. `SmartMealPlanner` says *December
2023, when there was no official Swift SDK*; that dates the work without
claiming anything about it.

## 4. Write to the visitor, never to the site's owner.

Section notes are read by recruiters, not by whoever maintains this.

> ~~Straight from Medium. **Publish there, and it shows up here.**~~
> Notes on what I'm building, published on Medium.

> ~~The top half is **mine to write**. Everything below it reads itself off GitHub.~~
> What I'm working on, and what GitHub has recorded. Updated daily.

## 5. No aphorisms.

> ~~The part of the job that compounds.~~ *(deleted)*

A one-line epigram above a two-line section is the most self-important shape a
page can take. `Section` treats `note` as optional — use that.

## 6. Say it once.

The hero, the projects intro and the project cards all described the same two
projects. The intro was cut. If two sections make the same point, the one with
the evidence underneath it keeps it.

## 7. Be accurate about status.

Copy drifts out of true as work moves on, and a reader who clicks through finds
out immediately.

- "Right now I'm building CyclOps" — it was already built.
- AdoptAheadOS is described as **an early build**, because it is one.
- The ML rotation is **six months, Feb–Aug 2026**, not "a stint".

## 8. iOS is evidence, not identity.

The site is aimed at general software engineering and agent work. Seven years of
iOS is what proves the depth is real, so it stays everywhere — as the third
thing, not the first. Applies to prose, the meta description, the `knowsAbout`
structured data in `src/layouts/Base.astro`, and the CV track order.

---

## Before publishing, check

- [ ] Every sentence states something, rather than characterising it
- [ ] Every number is one you could show someone
- [ ] Nothing addressed to the person editing the file
- [ ] Nothing repeated from another section
- [ ] Anything describing current work is still current
- [ ] Anything linked still exists — and says what this page says it says
