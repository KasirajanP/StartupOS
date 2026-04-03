export function getErrorMessage(error, fallback = "Something went wrong.") {
  const detail = error?.response?.data?.detail;
  if (detail) {
    return detail;
  }

  const data = error?.response?.data;
  if (data && typeof data === "object") {
    const flattened = Object.values(data)
      .flat()
      .filter(Boolean)
      .join(" ");
    if (flattened) {
      return flattened;
    }
  }

  return error?.message || fallback;
}
