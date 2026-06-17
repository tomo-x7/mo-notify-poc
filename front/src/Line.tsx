import { useEffect, useMemo, useState } from "react";
import { client } from "./context/hc";
import { useLiff } from "./context/liff";
export function Line() {
	const id = useMemo(() => new URL(location.href).searchParams.get("id") ?? "", []);

	if (!id) return <div>無効なURLです</div>;
	return <LineInner id={id} />;
}

function LineInner({ id }: { id: string }) {
	const [token, setToken] = useState<string | null>(null);
	const liff = useLiff();
	useEffect(() => {
		setToken(liff.getAccessToken());
	}, [liff]);
	if (token == null) return <div>token取得中...</div>;
	const registerSmNotify = async () => {
		const res = await client.api.register.$post({ json: { type: "linesm", token, id } });
		res.ok ? alert("登録成功") : alert("登録失敗");
	};
	const registerOfficialAccountNotify = async () => {
		if (!(await liff.getFriendship()).friendFlag) {
			await liff.requestFriendship();
			if (!(await liff.getFriendship()).friendFlag) {
				alert("友だち追加が必要です");
				return;
			}
		}
		const res = await client.api.register.$post({
			json: { type: "linemessaging", userId: (await liff.getProfile()).userId, id },
		});
		res.ok ? alert("登録成功") : alert("登録失敗");
	};
	return (
		<div>
			<div>id: {id}</div>
			<div style={{ marginBottom: "5px" }}>token: {token}</div>
			<div style={{ marginBottom: "5px" }}>
				<button type="button" onClick={registerSmNotify}>
					サービスメッセージで通知を受け取る
				</button>
			</div>
			<div style={{ marginBottom: "5px" }}>
				<button type="button" onClick={registerOfficialAccountNotify}>
					公式アカウントから通知を受け取る
				</button>
			</div>
		</div>
	);
}
