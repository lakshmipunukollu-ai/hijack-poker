import CountUp from 'react-countup';

interface Props {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}

export default function AnimatedNumber({
  value,
  duration = 1.2,
  decimals = 0,
  suffix = '',
  prefix = '',
}: Props) {
  return (
    <CountUp
      end={value}
      duration={duration}
      decimals={decimals}
      suffix={suffix}
      prefix={prefix}
      separator=","
      preserveValue
    />
  );
}
