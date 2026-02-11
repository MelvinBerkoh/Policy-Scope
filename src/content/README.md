This si where the parse lives
We are going to be DOM walking, text block extraction and visibility filtering

Just know that Its set up this way because Parsing != detecting. We want to be able to parse the page and then run detection on the parsed data. This allows us to have a more modular and flexible architecture.

This also Keeps logic testable and reusable.

NOTE: THis read me is a work in progress and will be updated as we continue to develop the extension.
