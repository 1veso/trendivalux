import LegalPageLayout from '../components/LegalPageLayout';
import contentDE from '../content/legal/AGB_B2C.md?raw';
import contentEN from '../content/legal/GTC_B2C_EN.md?raw';

export default function AGBB2CPage() {
  return (
    <LegalPageLayout
      titleDE="AGB für Verbraucher"
      titleEN="GTC for Consumers"
      pathname="/agb-b2c"
      contentDE={contentDE}
      contentEN={contentEN}
      defaultLang="de"
    />
  );
}
