export const queryBuilder = (query) => {
  if (query.name) {
    return {
      ...query,
      name: { $regex: query.name, $options: "$i" },
    };
  }
  return query;
};
