import type { PublicApiDocument } from './public-api-document';
import type { CompiledPublicApiDocument } from './public-api-view';

function omit<Value extends object, Key extends keyof Value>(
  value: Value,
  ...keys: Key[]
): Omit<Value, Key> {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key as Key)),
  ) as Omit<Value, Key>;
}

/**
 * Called only after full validation, at build time or in the optional remote adapter chunk.
 * Keep every rendered value; the unchanged downloadable OpenAPI remains the full contract.
 */
export function compilePublicApiDocument(document: PublicApiDocument): CompiledPublicApiDocument {
  const { endpoints, byId, ...metadata } = omit(document, 'title', 'description');
  return {
    ...metadata,
    source: { name: document.source.name },
    credits: omit(document.credits, 'defaultAnalyticsWeight'),
    endpoints: endpoints.map(({ operationId }) => {
      const operation = byId[operationId];
      return {
        operationId,
        sectionId: operation.sectionId,
        method: operation.method,
        path: operation.path,
        description: operation.description,
        plans: operation.plans,
        creditWeight: operation.creditWeight,
        requestExample: operation.requestExample,
        requestFields: ['search-hosts', 'search-buckets'].includes(operationId)
          ? operation.requestFields
          : [],
        responseFields: ['search-hosts', 'get-host', 'search-buckets'].includes(operationId)
          ? operation.responseFields
          : [],
        responseExample: ['search-hosts', 'host-analytics'].includes(operationId)
          ? operation.responseExample
          : '',
      };
    }),
  };
}
