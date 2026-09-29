import QRCode from 'react-native-qrcode-svg';
import type { ImageSourcePropType } from 'react-native';

export default function QRCodeView({
  value,
  size = 180,
  color = '#0A1E3C',
  backgroundColor = 'transparent',
  logo,
  logoSize,
  logoBackgroundColor = '#FFFFFF',
  logoMargin = 4,
  logoBorderRadius = 8,
}: {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  logo?: ImageSourcePropType | string;
  logoSize?: number;
  logoBackgroundColor?: string;
  logoMargin?: number;
  logoBorderRadius?: number;
}) {
  return (
    <QRCode
      value={value}
      size={size}
      color={color}
      backgroundColor={backgroundColor}
      ecl="H"
      quietZone={8}
      logo={logo}
      logoSize={logoSize ?? size * 0.22}
      logoBackgroundColor={logoBackgroundColor}
      logoMargin={logoMargin}
      logoBorderRadius={logoBorderRadius}
    />
  );
}
