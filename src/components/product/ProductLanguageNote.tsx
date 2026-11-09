import { useLocale } from '../../i18n/context';
import { Text } from '../ui/Text';
import './ProductLanguageNote.css';

/** Website localization does not promise a localized interface in the separate application. */
export function ProductLanguageNote({ className = '', id }: { className?: string; id?: string }) {
  const { t } = useLocale();
  return (
    <Text as="p" id={id} className={`product-language-note ${className}`.trim()}>
      {t('Application interface: English.')}
    </Text>
  );
}
