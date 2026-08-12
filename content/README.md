# Curriculum sources

`build/build.mjs <tech>` reads `<tech>-curriculum.md` from this directory.

These files are currently missing from the repo, which is why a fresh clone cannot
rebuild a ship from markdown. Drop them here to restore the full pipeline:

    content/docker-curriculum.md
    content/python-curriculum.md
    content/javascript-curriculum.md
    content/htmlcss-curriculum.md
    content/sql-curriculum.md
    content/rest-api-curriculum.md

Until then, use `node build/repair.mjs --all` — it recovers each part's prose from
the already-built pages and re-emits them through the real builder.
