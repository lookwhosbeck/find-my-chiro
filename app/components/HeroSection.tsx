import { Flex, Text, Button } from '@radix-ui/themes';

export const HeroSection = () => (
  <Flex direction="column" gap="4" align="center">
    <Text size="8" weight="bold">Find a Chiropractor</Text>
    <Text size="4" color="gray">Search by zip code or modality.</Text>
    
    <Flex gap="3">
      <Button size="3" variant="solid">Search Now</Button>
      <Button size="3" variant="outline">Learn More</Button>
    </Flex>
  </Flex>
);

