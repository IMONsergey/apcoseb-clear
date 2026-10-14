import { primaryContact, linkTo } from '../../components/layout/pageLinks';
import { PageFrame } from '../../components/layout/PageFrame';
import { TeamWorkflow } from '../../components/product/TeamSignal';
import { TeamOperations } from '../../components/product/TeamOperations';

export default function TeamPage() {
  return (
    <PageFrame
      artwork="teams"
      variant="technical"
      title="Internet intelligence for your security team."
      description="Give analysts a common source of technical evidence about internet-facing infrastructure — from the first indicator to the context behind it."
      sections={[
        { label: 'Analyst workflow', id: 'team-workflow' },
        { label: 'Research tasks', id: 'team-tasks' },
        { label: 'Data & handoffs', id: 'team-trust' },
        { label: 'Business access', id: 'team-access' },
      ]}
      closing={{
        title: 'Evaluate it with your own research question.',
        description:
          'Tell us about the infrastructure you investigate, your existing tools and the access your team needs.',
      }}
      links={[primaryContact, linkTo('View Business Plan', '/pricing#plan-business', true)]}
    >
      <TeamWorkflow />
      <TeamOperations />
    </PageFrame>
  );
}
