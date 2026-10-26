import { Text } from '../../components/ui/Text';
import { topics } from './contactTopics';
import ContactForm from './ContactForm';
import { useState } from 'react';
import { supportEmail } from '../../config/site';
import { PageFrame } from '../../components/layout/PageFrame';
import { EditorialSection } from '../../components/layout/PageSections';
import { useLocale } from '../../i18n/context';
import { readContactDraft } from './contactDraft';

export default function ContactPage() {
  const { t } = useLocale();
  const [topic, setTopic] = useState(() => {
    const initial = new URLSearchParams(window.location.search).get('topic');
    return topics.find((item) => item === initial) ?? readContactDraft().topic;
  });
  const chooseTopic = (value: string) => {
    setTopic(value);
    const form = document.getElementById('contact-form');
    form?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
      block: 'start',
    });
    form?.querySelector<HTMLInputElement>('[name="name"]')?.focus({ preventScroll: true });
  };
  return (
    <PageFrame
      artwork="contact"
      variant="editorial"
      title="Talk to the Apcosys team."
      description="Questions about data, API access, team plans or procurement? Choose a topic and tell us what you need."
      heroLinks={[
        { label: 'Start a conversation', href: '#contact-form' },
        { label: 'Email us', href: 'mailto:' + supportEmail, secondary: true },
      ]}
      sections={[
        { label: 'Choose a topic', id: 'contact-topics' },
        { label: 'Write your message', id: 'contact-form' },
      ]}
    >
      <EditorialSection
        id="contact-topics"
        title="What would you like to discuss?"
        intro="Choose a topic to prepare the form. A little context helps the team understand your question."
      >
        <div className="contact-topics">
          {[
            [
              'Data & coverage',
              'Data & coverage',
              'Tell us which data, observations or coverage you want to understand.',
            ],
            [
              'API access',
              'API & integration',
              'Describe the workflow, request types and volume you are planning.',
            ],
            [
              'Team & Business plan',
              'Teams & procurement',
              'Share your team size, research needs and any invoice requirements.',
            ],
          ].map(([value, title, text]) => (
            <button
              key={value}
              type="button"
              aria-pressed={topic === value}
              onClick={() => chooseTopic(value!)}
            >
              <Text as="h3">{title}</Text>
              <Text as="p">{text}</Text>
              <span>{t(topic === value ? 'Selected' : 'Choose topic')}</span>
            </button>
          ))}
        </div>
      </EditorialSection>
      <section className="stage-contact section-space">
        <div className="container stage-contact-layout">
          <div className="stage-contact-aside">
            <Text as="h2">Start a conversation.</Text>
            <Text as="p">
              Tell us what you are trying to do, what you have already explored and which question
              you need answered.
            </Text>
            <div className="contact-direct">
              <Text as="h3">Prefer a direct email?</Text>
              <a href={'mailto:' + supportEmail}>{supportEmail}</a>
            </div>
          </div>
          <ContactForm topic={topic} onTopicChange={setTopic} />
        </div>
      </section>
    </PageFrame>
  );
}
