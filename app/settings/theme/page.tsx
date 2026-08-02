export const dynamic = 'force-dynamic';

import React from "react";
import { StoreProvider } from "@/lib/store";
import { ThemeSelector } from "@/components/theme/ThemeSelector";
import Shell from "@/components/Shell";

export default function ThemeSettingsPage() {
  return (
    <StoreProvider>
      <Shell>
        <div className="py-4">
          <ThemeSelector />
        </div>
      </Shell>
    </StoreProvider>
  );
}
