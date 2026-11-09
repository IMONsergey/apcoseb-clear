import type { ApiOperation, PublicApiDocument, PublicApiOperationId } from './public-api-document';

/** Presentation slots, not a replacement for the full downloadable OpenAPI contract. */
export type ApiOperationView = Omit<ApiOperation, 'title' | 'methodName' | 'notes'>;

export type CompiledPublicApiDocument = Omit<
  PublicApiDocument,
  'endpoints' | 'byId' | 'title' | 'description' | 'source' | 'credits'
> & {
  source: Pick<PublicApiDocument['source'], 'name'>;
  credits: Omit<PublicApiDocument['credits'], 'defaultAnalyticsWeight'>;
  endpoints: ApiOperationView[];
};

export type PublicApiDocumentView = CompiledPublicApiDocument & {
  byId: Record<PublicApiOperationId, ApiOperationView>;
};

/** Trusted compiler output only. Untrusted remote JSON must first pass the full adapter. */
export function hydratePublicApiDocument(
  document: CompiledPublicApiDocument,
): PublicApiDocumentView {
  return {
    ...document,
    byId: Object.fromEntries(
      document.endpoints.map((operation) => [operation.operationId, operation]),
    ) as Record<PublicApiOperationId, ApiOperationView>,
  };
}
