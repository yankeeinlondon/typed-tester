# Concurrency

This repo is involved in some expensive operations that could benefit from the potential of concurrency on a modern system.

## Context

- We need to ensure that concurrency only depends on `node` to operate but there is interest in allowing [`Bun`](https://bun.com) to be the runner too; especially if performance strongly favors it (this needs to be tested)
    - Because we'd like to support both **node** and **Bun** we need to consider this when leveraging other **npm** packages designed to aid in the use of concurrency/parallelism
- [Research](https://chatgpt.com/share/68f448e1-d2f4-8000-8a56-262cea8072af) was done on which **npm** packages might be helpful
- although we're currently _caching_ to files it may be worth starting to cache to a SQLite database
    - the Bun support for this is amazing but using it means we'd need a bit of an abstraction so that a node runner would get a slightly different code path
    - I think the node version is getting quite good too now
    - There are many documented cases where SQLite reads are actually _faster_ than just a read from the file system!
    - But beyond that we might find some useful ways to build up reporting data beyond just caching information. This is future functionality but it still provides an incentive to think about DB storage versus file storage.


