import { z } from "zod";

type IfThenElse<If, Then, Else> = If extends true ? Then : Else;

/**
 * Check if T ⊆ U
 */
type Has<T, U> = IfThenElse<Is<T, Exclude<T, U>>, false, true>;

/**
 * ∀S ∈ T, ∃V ∈ U s.t. S = V, and ∀V ∈ U, ∃S ∈ T s.t. V = S
 *
 * **Example**:
 * ```ts
 * type A = { a: string } & { b: number };
 * type B = { a: string; b: number };
 * type C = "literal";
 *
 * Equal<A, B>; // false
 * Equal<A, A>; // true
 * Equal<string, C>; // false
 * ```
 */
type Equal<T, U> =
  (<S>() => S extends T ? 1 : 2) extends <S>() => S extends U ? 1 : 2 ? true
  : false;

type Expect<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;

// try to learn from this
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I
  : never;
type LastOf<T> =
  UnionToIntersection<T extends any ? () => T : never> extends () => infer R ? R
  : never;

type Push<T extends any[], V> = [...T, V];

type TuplifyUnion<
  T,
  L = LastOf<T>,
  N = [T] extends [never] ? true : false,
> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>;

type IsEnum<T extends [string, ...string[]]> = T;

// cannot know that is T is a union of literals
type PassT<T> = IsEnum<TuplifyUnion<T>>; // nothing to somthing else nothing (ie [])
type PassU<T> = IsEnum<UnionToTuple<T>>; //  something until nothing else never
//

type ToFuncs<T> =
  (T extends never ? never : (arg: T) => never) extends (arg: infer U) => void ?
    U
  : never;

type ToMultiSubArray<
  T,
  T1 = ToFuncs<T extends never ? never : (t: T) => T>,
> = T1 extends (_: never) => infer W ? [W, ToMultiSubArray<Exclude<T, W>>]
: never;

type FlattenDeepArray<T> =
  T extends [infer First, infer Rest] ?
    Rest extends [infer Sec, never] ? [First, Sec]
    : Rest extends any[] ? [First, ...FlattenDeepArray<Rest>]
    : never
  : never;

type ZodLiteralFlattenDeepArray<T extends any[]> =
  T extends [infer First, infer Rest] ?
    Rest extends [infer Sec, never] ? [z.ZodLiteral<First>, z.ZodLiteral<Sec>]
    : Rest extends any[] ? [z.ZodLiteral<First>, ...FlattenDeepArray<Rest>]
    : never
  : never;

type U2T<T, U> =
  T extends FlattenDeepArray<ToMultiSubArray<U>>[number] ? true : false;
type CanUnionToTuple<T> = U2T<T, T>;
type UnionToTuple<T> = FlattenDeepArray<ToMultiSubArray<T>>;
type NumberUnionToTuple<T> = ZodLiteralFlattenDeepArray<ToMultiSubArray<T>>;

export type ZodMap<T> =
  [T] extends [never] ? never
  : Has<T, null> extends true ?
    Is<T, null> extends true ?
      never
    : z.ZodNullable<ToZodNoNull<Remove<T, null>>>
  : ToZodNoNull<T>;

type ToZodNoNull<T> =
  IsAny<T> extends true ? z.ZodTypeAny
  : Is<T, boolean> extends true ? z.ZodBoolean
  : IsUnion<T> extends true ? ChooseUnion<T>
  : IsLiteral<T> extends true ? z.ZodLiteral<T>
  : Is<T, string> extends true ?
    z.ZodString | z.ZodEffects<z.ZodTypeAny, string, string>
  : Is<T, number> extends true ? z.ZodNumber
  : z.ZodTypeAny;

type ChooseUnion<T> =
  ExpandsTo<T, string> extends true ? z.ZodEnum<UnionToTuple<T>>
  : ExpandsTo<T, number> extends true ? z.ZodUnion<NumberUnionToTuple<T>>
  : never;

type ExpandsTo<T, U> = T extends U ? true : false;

