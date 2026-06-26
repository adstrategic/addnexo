export type TypedResponse<T> = Omit<Response, "json"> & {
  json: (body: T) => void;
};
