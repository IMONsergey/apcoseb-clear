import { businessPlan } from '../../content/plans';
import { Text } from '../ui/Text';
import { EditorialSection, ReadingRows, RelatedReading } from '../layout/PageSections';
import { LocaleText } from '../../i18n/LocaleText';
import { useLocale } from '../../i18n/context';

export function TeamOperations() {
  const { locale, t } = useLocale();
  const numberLocale = locale === 'en' ? 'en-US' : locale;
  const count = new Intl.NumberFormat(numberLocale);
  const compactCount = new Intl.NumberFormat(numberLocale, { notation: 'compact' });
  const users = count.format(businessPlan.users);
  return (
    <>
      <EditorialSection
        id="team-tasks"
        title="Useful at the point of investigation."
        intro="Bring an existing question to Apcosys. Use observed infrastructure to give the next review more technical context."
      >
        <ReadingRows
          items={[
            {
              title: 'An indicator from an alert.',
              text: 'Look up the host and review its services, products and versions. Give the analyst enough context to decide which part of the lead needs closer attention.',
              detail:
                'Carry forward: the host, relevant service response and the question that remains.',
            },
            {
              title: 'A newly published advisory.',
              text: 'Research the named technology and inspect potential version matches. Review the evidence before turning an association into a finding.',
              detail:
                'Carry forward: the detection, advisory applicability and checks still required.',
            },
            {
              title: 'A repeat lookup or report.',
              text: 'Use the API to bring supported search and host data into scripts, enrichment steps and internal reporting.',
              detail:
                'Carry forward: the observation context, the source and your own validation notes.',
            },
          ]}
        />
      </EditorialSection>
      <EditorialSection
        id="team-trust"
        title="Make the handoff useful."
        intro="Before a result informs a decision, another analyst should be able to see what was observed, why it matters and what has not yet been established."
      >
        <div className="team-handoff">
          <div>
            <Text as="h3">Give analysts the context they need.</Text>
            <Text as="p">
              Keep the host, port and supporting response together. Include detected products and
              versions, potential CVE associations and available observation dates.
            </Text>
            <Text as="p">
              Record your reasoning separately from the source data, so the next person can
              distinguish an observation from a validated finding.
            </Text>
          </div>
          <div className="handoff-record">
            <Text as="h3">A concise research handoff</Text>
            <dl>
              <div>
                <Text as="dt">Question</Text>
                <Text as="dd">What are we trying to establish?</Text>
              </div>
              <div>
                <Text as="dt">Evidence</Text>
                <Text as="dd">Which host, service and response support the lead?</Text>
              </div>
              <div>
                <Text as="dt">Uncertainty</Text>
                <Text as="dd">What needs independent verification?</Text>
              </div>
              <div>
                <Text as="dt">Next action</Text>
                <Text as="dd">Who reviews it, and what should they check?</Text>
              </div>
            </dl>
          </div>
        </div>
        <RelatedReading
          items={[
            {
              title: 'Understand the data you rely on.',
              text: 'Coverage, observation dates, CVE associations and the limits of internet scanning.',
              path: '/platform/data-methodology',
            },
            {
              title: 'Bring data into existing workflows.',
              text: 'A compact introduction to API requests, access levels and usage.',
              path: '/developers/api',
            },
          ]}
        />
      </EditorialSection>
      <EditorialSection
        id="team-access"
        title="Choose access for your team."
        intro={
          locale === 'en'
            ? `Business brings a larger allowance and access for up to ${users} users. Discuss data needs, invoice payment and procurement questions with the team.`
            : t(
                'Business brings a larger allowance and access for up to {users} users. Discuss data needs, invoice payment and procurement questions with the team.',
                { users },
              )
        }
      >
        <div className="business-allowance">
          <div>
            <strong>{users}</strong>
            <span>
              <LocaleText>{t('Users on one subscription')}</LocaleText>
            </span>
          </div>
          <div>
            <strong>{compactCount.format(businessPlan.credits)}</strong>
            <span>
              <LocaleText>{t('Included credits')}</LocaleText>
            </span>
          </div>
          <div>
            <strong>
              {count.format(businessPlan.apiRequestsPerSecond)}
              <span>/s</span>
            </strong>
            <span>
              <LocaleText>{t('API request rate')}</LocaleText>
            </span>
          </div>
        </div>
        <Text as="p" className="editorial-note">
          Business plan figures shown for the client preview. Final access and commercial terms are
          confirmed in the product.
        </Text>
      </EditorialSection>
    </>
  );
}