type zod_test_2 = Expect<Equal<ZodMap<null>, never>>;
type zod_test_3 = Expect<
  Equal<
    ZodMap<string>,
    z.ZodString | z.ZodEffects<z.ZodTypeAny, string, string>
  >
>;
type zod_test_4 = Expect<Equal<ZodMap<"string">, z.ZodLiteral<"string">>>;
type zod_test_5 = Expect<Equal<ZodMap<number>, z.ZodNumber>>;
type zod_test_6 = Expect<Equal<ZodMap<1>, z.ZodLiteral<1>>>;
type zod_test_8 = Expect<Equal<ZodMap<any>, z.ZodTypeAny>>;
type zod_test_9 = Expect<
  Equal<
    ZodMap<string | null>,
    z.ZodNullable<z.ZodString | z.ZodEffects<z.ZodTypeAny, string, string>>
  >
>;
type zod_test_10 = Expect<Equal<ZodMap<"a" | "b">, z.ZodEnum<["b", "a"]>>>;
type zod_test_11 = Expect<
  Equal<ZodMap<"a" | "b" | null>, z.ZodNullable<z.ZodEnum<["b", "a"]>>>
>;
type zod_test_12 = Expect<Equal<ZodMap<never>, never>>;
type zod_test_13 = Expect<Equal<ZodMap<unknown>, z.ZodTypeAny>>;
type zod_test_14 = Expect<Equal<ZodMap<undefined>, z.ZodTypeAny>>;
type zod_test_15 = Expect<Equal<ZodMap<unknown | undefined>, z.ZodTypeAny>>;
type zod_test_16 = Expect<Equal<ZodMap<"THIS">, z.ZodLiteral<"THIS">>>;
type zod_test_17 = Expect<Equal<ZodMap<true>, z.ZodLiteral<true>>>;
type zod_test_18 = Expect<Equal<ZodMap<false>, z.ZodLiteral<false>>>;
type zod_test_19 = Expect<Equal<ZodMap<true | false>, z.ZodBoolean>>;
type zod_test_20 = Expect<
  Equal<ZodMap<1 | 2>, z.ZodUnion<[z.ZodLiteral<2>, z.ZodLiteral<1>]>>
>;
type zod_test_21 = Expect<
  Equal<
    ZodMap<1 | 2 | null>,
    z.ZodNullable<z.ZodUnion<[z.ZodLiteral<2>, z.ZodLiteral<1>]>>
  >
>;
type zod_test_22 = Expect<Equal<ZodMap<1 | 2 | "a">, never>>;
type zod_test_23 = Expect<
  Equal<ZodMap<1 | 2 | "a" | null>, z.ZodNullable<never>> // FIX: should just be never
>;
type zod_test_24 = Expect<Equal<ZodMap<string[]>, z.ZodTypeAny>>; // maybe add to accept arrays

type test = ZodMap<string | null>;

/**
 * Check if T is exactly U
 */
type Is<T, U> =
  [T] extends [U] ?
    [U] extends [T] ?
      true
    : false
  : false;

