# SEO update handoff

Implemented:
- Added GeoCoordinates to both Donkams store Place schema entries.
- Added Monday-Saturday 08:00-18:00 openingHoursSpecification to both stores.
- Added WebSite JSON-LD on the homepage alongside ComputerStore schema.
- Added Product JSON-LD to product detail pages, with Offer only when a real price exists.
- Added explicit empty Disallow directive to robots.txt while keeping the site crawlable.
- Added SEO-focused category landing pages at /phones, /laptops, /starlink and /gaming.
- Improved several product names/descriptions without inventing model numbers or prices.

Build note:
The supplied node_modules is missing Rollup's Linux native optional dependency, so the included environment could not complete `astro build`. package.json and package-lock.json were left unchanged.
