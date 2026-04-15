export const TypographyExample = () => (
  <>
    <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
      Big Title
    </h1>
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight text-foreground first:mt-0">
      Sub Title
    </h2>

    <p className="leading-7 text-foreground [&:not(:first-child)]:mt-6">
      This is body text with <strong className="font-semibold">bold</strong> and{' '}
      <em className="italic">italics</em>.
    </p>
  </>
);
