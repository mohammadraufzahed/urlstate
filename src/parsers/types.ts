import type { QueryStateOptions } from '@/types'

/**
 * Parser contracts. A parser converts between raw query values and typed state.
 */
export type ParserInput = string | readonly string[]

export interface ParserDefinition<T, I extends ParserInput = string> {
  parse(value: I): T | null
  serialize(value: T): I
  eq?(a: T, b: T): boolean
}

export interface ArrayItems {
  readonly parser: Parser<unknown, string>
  readonly separator: string
}

export interface Parser<T, I extends ParserInput = string> {
  readonly type: I extends string ? 'single' : 'multi'
  readonly defaultValue: T | undefined
  readonly options: QueryStateOptions
  readonly items?: ArrayItems
  parse(value: I): T | null
  serialize(value: T): I
  eq(a: T, b: T): boolean
  parseServerSide(value: string | readonly string[] | undefined): T | null
  withDefault(defaultValue: T): ParserWithDefault<T, I>
  withOptions(options: QueryStateOptions): Parser<T, I>
}

export interface ParserWithDefault<T, I extends ParserInput = string> extends Parser<T, I> {
  readonly defaultValue: T
  parseServerSide(value: string | readonly string[] | undefined): T
  withOptions(options: QueryStateOptions): ParserWithDefault<T, I>
}

export type SingleParser<T> = Parser<T, string>
export type MultiParser<T> = Parser<T, readonly string[]>
export type AnyParser = Parser<unknown, string> | Parser<unknown, readonly string[]>
export type ParserMap = Record<string, AnyParser>

/** Infers the state type of a parser (or of an object of parsers). */
export type inferParserType<P> = P extends Parser<infer T, infer _I>
  ? undefined extends P['defaultValue']
    ? T | null
    : T
  : P extends ParserMap
    ? { [K in keyof P]: inferParserType<P[K]> }
    : never

export type Values<S extends ParserMap> = { [K in keyof S]: inferParserType<S[K]> }
