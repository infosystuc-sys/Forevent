export type ArrayElement<ArrayType extends unknown[] | null> =
  ArrayType extends (infer ElementType)[] ? ElementType : never;
