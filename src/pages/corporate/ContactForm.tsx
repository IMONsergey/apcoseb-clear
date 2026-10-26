import { Text } from '../../components/ui/Text';
import { topics } from './contactTopics';
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { supportEmail } from '../../config/site';
import { siteHref } from '../../app/paths';
import { DoubleButton } from '../../components/ui/DoubleButton';
import { SelectField } from '../../components/ui/SelectField';
import { MorphPanel } from '../../components/ui/MorphPanel';
import { useLocale } from '../../i18n/context';
import { readContactDraft, saveContactDraft, type ContactDraft } from './contactDraft';

export default function ContactForm({
  topic,
  onTopicChange,
}: {
  topic: string;
  onTopicChange: (topic: string) => void;
}) {
  const { t } = useLocale();
  // A string is field feedback; true requests the direct-email fallback.
  const [status, setStatus] = useState<string | true>('');
  const [opening, setOpening] = useState(false);
  const [draft, setDraft] = useState(readContactDraft);
  const openingTimer = useRef<number | null>(null);

  useLayoutEffect(() => {
    setStatus('');
    saveContactDraft({ ...readContactDraft(), topic });
  }, [topic]);

  const updateDraft = (values: Partial<ContactDraft>) => {
    const next = { ...draft, ...values, topic };
    setDraft(next);
    saveContactDraft(next);
    setStatus('');
  };

  useEffect(
    () => () => {
      if (openingTimer.current !== null) window.clearTimeout(openingTimer.current);
    },
    [],
  );

  function prepare(form: HTMLFormElement) {
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const read = (field: string) => String(data.get(field) || '').trim();
    const name = read('name');
    const email = read('email');
    const company = read('company');
    const topic = read('topic');
    const message = read('message');
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
    const subject = 'Apcosys: ' + t(topic);
    const body = [
      t('Name: {name}', { name }),
      t('Work email: {email}', { email }),
      t('Company: {company}', { company: company || t('Not provided') }),
      t('Topic: {topic}', { topic: t(topic) }),
      '',
      message,
    ].join('\n');
    return { subject, body };
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (opening) return;
    const email = prepare(event.currentTarget);
    if (!email) return;
    setOpening(true);
    setStatus('');
    try {
      window.location.href =
        'mailto:' +
        supportEmail +
        '?subject=' +
        encodeURIComponent(email.subject) +
        '&body=' +
        encodeURIComponent(email.body);
    } catch {
      setStatus(true);
    }
    openingTimer.current = window.setTimeout(() => {
      openingTimer.current = null;
      setOpening(false);
    }, 700);
  }

  const privacyMarker = '__p__';
  const privacyConsent = t(
    'I agree to the processing of my data in line with the {privacyPolicy}.',
    { privacyPolicy: privacyMarker },
  );
  const [privacyBefore, privacyAfter] = privacyConsent.split(privacyMarker);
  return (
    <form id="contact-form" className="stage-contact-form" onSubmit={submit}>
      <div className="stage-form-row">
        <label>
          {t('Name')}{' '}
          <input
            name="name"
            required
            autoComplete="name"
            maxLength={100}
            value={draft.name}
            onChange={(event) => updateDraft({ name: event.target.value })}
          />
        </label>
        <label>
          {t('Work email')}{' '}
          <input
            name="email"
            required
            type="email"
            autoComplete="email"
            maxLength={200}
            value={draft.email}
            onChange={(event) => updateDraft({ email: event.target.value })}
          />
        </label>
      </div>
      <div className="stage-form-row">
        <label>
          <span className="stage-form-label">
            {t('Company')} <small>{t('(optional)')}</small>
          </span>
          <input
            name="company"
            autoComplete="organization"
            maxLength={120}
            value={draft.company}
            onChange={(event) => updateDraft({ company: event.target.value })}
          />
        </label>
        <SelectField
          name="topic"
          label={t('Topic')}
          placeholder={t('Select a topic')}
          required
          value={topic}
          options={topics.map((value) => ({ value, label: t(value) }))}
          onChange={onTopicChange}
        />
      </div>
      <label>
        <span id="contact-message-label">{t('Message')}</span>
        <textarea
          name="message"
          required
          rows={7}
          minLength={10}
          maxLength={6000}
          value={draft.message}
          onChange={(event) => updateDraft({ message: event.target.value })}
          aria-labelledby="contact-message-label"
          placeholder={t('Tell us what you would like to evaluate…')}
        />
      </label>
      <label className="stage-consent">
        <input
          type="checkbox"
          name="consent"
          required
          checked={draft.consent}
          onChange={(event) => updateDraft({ consent: event.target.checked })}
        />{' '}
        <span>
          {privacyBefore}
          <a href={siteHref('/legal/privacy-policy')}>{t('Privacy Policy')}</a>
          {privacyAfter}
        </span>
      </label>
      <div className="stage-form-actions">
        <DoubleButton
          type="submit"
          className="stage-contact-submit"
          disabled={opening}
          aria-describedby="contact-email-hint"
        >
          {t(opening ? 'Opening email…' : 'Email us')}
        </DoubleButton>
        <p id="contact-email-hint" className="stage-contact-email-hint">
          {t('Opens a draft in your email app.')}
        </p>
      </div>
      {status && (
        <MorphPanel className="stage-form-feedback">
          <Text as="p" className="stage-form-status" role="status">
            {typeof status === 'string' ? (
              status
            ) : (
              <a href={'mailto:' + supportEmail}>{t('Email {email}', { email: supportEmail })}</a>
            )}
          </Text>
        </MorphPanel>
      )}
    </form>
  );
}
