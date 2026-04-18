import { MobileShell } from '../../components/mobile-shell';
import { MallHome } from '../../components/mall-home';

export default function MallPage() {
  return (
    <MobileShell tab="mall" tone="mall">
      <MallHome />
    </MobileShell>
  );
}
