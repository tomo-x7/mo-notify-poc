import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { LiffProvider } from "./context/liff.tsx";
import { Line } from "./Line.tsx";

function Routes() {
	if (window.location.pathname === "/line/") {
		return (
			<LiffProvider>
				<Line />
			</LiffProvider>
		);
	}
	return <App />;
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Routes />
	</StrictMode>,
);
