import { Grid, Card, Heading, Text, Flex } from '@radix-ui/themes';

export const ChiroList = () => (
  <Grid columns={{ initial: '1', md: '3' }} gap="5" width="auto">
    {/* Card 1 */}
    <Card>
      <Flex direction="column" gap="2">
        <Heading size="4">Dr. Smith</Heading>
        <Text>Gonstead Specialist</Text>
      </Flex>
    </Card>

    {/* Card 2 */}
    <Card>
      <Flex direction="column" gap="2">
        <Heading size="4">Dr. Johnson</Heading>
        <Text>Activator Method</Text>
      </Flex>
    </Card>

    {/* Card 3 */}
    <Card>
      <Flex direction="column" gap="2">
        <Heading size="4">Dr. Williams</Heading>
        <Text>Sports Chiropractic</Text>
      </Flex>
    </Card>
  </Grid>
);

