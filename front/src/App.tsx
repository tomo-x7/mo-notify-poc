import { useState } from "react";

export function App() {
	const [id, setId] = useState(new URL(location.href).searchParams.get("id") ?? "");
	console.log(Object.keys(globalThis));
	return (
		<div>
			<div>
				<input type="text" value={id} onChange={(e) => setId(e.target.value)} />
			</div>
			<div>
				<a
					href={`https://miniapp.line.me/2010362654-ejSkHELZ?id=${id}`}
					target="_blank"
					rel="noopener noreferrer"
					style={id ? {} : { pointerEvents: "none", color: "gray", textDecoration: "none" }}
				>
					LINEで通知を受け取る
				</a>
			</div>
		</div>
	);
}
