import { Icon, type IconProps } from "./ui/icon";

// Compatibility names keep existing callers and sizing intact; geometry is exclusively Regen.
type P = Omit<IconProps, "name">;

export const ArrowRight = (props: P) => <Icon name="arrow-right" {...props} />;
export const ArrowLeft = (props: P) => <Icon name="arrow-left" {...props} />;
export const ChevronLeft = (props: P) => <Icon name="chevron-left" {...props} />;
export const ChevronDown = (props: P) => <Icon name="chevron-down" {...props} />;
export const Close = (props: P) => <Icon name="x" {...props} />;
export const Menu = (props: P) => <Icon name="menu" {...props} />;
export const MenuShort = (props: P) => <Icon name="menu" {...props} />;
export const Plus = (props: P) => <Icon name="plus" {...props} />;
export const Check = (props: P) => <Icon name="check" {...props} />;
export const Search = (props: P) => <Icon name="search" {...props} />;
export const SearchEmpty = (props: P) => <Icon name="search" {...props} />;
export const Info = (props: P) => <Icon name="info-circle" {...props} />;
export const Alert = (props: P) => <Icon name="circle-alert" {...props} />;
export const Upload = (props: P) => <Icon name="upload" {...props} />;
export const Download = (props: P) => <Icon name="download" {...props} />;
export const Refresh = (props: P) => <Icon name="refresh" {...props} />;
export const Desktop = (props: P) => <Icon name="monitor" {...props} />;
export const Tablet = (props: P) => <Icon name="tablet" {...props} />;
export const Phone = (props: P) => <Icon name="smartphone" {...props} />;
export const Home = (props: P) => <Icon name="home" {...props} />;
export const Grid = (props: P) => <Icon name="layout-grid" {...props} />;
export const Sliders = (props: P) => <Icon name="adjustments" {...props} />;
export const Form = (props: P) => <Icon name="file-text" {...props} />;
export const PhoneCall = (props: P) => <Icon name="phone" {...props} />;
export const Mail = (props: P) => <Icon name="mail" {...props} />;
export const Chat = (props: P) => <Icon name="message" {...props} />;
export const Clock = (props: P) => <Icon name="clock" {...props} />;
export const Pages = (props: P) => <Icon name="copy" {...props} />;
export const Gear = (props: P) => <Icon name="settings" {...props} />;
export const Image = (props: P) => <Icon name="photo" {...props} />;
export const Globe = (props: P) => <Icon name="globe" {...props} />;
export const File = (props: P) => <Icon name="file-text" {...props} />;
export const Sun = (props: P) => <Icon name="sun" {...props} />;
export const Moon = (props: P) => <Icon name="moon" {...props} />;
export const Dashboard = (props: P) => <Icon name="layout-grid" {...props} />;
export const Inbox = (props: P) => <Icon name="inbox" {...props} />;
export const Box = (props: P) => <Icon name="cube" {...props} />;
export const More = (props: P) => <Icon name="dots" {...props} />;
export const Pencil = (props: P) => <Icon name="pencil" {...props} />;
export const Filter = (props: P) => <Icon name="filter" {...props} />;
export const Copy = (props: P) => <Icon name="copy" {...props} />;
export const Lock = (props: P) => <Icon name="lock" {...props} />;
export const Monitor = (props: P) => <Icon name="monitor" {...props} />;

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center bg-band"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}
    >
      <Icon name="letter-a" size={Math.round(size * 0.56)} color="#D9F279" />
    </span>
  );
}
