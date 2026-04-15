# shadcn Pro Kit registry (`@shadcnuikit`)

## Local development

1. Add `REGISTRY_TOKEN` to `.env.local` (never commit the token).
2. [`components.json`](../components.json) includes:

```json
"registries": {
  "@shadcnuikit": {
    "url": "https://shadcnuikit.com/r/{name}.json",
    "headers": {
      "Authorization": "Bearer ${REGISTRY_TOKEN}"
    }
  }
}
```

3. Install Pro Kit blocks with the shadcn CLI, e.g.  
   `npx shadcn@latest add @shadcnuikit/<block-name> -y`  
   (exact names depend on your Pro Kit license.)

4. **Commit generated files** under `components/` so CI and Vercel do not need the token at build time.

## CI / Vercel

- If a build step runs `shadcn add` against the private registry, set `REGISTRY_TOKEN` in the project environment variables.
- Prefer committing components after generation so production builds stay deterministic.

## New features (chat, messaging, etc.)

Scaffold from Pro Kit templates, then wire existing Supabase / API / email patterns. Import primitives only from `@/components/ui/*` so global tokens control appearance.
