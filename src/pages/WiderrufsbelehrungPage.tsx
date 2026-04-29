import LegalPageLayout from '../components/LegalPageLayout';
import contentDE from '../content/legal/WIDERRUFSBELEHRUNG.md?raw';

export default function WiderrufsbelehrungPage() {
  return (
    <LegalPageLayout
      titleDE="Widerrufsbelehrung"
      pathname="/widerrufsbelehrung"
      contentDE={contentDE}
    />
  );
}
