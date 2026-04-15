# Radix Themes → shadcn / Tailwind cheat sheet

Use this when refactoring remaining JSX or new Pro Kit templates so spacing and typography stay consistent.

| Radix Themes | Tailwind / HTML |
|--------------|-----------------|
| `<Flex direction="column" gap="4">` | `<div className="flex flex-col gap-4">` |
| `<Flex align="center" justify="between">` | `<div className="flex items-center justify-between">` |
| `<Box py="4" mt="2">` | `<div className="py-4 mt-2">` |
| `<Text size="2" weight="medium" color="gray">` | `<span className="text-sm font-medium text-muted-foreground">` |
| `<Heading size="5" as="h2">` | `<h2 className="text-xl font-semibold tracking-tight">` |
| `<Button variant="solid" size="2">` | `<Button size="sm">` (default variant) |
| `<Button variant="outline">` | `<Button variant="outline">` |
| `<Button variant="ghost">` | `<Button variant="ghost">` |
| `<Button asChild>` | `<Button asChild>` (same, shadcn) |
| Radix `Checkbox` | `@/components/ui/checkbox` |
| Radix `Dialog.*` | `@/components/ui/dialog` (`Dialog`, `DialogContent`, …) |
| Radix `TextField.Root` | `@/components/ui/input` + `Label` |
| Radix `TextArea` | `@/components/ui/textarea` |
| Radix `Avatar` | `@/components/ui/avatar` |
| Radix `Card` | `@/components/ui/card` |

## Functional checks after each refactor

- Supabase `onAuthStateChange` / `getSession` still run inside `useEffect` with correct cleanup.
- Form handlers (`onSubmit`, `handleSubmit`, save handlers) unchanged.
- `fetch('/api/...')` URLs and bodies unchanged.
- Mapbox: do not change `MapView` map initialization logic; only layout wrappers and copy may use Tailwind.