type is_test_1 = Expect<Equal<Is<string, string>, true>>;
type is_test_2 = Expect<Equal<Is<string, number>, false>>;
type is_test_3 = Expect<Equal<Is<number, number>, true>>;
type is_test_4 = Expect<Equal<Is<boolean, boolean>, true>>;
type is_test_5 = Expect<Equal<Is<boolean, Boolean>, false>>;
type is_test_27 = Expect<Equal<Is<Boolean, boolean>, false>>;
type is_test_28 = Expect<Equal<Is<Boolean, Boolean>, true>>;
type is_test_6 = Expect<Equal<Is<{}, {}>, true>>;
type is_test_7 = Expect<Equal<Is<{}, object>, true>>; // is this supposed to be true?
type is_test_8 = Expect<Equal<Is<null, null>, true>>;
type is_test_9 = Expect<Equal<Is<null, undefined>, false>>;
type is_test_10 = Expect<Equal<Is<undefined, undefined>, true>>;
type is_test_11 = Expect<Equal<Is<never, never>, true>>;
type is_test_12 = Expect<Equal<Is<any, any>, true>>;
type is_test_13 = Expect<Equal<Is<unknown, unknown>, true>>;
type is_test_14 = Expect<Equal<Is<unknown, any>, true>>;
type is_test_15 = Expect<Equal<Is<any, unknown>, true>>;
type is_test_16 = Expect<Equal<Is<1, number>, false>>;
type is_test_26 = Expect<Equal<Is<number, 1>, false>>;
type is_test_17 = Expect<Equal<Is<1, 1>, true>>;
type is_test_18 = Expect<Equal<Is<"a", string>, false>>;
type is_test_19 = Expect<Equal<Is<"a", "a">, true>>;
type is_test_20 = Expect<Equal<Is<[number, number], [number, number]>, true>>;
type is_test_21 = Expect<Equal<Is<[number, number], [number]>, false>>;
type is_test_22 = Expect<Equal<Is<[number, string], [number, number]>, false>>;
type is_test_23 = Expect<Equal<Is<string | number, string | number>, true>>;
type is_test_24 = Expect<Equal<Is<string | number, number | string>, true>>;
type is_test_25 = Expect<Equal<Is<string & number, string & number>, true>>;
type is_test_29 = Expect<Equal<Is<string, string | number>, false>>;

/**
 * Check if T is a literal type
 */
type IsLiteral<T> =
  [T] extends [never] ? false
  : boolean extends T ? false
  : T extends any[] ? false
  : T extends string | number | boolean | bigint | symbol ?
    string extends T ? false
    : number extends T ? false
    : bigint extends T ? false
    : symbol extends T ? false
    : true
  : false;

type literal_test_1 = Expect<Equal<IsLiteral<"hello">, true>>;
type literal_test_2 = Expect<Equal<IsLiteral<string>, false>>;
type literal_test_3 = Expect<Equal<IsLiteral<42>, true>>;
type literal_test_4 = Expect<Equal<IsLiteral<number>, false>>;
type literal_test_5 = Expect<Equal<IsLiteral<true>, true>>;
type literal_test_6 = Expect<Equal<IsLiteral<boolean>, false>>;
type literal_test_7 = Expect<Equal<IsLiteral<null>, false>>; //  are they tho??
type literal_test_8 = Expect<Equal<IsLiteral<undefined>, false>>; //  are they tho??
type literal_test_9 = Expect<Equal<IsLiteral<[]>, false>>;
type literal_test_10 = Expect<Equal<IsLiteral<Array<string>>, false>>;
type literal_test_11 = Expect<Equal<IsLiteral<{}>, false>>;
type literal_test_12 = Expect<Equal<IsLiteral<{ a: 1 }>, false>>;
type literal_test_13 = Expect<Equal<IsLiteral<symbol>, false>>;
type literal_test_14 = Expect<Equal<IsLiteral<"a" | 1>, true>>;
type literal_test_15 = Expect<Equal<IsLiteral<bigint>, false>>;
type literal_test_16 = Expect<Equal<IsLiteral<1n>, true>>;
type literal_test_18 = Expect<Equal<IsLiteral<never>, false>>;
type literal_test_17 = Expect<
  Equal<IsLiteral<"hello" | "YES" | number>, true | false> // number messes it up
>;

/**
 * Check if T is one subtype of U
 */
type One<T, U> =
  [T] extends [never] ? false
  : IsUnion<U> extends true ?
    IsUnion<T> extends false ?
      T extends U ?
        true
      : false
    : false
  : false;

