import { siteHref } from '../app/paths';
import { PageFrame, PageAction } from '../components/layout/PageFrame';

export default function NotFoundPage() {
  return (
    <PageFrame
      title="This page is not here."
      description="The link may have moved. Continue exploring the Apcosys website instead."
      links={[{ label: 'Back to homepage', href: siteHref('/') }]}
    >
      <div className="container stage-not-found">
        <PageAction links={[{ label: 'Browse Apcosys', href: siteHref('/') }]} />
      </div>
    </PageFrame>
  );
}
