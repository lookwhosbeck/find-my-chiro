import { Flex, Text, Avatar } from '@radix-ui/themes';

interface TestimonialProps {
  quote: string;
  author: string;
  avatarInitial?: string;
  avatarUrl?: string;
  reverse?: boolean;
}

export function Testimonial({ quote, author, avatarInitial, avatarUrl, reverse = false }: TestimonialProps) {
  return (
    <Flex
      direction={{ initial: 'column', md: reverse ? 'row-reverse' : 'row' }}
      gap="6"
      align="start"
      style={{
        padding: '60px 24px',
        width: '100%',
      }}
    >
      <Flex
        direction="column"
        gap="2"
        style={{
          flex: 1,
          fontFamily: "'Untitled Serif', Georgia, serif",
          fontStyle: 'italic',
          fontSize: '32px',
          lineHeight: '38.4px',
          letterSpacing: '-0.96px',
          color: '#030302',
          position: 'relative',
          paddingLeft: reverse ? '0' : '16px',
          paddingRight: reverse ? '16px' : '0',
        }}
      >
        <Text
          style={{
            position: 'absolute',
            left: reverse ? 'auto' : '-16px',
            right: reverse ? '-16px' : 'auto',
            top: '18.5px',
            transform: 'translateY(-50%)',
            fontSize: '32px',
            lineHeight: '38.4px',
            fontFamily: "'Untitled Serif', Georgia, serif",
            fontStyle: 'italic',
          }}
        >
          "
        </Text>
        <Text style={{ fontSize: '32px', lineHeight: '38.4px' }}>{quote}</Text>
      </Flex>
      <Flex
        direction="column"
        gap="3"
        align="start"
        style={{ minWidth: 'fit-content' }}
      >
        <Flex gap="3" align="center">
          {reverse && (
            <div
              style={{
                width: '1px',
                height: '1px',
                background: 'rgba(3, 3, 2, 0.25)',
                flex: 1,
                maxWidth: '302px',
              }}
            />
          )}
          <Avatar
            size="4"
            radius="full"
            src={avatarUrl}
            fallback={avatarInitial || author[0]}
            style={{
              width: '56px',
              height: '56px',
              background: '#fde99b',
              border: '4px solid rgba(3, 3, 2, 0.09)',
            }}
          />
          {!reverse && (
            <div
              style={{
                width: '1px',
                height: '1px',
                background: 'rgba(3, 3, 2, 0.25)',
                flex: 1,
                maxWidth: '302px',
              }}
            />
          )}
        </Flex>
        <Text
          size="4"
          weight="regular"
          style={{
            fontSize: '20px',
            lineHeight: '28px',
            letterSpacing: '-0.4px',
            color: 'rgba(3, 3, 2, 0.75)',
          }}
        >
          {author}
        </Text>
      </Flex>
    </Flex>
  );
}
