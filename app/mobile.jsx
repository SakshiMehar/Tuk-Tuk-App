import { Redirect } from "expo-router";

/** Legacy route — phone login lives at /enter-mobile */
export default function Mobile() {
  return <Redirect href="/enter-mobile" />;
}
