import { Static, TSchema, TUnknown } from "@sinclair/typebox";
import { Value } from '@sinclair/typebox/value'

export class ResponseValidationError extends Error {}

export class TypeBoxResponse extends Response {
  constructor(response: Response) {
    super(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  json(): Promise<unknown>;
  json<T extends TSchema>(schema: T): Promise<Static<T>>;
  async json<T extends TSchema = TUnknown>(
      schema?: T
  ): Promise<Static<T>> {
    if (!schema) return super.json();
    const body = await super.json();
    const result = Value.Check(schema, body);
    if (result) return body;

    const errors = Value.Errors(schema, body);
    const firstError = errors.First();

    throw new ResponseValidationError(
      `ResponseValidationError ${firstError?.message}. path: ${firstError?.path} value: ${firstError?.value}`
    );
  }
}

async function typeboxFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<TypeBoxResponse> {
  const response = await fetch(input, init);
  return new TypeBoxResponse(response);
}

export { typeboxFetch as fetch, TypeBoxResponse as Response };
