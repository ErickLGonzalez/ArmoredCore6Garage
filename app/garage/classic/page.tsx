import { permanentRedirect } from "next/navigation";

export const metadata = {
  title: "GARAGE",
};

/** Classic Vite UI is retired here; the React garage matches its chrome. */
export default function GarageClassicPage() {
  permanentRedirect("/garage");
}
