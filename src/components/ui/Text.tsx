import {
  Children,
  Fragment,
  cloneElement,
  createElement,
  isValidElement,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { typograph } from '../../i18n/typography';

type TextElement =
  | 'span'
  | 'p'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'li'
  | 'dt'
  | 'dd'
  | 'figcaption'
  | 'blockquote'
  | 'caption';
const verbatim = new Set([
  'code',
  'pre',
  'kbd',
  'samp',
  'textarea',
  'input',
  'svg',
  'script',
  'style',
]);

/** Transform authored React text, never DOM nodes, props, code examples or form values. */
function formatChildren(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string') return typograph(child);
    if (!isValidElement<{ children?: ReactNode; 'data-typography'?: string }>(child)) return child;
    if (child.props['data-typography'] === 'verbatim') return child;
    if (child.type !== Fragment && (typeof child.type !== 'string' || verbatim.has(child.type)))
      return child;
    return cloneElement(child, {}, formatChildren(child.props.children));
  });
}

/** Ordinary text in, semantic HTML out. Existing CSS selectors keep the same DOM. */
export function Text({
  as: Tag = 'span',
  children,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: TextElement;
  children?: ReactNode;
  'data-typography'?: 'verbatim';
}) {
  return createElement(
    Tag,
    props,
    props['data-typography'] === 'verbatim' ? children : formatChildren(children),
  );
}
