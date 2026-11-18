import { createSpinner } from "./spinner.js";

/** Keep progress visible for a whole async phase, including errors/cancellation. */
export async function withSpinner<T>(
  text: string,
  action: () => Promise<T>,
): Promise<T> {
  const spinner = createSpinner(text);
  spinner.start();
  try {
    return await action();
  } finally {
    spinner.stop();
  }
}
