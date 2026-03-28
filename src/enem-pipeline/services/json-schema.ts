import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });

export function validateWithSchema<T>(
  schema: Record<string, unknown>,
  payload: unknown,
  label: string,
): T {
  const validate = ajv.compile(schema);
  const valid = validate(payload);

  if (!valid) {
    const details = (validate.errors ?? [])
      .map((error) => `${error.instancePath || "/"} ${error.message ?? "erro"}`)
      .join("; ");

    throw new Error(`Schema inválido para ${label}: ${details}`);
  }

  return payload as T;
}
