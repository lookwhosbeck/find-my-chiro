import { Heading, Text, Strong, Em } from '@radix-ui/themes';

export const TypographyExample = () => (
  <>
    <Heading as="h1" size="9">Big Title</Heading>
    <Heading as="h2" size="6">Sub Title</Heading>

    <Text as="p" size="3">
      This is body text with <Strong>bold</Strong> and <Em>italics</Em>.
    </Text>
  </>
);

