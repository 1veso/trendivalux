import LegalPageLayout from '../components/LegalPageLayout';
import contentDE from '../content/legal/AGB_B2B.md?raw';
import contentEN from '../content/legal/GTC_B2B_EN.md?raw';

export default function AGBPage() {
  return (
    <LegalPageLayout
      titleDE="AGB (B2B)"
      titleEN="GTC (B2B)"
      pathname="/agb"
      contentDE={contentDE}
      contentEN={contentEN}
      defaultLang="de"
    />
  );
}
