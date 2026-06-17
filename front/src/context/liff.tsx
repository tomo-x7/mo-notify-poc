import type { liff } from "@line/liff";
import { createContext, Suspense, use, useContext } from "react";

const LiffContext = createContext<typeof liff>(null!);
export function useLiff() {
	return useContext(LiffContext);
}

async function loadLiff() {
	try {
		console.log("Loading LIFF...");
		const liff = (await import("@line/liff")).liff;
		console.log("LIFF loaded:", liff);
		await liff.init({ liffId: "2010362654-ejSkHELZ" });
		console.log("LIFF initialized");
		return liff;
	} catch (e) {
		console.error("Failed to load LIFF:", e);
		throw e;
	}
}
const loadLiffPromise = loadLiff();

export function LiffProvider({ children }: { children: React.ReactNode }) {
	console.log("Rendering LiffProvider");
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<LiffProviderInner>{children}</LiffProviderInner>
		</Suspense>
	);
}
function LiffProviderInner({ children }: { children: React.ReactNode }) {
	const liff = use(loadLiffPromise);
	return <LiffContext.Provider value={liff}>{children}</LiffContext.Provider>;
}
