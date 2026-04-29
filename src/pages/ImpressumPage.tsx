import LegalPageLayout from '../components/LegalPageLayout';
import contentDE from '../content/legal/IMPRESSUM.md?raw';
import contentEN from '../content/legal/IMPRINT_EN.md?raw';

export default function ImpressumPage() {
  return (
    <LegalPageLayout
      titleDE="Impressum"
      titleEN="Imprint"
      pathname="/impressum"
      contentDE={contentDE}
      contentEN={contentEN}
      defaultLang="de"
    />
  );
}
