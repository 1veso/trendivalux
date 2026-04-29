import LegalPageLayout from '../components/LegalPageLayout';
import contentDE from '../content/legal/DATENSCHUTZ.md?raw';
import contentEN from '../content/legal/PRIVACY_EN.md?raw';

export default function DatenschutzPage() {
  return (
    <LegalPageLayout
      titleDE="Datenschutzerklärung"
      titleEN="Privacy Policy"
      pathname="/datenschutz"
      contentDE={contentDE}
      contentEN={contentEN}
      defaultLang="de"
    />
  );
}