type one_test_1 = Expect<Equal<One<string, string | number>, true>>;
type one_test_2 = Expect<Equal<One<number, string | number>, true>>;
type one_test_3 = Expect<Equal<One<boolean, string | number>, false>>;
type one_test_4 = Expect<Equal<One<string | number, string | number>, false>>;
type one_test_5 = Expect<Equal<One<string, string>, false>>;
type one_test_6 = Expect<Equal<One<null, string | null>, true>>;
type one_test_7 = Expect<Equal<One<undefined, string | undefined>, true>>;
type one_test_8 = Expect<Equal<One<{}, string | {}>, false>>; // this is complex, I dont have an opinion on what it should be
type one_test_9 = Expect<Equal<One<any, string | number>, true | false>>; // any can be anything so idk
type one_test_10 = Expect<Equal<One<never, string | number>, false>>;
type one_test_11 = Expect<Equal<One<unknown, string | unknown>, false>>;
type one_test_12 = Expect<Equal<One<"a", "a" | "b">, true>>;
type one_test_13 = Expect<Equal<One<"a" | "b", "a" | "b" | "c">, false>>;
type one_test_19 = Expect<Equal<One<"a", string>, false>>;
type one_test_14 = Expect<Equal<One<1, 1 | 2>, true>>;
type one_test_15 = Expect<Equal<One<1 | 2, 1 | 2 | 3>, false>>;
type one_test_16 = Expect<Equal<One<true, boolean | string>, true>>;
type one_test_17 = Expect<Equal<One<false, boolean | string>, true>>;
type one_test_18 = Expect<Equal<One<boolean, boolean | string>, true>>;
type one_test_20 = Expect<Equal<One<true, true | false>, false>>;

/**
 * Check if T is a union of types
 *
 * **Special case**: `true | false` is just `boolean`, so it is **not** a recognized union
 */
type IsUnion<T> =
  [T] extends [boolean] ? false
  : (T extends any ? (x: T) => 0 : never) extends (x: infer U) => 0 ?
    T extends U ?
      false
    : true
  : never;

type union_test_1 = Expect<Equal<IsUnion<number | string>, true>>;
type union_test_2 = Expect<Equal<IsUnion<string>, false>>;
type union_test_3 = Expect<Equal<IsUnion<number>, false>>;
type union_test_4 = Expect<Equal<IsUnion<boolean>, false>>;
type union_test_5 = Expect<Equal<IsUnion<null>, false>>;
type union_test_6 = Expect<Equal<IsUnion<unknown>, false>>;
type union_test_7 = Expect<Equal<IsUnion<any>, false>>;
type union_test_8 = Expect<Equal<IsUnion<"str">, false>>;
type union_test_9 = Expect<Equal<IsUnion<1>, false>>;
type union_test_10 = Expect<Equal<IsUnion<[any]>, false>>;
type union_test_11 = Expect<Equal<IsUnion<number | null>, true>>;
type union_test_12 = Expect<Equal<IsUnion<string | null>, true>>;
type union_test_13 = Expect<Equal<IsUnion<boolean | null>, true>>;
type union_test_14 = Expect<Equal<IsUnion<"a" | "b">, true>>;
type union_test_15 = Expect<Equal<IsUnion<false>, false>>;
type union_test_16 = Expect<Equal<IsUnion<true>, false>>;
type union_test_17 = Expect<Equal<IsUnion<true | false>, false>>; // this is just boolean
type union_test_18 = Expect<Equal<IsUnion<true | never>, false>>;
type union_test_19 = Expect<Equal<IsUnion<number & string>, false>>;
type union_test_20 = Expect<Equal<IsUnion<[number, string]>, false>>;
type union_test_21 = Expect<Equal<IsUnion<string | string[]>, true>>;

/**
 * T = T - U = { x: x ∈ T and x ∉ U }
 *
 * Different from Exclude<T, U>: Primitive cannot remove literal types
 */
type Remove<T, U> =
  IsLiteral<T> extends true ?
    T extends U ?
      U extends T ?
        never
      : T
    : T
  : T extends U ? never
  : T;

type remove_test_1 = Expect<Equal<Remove<string, string>, never>>;
type remove_test_2 = Expect<Equal<Remove<string, number>, string>>;
type remove_test_3 = Expect<Equal<Remove<string | number, number>, string>>;
type remove_test_4 = Expect<Equal<Remove<string | number, string>, number>>;
type remove_test_5 = Expect<
  Equal<Remove<string | number, string | number>, never>
>;
type remove_test_6 = Expect<
  Equal<Remove<string | number, boolean>, string | number>
