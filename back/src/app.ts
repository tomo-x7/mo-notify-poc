import { Hono } from "hono";
import { proxy } from "hono/proxy";
import { validator as honoValidator } from "hono/validator";

import "dotenv/config";

const validator = <T>() =>
	honoValidator("json", (value, c) => {
		return value as T;
	});
const channelTokens = new Map<string, { token: Promise<string>; timer: NodeJS.Timeout }>();
function getChannelToken(prefix: string) {
	if (channelTokens.has(prefix)) {
		const { token } = channelTokens.get(prefix)!;
		return token;
	}
	const tokenPromise = getChannelTokenInner(prefix);
	const timer = setTimeout(() => {
		channelTokens.delete(prefix);
	}, 850 * 1000);
	channelTokens.set(prefix, { token: tokenPromise, timer });
	return tokenPromise;
}
async function getChannelTokenInner(prefix: string) {
	const secret = process.env[`${prefix}_CHANNEL_SECRET`];
	const channelId = process.env[`${prefix}_CHANNEL_ID`];
	if (secret == null || channelId == null) throw new Error("CHANNEL_SECRET or CHANNEL_ID is not set");
	const sp = new URLSearchParams();
	sp.set("grant_type", "client_credentials");
	sp.set("client_id", channelId);
	sp.set("client_secret", secret);
	const res = await fetch("https://api.line.me/oauth2/v3/token", {
		method: "POST",
		body: sp,
	});
	if (!res.ok) throw new Error("Failed to get channel token");
	const data = await res.json();
	return data.access_token as string;
}
async function getServiceMessageToken(liffToken: string): Promise<string> {
	const channelToken = await getChannelToken("MINIAPP");
	const res = await fetch("https://api.line.me/message/v3/notifier/token", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${channelToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			liffAccessToken: liffToken,
		}),
	});
	if (!res.ok) {
		console.error("Failed to register token:", await res.text());
		throw new Error("Failed to register token");
	}
	const data = (await res.json()) as {
		notificationToken: string;
		remainingCount: number;
		expiresIn: number;
		sessionId: string;
	};
	return data.notificationToken;
}
async function sendServiceMessage(token: string, id: string) {
	const channelToken = await getChannelToken("MINIAPP");
	const res = await fetch("https://api.line.me/message/v3/notifier/send?target=service", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${channelToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			templateName: "order_comp_s_o_ja",
			params: {
				number: id,
				btn1_url: "https://line.me",
				btn2_url: "https://line.me",
				btn3_url: "https://line.me",
				btn4_url: "https://line.me",
			},
			notificationToken: token,
		}),
	});
	if (!res.ok) {
		console.error("Failed to send service message:", await res.text());
		return;
	}
	const data = await res.json();
	console.log("Service message sent:", data);
}
async function sendMessagingApi(userId: string, id: string) {
	const channelToken = await getChannelToken("MESSAGING");
	console.log(channelToken);
	const res = await fetch("https://api.line.me/v2/bot/message/push", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${channelToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			to: userId,
			messages: [
				{
					type: "flex",
					altText: `注文ID${id}が完成しました`,
					contents: {
						type: "bubble",
						body: {
							type: "box",
							layout: "vertical",
							contents: [
								{
									type: "text",
									text: "ご用意ができました",
									weight: "bold",
									size: "xl",
								},
								{
									type: "box",
									layout: "vertical",
									margin: "lg",
									spacing: "sm",
									contents: [
										{
											type: "box",
											layout: "baseline",
											spacing: "sm",
											contents: [
												{
													type: "text",
													text: "ID",
													color: "#aaaaaa",
													size: "sm",
													flex: 1,
												},
												{
													type: "text",
													text: id,
													wrap: true,
													color: "#666666",
													size: "sm",
													flex: 5,
												},
											],
										},
										{
											type: "box",
											layout: "baseline",
											spacing: "sm",
											contents: [
												{
													type: "text",
													text: "品目",
													color: "#aaaaaa",
													size: "sm",
													flex: 1,
												},
												{
													type: "text",
													text: "三色団子",
													wrap: true,
													color: "#666666",
													size: "sm",
													flex: 5,
												},
											],
										},
									],
								},
							],
						},
						footer: {
							type: "box",
							layout: "vertical",
							spacing: "sm",
							contents: [
								{
									type: "button",
									style: "link",
									height: "sm",
									action: {
										type: "uri",
										label: "詳細",
										uri: "http://example.com/",
									},
								},
							],
							flex: 0,
						},
					},
				},
			],
		}),
	});
	if (!res.ok) {
		console.error("Failed to send messaging api message:", await res.text());
		return;
	}
	const data = await res.json();
	console.log("Messaging API message sent:", data);
}

const app = new Hono().post(
	"/api/register",
	validator<{ type: "linesm"; token: string; id: string } | { type: "linemessaging"; userId: string; id: string }>(),
	async (c) => {
		const body = c.req.valid("json");
		switch (body.type) {
			case "linesm": {
				console.log("Registering service message token for id:", body.id);
				const smToken = await getServiceMessageToken(body.token);
				setTimeout(() => sendServiceMessage(smToken, body.id), 30 * 1000);
				break;
			}
			case "linemessaging": {
				console.log("Registering messaging api message for userId:", body.userId, "id:", body.id);
				setTimeout(() => sendMessagingApi(body.userId, body.id), 30 * 1000);
				break;
			}
			default:
				return c.json({ message: "invalid type" }, 400);
		}
		return c.json({ message: "ok" });
	},
);
app.get("/*", (c) => {
	return proxy(`http://localhost:4173/${c.req.path}`);
});
app.onError((err, c) => {
	console.error("Error occurred:", err);
	return c.json({ message: "Internal Server Error" }, 500);
});
type App = typeof app;
export { app, type App };
