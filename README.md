# Stillroom digital product

A reviewed static-shell Micro backed by a small Abla Wasm server. The browser
uses the injected SDK for app accounts, authoritative purchase state, Stripe
Checkout, and an entitlement-checked download. The server handles the trusted
`purchase.completed` and `schedule.triggered` application events idempotently
with create-only project records keyed by stable event identity. It intentionally
contains no payment provider code or protected file under `public/`.

`GET /library` is rendered by the project Wasm from an Abla `$html` tree. Micro
supplies the authenticated app-user context, the server SDK escapes every text
and interpolation node, and the runner injects the browser SDK into the HTML
response. This demonstrates authenticated SSR without trusting browser claims
or hand-building HTML strings.

Authenticated buyers can also ask the Wasm server to email a library reminder.
The server verifies the entitlement, then calls `microEmailCurrentUser`. Micro
chooses the verified session user's address and wraps the bounded plain text in
its safe MJML template; site code cannot choose a recipient, sender, HTML, URL,
attachment, or provider credential. Preview mail remains a local fixture.

```sh
micro build
micro dev
micro deploy --preview
micro deploy stillroom-presets
micro products sync
micro files upload preset-files ./quiet-light.zip --entitlement preset-files
micro schedules set catalog-refresh --every-minutes 1440 --payload-file schedule.json
```

Use a non-sensitive test archive locally. Upload the real product only through
the dashboard or CLI after deployment. Product synchronization is additive and
does not delete remote resources. Schedule payloads are non-secret configuration;
external traffic cannot reach the runner-owned event route, and the handler
still deduplicates every at-least-once delivery by `x-micro-event-id`.