>;
type remove_test_7 = Expect<
  Equal<Remove<string | number, boolean | string>, number>
>;
type remove_test_8 = Expect<Equal<Remove<"const", "s">, "const">>;
type remove_test_9 = Expect<Equal<Remove<"const", "const">, never>>;
type remove_test_10 = Expect<Equal<Remove<"const", string>, "const">>;
type remove_test_25 = Expect<Equal<Remove<string, "const">, string>>;
type remove_test_11 = Expect<Equal<Remove<1, 1>, never>>;
type remove_test_12 = Expect<Equal<Remove<1, 2>, 1>>;
type remove_test_13 = Remove<string | number, string | number[]>;
type remove_test_14 = Expect<Equal<Remove<1 | 2, 1 | 2 | 3>, never>>;
type remove_test_15 = Expect<Equal<Remove<1 | 2, 1 | 2>, never>>;
type remove_test_16 = Expect<Equal<Remove<1 | 2, 1>, 2>>;
type remove_test_17 = Expect<Equal<Remove<1 | 2, 2>, 1>>;
type remove_test_18 = Expect<Equal<Remove<string | 5, 5>, string>>;
type remove_test_19 = Expect<Equal<Remove<string | 5, string>, 5>>;
type remove_test_20 = Expect<Equal<Remove<string | 5, boolean>, string | 5>>;
type remove_test_21 = Expect<
  Equal<Remove<string | 5, 47 | "what">, string | 5>
>;
type remove_test_22 = Expect<Equal<Remove<string | 5, "what">, string | 5>>;
type remove_test_23 = Expect<Equal<Remove<string | 5, never>, string | 5>>;
type remove_test_24 = Expect<Equal<Remove<string | 5, any>, never>>;

/**
 * T = T & U
 *
 * Equivalent to Extract<T, U>
 */
type Filter<T, U> = T extends U ? T : never;

type filter_test_1 = Expect<Equal<Filter<string, string>, string>>;
type filter_test_2 = Expect<Equal<Filter<string, number>, never>>;
type filter_test_3 = Expect<Equal<Filter<string | number, number>, number>>;
type filter_test_4 = Expect<Equal<Filter<string | number, string>, string>>;
type filter_test_5 = Expect<
  Equal<Filter<string | number, string | number>, string | number>
>;
type filter_test_6 = Expect<Equal<Filter<string | number, boolean>, never>>;
type filter_test_7 = Expect<
  Equal<Filter<string | number, boolean | string>, string>
>;
type filter_test_8 = Expect<Equal<Filter<"const", "s">, never>>;
type filter_test_9 = Expect<Equal<Filter<"const", "const">, "const">>;
type filter_test_24 = Expect<Equal<Filter<string, "const">, never>>;
type filter_test_10 = Expect<Equal<Filter<"const", string>, "const">>;
type filter_test_11 = Expect<Equal<Filter<1, 1>, 1>>;
type filter_test_12 = Expect<Equal<Filter<1, 2>, never>>;
type filter_test_13 = Expect<Equal<Filter<1 | 2, 1 | 2 | 3>, 1 | 2>>;
type filter_test_14 = Expect<Equal<Filter<1 | 2, 1 | 2>, 1 | 2>>;
type filter_test_15 = Expect<Equal<Filter<1 | 2, 1>, 1>>;
type filter_test_16 = Expect<Equal<Filter<1 | 2, 2>, 2>>;
type filter_test_17 = Expect<Equal<Filter<string | 5, 5>, 5>>;
type filter_test_18 = Expect<Equal<Filter<string | 5, string>, string>>;
type filter_test_19 = Expect<Equal<Filter<string | 5, boolean>, never>>;
type filter_test_20 = Expect<Equal<Filter<string | 5, 47 | "what">, never>>;
type filter_test_21 = Expect<Equal<Filter<string | 5, "what">, never>>;
type filter_test_22 = Expect<Equal<Filter<string | 5, never>, never>>;
type filter_test_23 = Expect<Equal<Filter<string | 5, any>, string | 5>>;
