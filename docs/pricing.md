# How the cost estimate works

The price in `shopping.md` is an estimate, not a live price. brickwise does not call any marketplace.

Each part and colour line gets a commonness tier from the pinned Rebrickable data: how many sets the part appeared in in that colour, and the last year it was produced (`tier()` in `forge/engine/avail.mjs`). Each tier has a price range per piece in PLN (`PRICE_PLN` in `src/bom.mjs`):

| tier | PLN per piece |
|---|---|
| common | 0.15 to 0.40 |
| regular | 0.30 to 0.80 |
| uncommon | 0.60 to 1.80 |
| rare | 1.50 to 5.00 |

These are rules of thumb from BrickLink EU averages for new parts. Shipping is 15 to 45 PLN per store, with one store per about 40 lines to buy (at least 1, at most 12).

Parts you already own (`--have`) and parts that cannot be bought are left out of the estimate.

Why no live prices: BrickLink API keys are for sellers, not buyers, and BrickOwl catalogue access needs manual approval. The real price shows up in the marketplace cart after you import `rebrickable.csv` or `bricklink.xml`.
