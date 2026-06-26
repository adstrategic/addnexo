"use client";

/**
 * Scrolls the first form error field into view.
 * Use after validation fails to improve UX.
 */
export function useFormScroll() {
  const scrollToField = (fieldName: string) => {
    const el = document.querySelector(
      `[name="${fieldName}"], #${fieldName}, [id="${fieldName}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return { scrollToField };
}
