import { Text } from '../../components/ui/Text';
import { topics } from './contactTopics';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { supportEmail } from '../../config/site';
import { siteHref } from '../../app/paths';
import { Notice } from '../../components/layout/PageFrame';
import { DoubleButton } from '../../components/ui/DoubleButton';
import { MorphPanel } from '../../components/ui/MorphPanel';
import { useLocale } from '../../i18n/context';

export default function ContactForm({
  topic,
  onTopicChange,
}: {
  topic: string;
  onTopicChange: (topic: string) => void;
}) {
  const { t } = useLocale();
  const [status, setStatus] = useState('');
  const [opening, setOpening] = useState(false);
  const openingTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (openingTimer.current !== null) window.clearTimeout(openingTimer.current);
    },
    [],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity() || opening) return;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const company = String(data.get('company') || '').trim();
    const topic = String(data.get('topic') || '').trim();
    const message = String(data.get('message') || '').trim();
    if (!name || message.length < 10) {
      setStatus(
        t(
          !name
            ? 'Enter your name.'
            : 'Write at least 10 characters, excluding surrounding spaces.',
        ),
      );
      form
        .querySelector<HTMLInputElement | HTMLTextAreaElement>(
          !name ? '[name="name"]' : '[name="message"]',
        )
        ?.focus();
      return;
    }
    const subject = encodeURIComponent('Apcosys: ' + t(topic));
    const body = encodeURIComponent(
      [
        t('Name: {name}', { name }),
        t('Work email: {email}', { email }),
        t('Company: {company}', { company: company || t('Not provided') }),
        t('Topic: {topic}', { topic: t(topic) }),
        '',
        message,
      ].join('\n'),
    );
    setOpening(true);
    setStatus(
      t(
        'Your email application will open with a prepared message. Please send the email there; this website has not submitted it.',
      ),
    );
    window.location.href = 'mailto:' + supportEmail + '?subject=' + subject + '&body=' + body;
    openingTimer.current = window.setTimeout(() => {
      openingTimer.current = null;
      setOpening(false);
    }, 700);
  }
  const privacyMarker = '__APCOSYS_PRIVACY_POLICY__';
  const privacyConsent = t(
    'I agree to the processing of my data in line with the {privacyPolicy}.',
    { privacyPolicy: privacyMarker },
  );
  const markerIndex = privacyConsent.indexOf(privacyMarker);
  const privacyBefore = markerIndex >= 0 ? privacyConsent.slice(0, markerIndex) : privacyConsent;
  const privacyAfter =
    markerIndex >= 0 ? privacyConsent.slice(markerIndex + privacyMarker.length) : '';
  return (
    <form id="contact-form" className="stage-contact-form" onSubmit={submit} noValidate={false}>
      <Text as="p" className="stage-form-hint">
        All fields are required except company.
      </Text>
      <div className="stage-form-row">
        <label>
          {t('Name')} <input name="name" required autoComplete="name" maxLength={100} />
        </label>
        <label>
          {t('Work email')}{' '}
          <input name="email" required type="email" autoComplete="email" maxLength={200} />
        </label>
      </div>
      <div className="stage-form-row">
        <label>
          <span className="stage-form-label">
            {t('Company')} <small>{t('(optional)')}</small>
          </span>
          <input name="company" autoComplete="organization" maxLength={120} />
        </label>
        <label>
          {t('Topic')}{' '}
          <select
            name="topic"
            required
            value={topic}
            onChange={(event) => onTopicChange(event.target.value)}
          >
            <option value="" disabled>
              {t('Select a topic')}
            </option>
            {topics.map((topic) => (
              <option value={topic} key={topic}>
                {t(topic)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span id="contact-message-label">{t('Message')}</span>
        <textarea
          name="message"
          required
          rows={7}
          minLength={10}
          maxLength={6000}
          aria-labelledby="contact-message-label"
          aria-describedby="contact-message-hint"
          placeholder={t('Tell us what you would like to evaluate…')}
        />
        <span id="contact-message-hint" className="stage-form-hint">
          {t('At least 10 characters.')}
        </span>
      </label>
      <label className="stage-consent">
        <input type="checkbox" name="consent" required />{' '}
        <span>
          {privacyBefore}
          <a href={siteHref('/legal/privacy-policy')}>{t('Privacy Policy')}</a>
          {privacyAfter}
        </span>
      </label>
      <DoubleButton type="submit" className="stage-contact-submit" disabled={opening}>
        {t(opening ? 'Opening email…' : 'Prepare email')}
      </DoubleButton>
      <MorphPanel className="stage-form-feedback">
        {status && (
          <Text as="p" className="stage-form-status" role="status">
            {status}
          </Text>
        )}
        <Notice>
          Messages are not stored or delivered by this website. This form prepares a draft in your
          email application; review and send it there.
        </Notice>
      </MorphPanel>
    </form>
  );
}
