import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TestimonialProps {
  quote: string;
  author: string;
  avatarInitial?: string;
  avatarUrl?: string;
  reverse?: boolean;
}

export function Testimonial({
  quote,
  author,
  avatarInitial,
  avatarUrl,
  reverse = false,
}: TestimonialProps) {
  return (
    <div
      className={`flex w-full flex-col gap-6 px-6 py-[60px] ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'}`}
    >
      <div
        className="relative flex flex-1 flex-col gap-2"
        style={{
          fontFamily: "'Untitled Serif', Georgia, serif",
          fontStyle: 'italic',
          fontSize: '32px',
          lineHeight: '38.4px',
          letterSpacing: '-0.96px',
          color: '#030302',
          paddingLeft: reverse ? '0' : '16px',
          paddingRight: reverse ? '16px' : '0',
        }}
      >
        <span
          className="absolute"
          style={{
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
        </span>
        <span style={{ fontSize: '32px', lineHeight: '38.4px' }}>{quote}</span>
      </div>
      <div
        className="flex min-w-fit flex-col items-start justify-between gap-3"
      >
        <div className="flex items-center gap-3">
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
            className="h-[72px] w-[72px] rounded-full border-4 border-[rgba(3,3,2,0.09)] bg-[#fde99b]"
          >
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="rounded-full bg-[#fde99b] text-lg font-medium text-[#030302]">
              {avatarInitial || author[0]}
            </AvatarFallback>
          </Avatar>
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
        </div>
        <p
          className="text-xl font-normal"
          style={{
            lineHeight: '28px',
            letterSpacing: '-0.4px',
            color: 'rgba(3, 3, 2, 0.75)',
          }}
        >
          {author}
        </p>
      </div>
    </div>
  );
}
