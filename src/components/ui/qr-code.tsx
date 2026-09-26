import QRCode from 'react-native-qrcode-svg';

export default function QRCodeView({
  value,
  size = 180,
  color = '#0A1E3C',
  backgroundColor = 'transparent',
}: {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}) {
  return (
    <QRCode
      value={value}
      size={size}
      color={color}
      backgroundColor={backgroundColor}
      ecl="H"
      quietZone={8}
    />
  );
}
