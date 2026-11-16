import { createLoader, type LoaderInput, type LoaderOptions } from '@/server/loader'
import type { ParserMap, Values } from '@/parsers/types'

/** The Standard Schema v1 interface (https://standardschema.dev), inlined to avoid a runtime dependency. */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': {
    readonly version: 1
    readonly vendor: string
    readonly validate: (value: unknown) => StandardSchemaV1.Result<Output> | Promise<StandardSchemaV1.Result<Output>>
    readonly types?: { readonly input: Input; readonly output: Output } | undefined
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace StandardSchemaV1 {
  type Result<Output> = { readonly value: Output; readonly issues?: undefined } | { readonly issues: readonly Issue[] }
  interface Issue {
    readonly message: string
    readonly path?: readonly (PropertyKey | { readonly key: PropertyKey })[] | undefined
  }
}

export interface StandardSchemaOptions<S> extends LoaderOptions<S> {
  /** Only return keys present in the input. */
  readonly partialOutput?: boolean
}

/**
 * Exposes a set of parsers as a Standard Schema so frameworks (tRPC, Hono, form libraries…) can validate search params.
 */
export function createStandardSchemaV1<S extends ParserMap>(parsers: S, { urlKeys, partialOutput = false }: StandardSchemaOptions<S> = {}): StandardSchemaV1<LoaderInput, Values<S>> {
  const load = createLoader(parsers, { urlKeys })
  return {
    '~standard': {
      version: 1,
      vendor: 'urlstate',
      validate(input) {
        try {
          const values = load(input as LoaderInput, { strict: true })
          if (!partialOutput) return { value: values }
          const present = createLoader(parsers, { urlKeys })(input as LoaderInput)
          const output: Record<string, unknown> = {}
          for (const key of Object.keys(values)) {
            if (present[key] !== null && present[key] !== undefined) output[key] = values[key]
          }
          return { value: output as Values<S> }
        } catch (error) {
          return { issues: [{ message: error instanceof Error ? error.message : String(error) }] }
        }
      }
    }
  }
}
