# Find My Chiro

A Next.js application using Radix Themes for styling.

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory with your Supabase credentials:

```bash
cp .env.example .env.local
```

Then update `.env.local` with your Supabase project URL and anon key:
- Get these from your Supabase project settings: https://app.supabase.com/project/_/settings/api
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Radix Themes Setup

This project uses [Radix Themes](https://www.radix-ui.com/themes) - a pre-styled component library built on top of Radix Primitives.

### Why Radix Themes?

- **No Tailwind**: Uses standard CSS variables under the hood
- **Maintainable**: Control the look globally via the Theme provider
- **Layout Engine**: Includes components like `<Flex>`, `<Grid>`, and `<Box>` to handle layout without writing CSS classes

### Theme Configuration

The theme is configured in `app/layout.tsx`:

```tsx
<Theme 
  accentColor="teal" 
  grayColor="slate" 
  radius="large" 
  scaling="100%"
>
```

### Using Layout Components

Instead of writing `div className="flex flex-col gap-4"`, use Radix layout components:

```tsx
import { Flex, Text, Button } from '@radix-ui/themes';

<Flex direction="column" gap="4" align="center">
  <Text size="8" weight="bold">Title</Text>
  <Button size="3" variant="solid">Click Me</Button>
</Flex>
```

### Typography

Use Radix Typography components instead of standard HTML elements:

```tsx
import { Heading, Text, Strong, Em } from '@radix-ui/themes';

<Heading as="h1" size="9">Big Title</Heading>
<Text as="p" size="3">
  Body text with <Strong>bold</Strong> and <Em>italics</Em>.
</Text>
```

### Custom Styles

When you need custom styles, use CSS Modules. You can still access Radix CSS variables:

```css
.customClass {
  color: var(--gray-12);
  background: var(--gray-1);
}
```

## 12-Column Grid System

This project uses a custom 12-column grid system built on top of Radix UI Themes for responsive layouts.

### Container Component

The `Container` component provides consistent max-width and responsive padding:

```tsx
import { Container } from './components/Container';

<Container>
  {/* Your content */}
</Container>
```

**Features:**
- Max-width: 1440px
- Responsive padding:
  - Mobile: 16px (--space-4)
  - Tablet: 24px (--space-5)
  - Desktop: 32px (--space-6)
- Centered automatically

### Grid12 Component

The `Grid12` component provides a pre-configured 12-column grid:

```tsx
import { Grid12 } from './components/Grid12';

<Grid12 gap="4">
  <Grid12.Item span={12} spanMd={6}>
    {/* Full width on mobile, half width on desktop */}
  </Grid12.Item>
  <Grid12.Item span={12} spanMd={6}>
    {/* Full width on mobile, half width on desktop */}
  </Grid12.Item>
</Grid12>
```

**Props:**
- `gap`: Spacing between grid items ('1' through '9')
- `withContainer`: Automatically wraps in Container (default: true)

**Grid Item Props:**
- `span`: Column span on mobile (1-12)
- `spanSm`: Column span on small screens (1-12)
- `spanMd`: Column span on medium screens (1-12)
- `spanLg`: Column span on large screens (1-12)

### Breakpoints

Radix UI uses the following default breakpoints:

- **initial**: < 520px (mobile)
- **sm**: ≥ 520px (small tablets)
- **md**: ≥ 768px (tablets)
- **lg**: ≥ 1024px (desktops)
- **xl**: ≥ 1280px (large desktops)

### Example Layouts

**Two-column layout (sidebar + content):**

```tsx
<Grid12 gap="6">
  <Grid12.Item span={12} spanMd={4}>
    <Card>Sidebar</Card>
  </Grid12.Item>
  <Grid12.Item span={12} spanMd={8}>
    <Card>Main Content</Card>
  </Grid12.Item>
</Grid12>
```

**Three-column layout:**

```tsx
<Grid12 gap="5">
  <Grid12.Item span={12} spanMd={4}>
    <Card>Column 1</Card>
  </Grid12.Item>
  <Grid12.Item span={12} spanMd={4}>
    <Card>Column 2</Card>
  </Grid12.Item>
  <Grid12.Item span={12} spanMd={4}>
    <Card>Column 3</Card>
  </Grid12.Item>
</Grid12>
```

**Asymmetric layout:**

```tsx
<Grid12 gap="4">
  <Grid12.Item span={12} spanMd={8}>
    <Card>Wide Content</Card>
  </Grid12.Item>
  <Grid12.Item span={12} spanMd={4}>
    <Card>Narrow Sidebar</Card>
  </Grid12.Item>
</Grid12>
```

### CSS Variables

The grid system uses CSS variables defined in `app/globals.css`:

```css
:root {
  --container-max-width: 1440px;
  --grid-columns: 12;
  --grid-gap-sm: var(--space-3);  /* 12px */
  --grid-gap-md: var(--space-4);  /* 16px */
  --grid-gap-lg: var(--space-5);  /* 24px */
}
```

## Learn More

- [Radix Themes Documentation](https://www.radix-ui.com/themes)
- [Next.js Documentation](https://nextjs.org/docs)

