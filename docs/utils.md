# Helper Utilities


## `link`

The `src/utils/link.ts` source file has a number of variants of _link_ functionality where you can add text and a URI that will be sent to modern consoles as a _link_ with just the text you've provided as the link but with the URI's resource information embedded into the console so that when you click on the link it knows what to do.

This is not only a much nicer _looking_ way of creating links but it's functional too: screen real estate is always cramped in consoles and not having to put the bare URI onto the screen saves a lot of real estate for information you can present to the user.

## `prettyPath`

takes a filepath and colorizes in such a way as to allow the reader to easily understand the full path but also emphasis the last segment in that filepath as that typically has greatest interest.


