#!/usr/bin/env node
// Stdio bridge from opencode to the Claude Design MCP server.
//
// Claude Design (https://api.anthropic.com/v1/design/mcp) only accepts tokens issued to
// Anthropic's registered Claude Design OAuth client. Its authorization server publishes no
// metadata, refuses dynamic client registration and requires `state` in the code exchange,
// so opencode's built-in remote-MCP OAuth cannot sign in. This bridge performs the same
// sign-in as Claude Code's /design-login, keeps its own (independently refreshed) tokens,
// and forwards MCP messages over Streamable HTTP.
//
//   node claude-design-mcp.mjs login    one-time browser sign-in
//   node claude-design-mcp.mjs status   show stored token state
//   node claude-design-mcp.mjs          run the stdio MCP server (what opencode starts)

import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { closeSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";

const MCP_URL = "https://api.anthropic.com/v1/design/mcp";
const AUTHORIZE_URL = "https://claude.com/cai/oauth/authorize";
const TOKEN_URL = "https://platform.claude.com/v1/oauth/token";
// Claude Code's registered Claude Design client (DESIGN_CLIENT_ID in Claude Code).
const CLIENT_ID = process.env.CLAUDE_DESIGN_CLIENT_ID ?? "59637612-477b-4836-a601-b0589eda7704";
const SCOPES = ["user:design:read", "user:design:write"];
const TOKEN_FILE =
	process.env.CLAUDE_DESIGN_TOKEN_FILE ?? join(homedir(), ".config/opencode/secrets/claude_design_oauth.json");
const LOCK_FILE = `${TOKEN_FILE}.lock`;
const LOGIN_HINT = `run: node ${process.argv[1]} login`;

const log = (...args) => console.error("[claude-design]", ...args);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- token store -----------------------------------------------------------

function readTokens() {
	try {
		return JSON.parse(readFileSync(TOKEN_FILE, "utf8"));
	} catch {
		return null;
	}
}

function writeTokens(tokens) {
	mkdirSync(dirname(TOKEN_FILE), { recursive: true, mode: 0o700 });
	const tmp = `${TOKEN_FILE}.${process.pid}.tmp`;
	writeFileSync(tmp, JSON.stringify(tokens, null, 2), { mode: 0o600 });
	renameSync(tmp, TOKEN_FILE);
}

function toStored(response, previous) {
	if (!response?.access_token) throw new Error("token response has no access_token");
	const scopes = (response.scope ?? previous?.scope ?? SCOPES.join(" ")).split(" ").filter(Boolean);
	const missing = SCOPES.filter((scope) => !scopes.includes(scope));
	if (missing.length) throw new Error(`token was not granted the design scopes (missing: ${missing.join(", ")})`);
	return {
		access_token: response.access_token,
		refresh_token: response.refresh_token ?? previous?.refresh_token,
		expires_at: Date.now() + (response.expires_in ?? 3600) * 1000,
		scope: scopes.join(" "),
	};
}

async function tokenRequest(body) {
	const res = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "content-type": "application/json", accept: "application/json" },
		body: JSON.stringify({ client_id: CLIENT_ID, ...body }),
		signal: AbortSignal.timeout(30_000),
	});
	const text = await res.text();
	let json;
	try {
		json = JSON.parse(text);
	} catch {}
	if (!res.ok) {
		const detail = json?.error_description ?? json?.error?.message ?? text.slice(0, 200);
		throw Object.assign(new Error(`token endpoint returned ${res.status}: ${detail}`), {
			invalidGrant: json?.error === "invalid_grant",
		});
	}
	return json;
}

// opencode can start one bridge per project, so refreshes are serialised across processes.
async function withLock(fn) {
	const deadline = Date.now() + 15_000;
	for (;;) {
		try {
			closeSync(openSync(LOCK_FILE, "wx", 0o600));
			break;
		} catch (err) {
			if (err.code !== "EEXIST") throw err;
			try {
				if (Date.now() - statSync(LOCK_FILE).mtimeMs > 30_000) rmSync(LOCK_FILE, { force: true });
			} catch {}
			if (Date.now() > deadline) throw new Error("timed out waiting for another process to refresh the token");
			await sleep(200);
		}
	}
	try {
		return await fn();
	} finally {
		rmSync(LOCK_FILE, { force: true });
	}
}

let refreshing;
async function accessToken({ force = false } = {}) {
	const current = readTokens();
	if (!current?.access_token) throw new Error(`Not signed in to Claude Design; ${LOGIN_HINT}`);
	if (!force && current.expires_at - 60_000 > Date.now()) return current.access_token;
	refreshing ??= withLock(async () => {
		// Another bridge may have refreshed while this one waited for the lock.
		const latest = readTokens();
		if (latest?.access_token !== current.access_token && latest?.expires_at - 60_000 > Date.now()) {
			return latest.access_token;
		}
		if (!latest?.refresh_token) throw new Error(`Claude Design sign-in has no refresh token; ${LOGIN_HINT}`);
		try {
			const response = await tokenRequest({
				grant_type: "refresh_token",
				refresh_token: latest.refresh_token,
				scope: SCOPES.join(" "),
			});
			const next = toStored(response, latest);
			writeTokens(next);
			return next.access_token;
		} catch (err) {
			if (err.invalidGrant) throw new Error(`Claude Design sign-in expired; ${LOGIN_HINT}`);
			throw err;
		}
	}).finally(() => {
		refreshing = undefined;
	});
	return refreshing;
}

// --- login -----------------------------------------------------------------

async function login() {
	const verifier = randomBytes(32).toString("base64url");
	const challenge = createHash("sha256").update(verifier).digest("base64url");
	const state = randomBytes(32).toString("base64url");

	let settle;
	const callback = new Promise((resolve, reject) => {
		settle = { resolve, reject };
	});
	const handler = (req, res) => {
		const url = new URL(req.url ?? "/", "http://localhost");
		if (url.pathname !== "/callback") return void res.writeHead(404).end();
		const error = url.searchParams.get("error_description") ?? url.searchParams.get("error");
		const code = url.searchParams.get("code");
		const ok = !error && code && url.searchParams.get("state") === state;
		res
			.writeHead(ok ? 200 : 400, { "content-type": "text/plain; charset=utf-8", connection: "close" })
			.end(ok ? "Signed in to Claude Design. You can close this tab." : `Claude Design sign-in failed: ${error ?? "invalid callback"}`);
		if (ok) settle.resolve(code);
		else settle.reject(new Error(error ?? "invalid OAuth callback (state mismatch or missing code)"));
	};

	// The redirect uses "localhost", which the browser may resolve to either loopback address.
	const servers = [createServer(handler), createServer(handler)];
	const port = await new Promise((resolve, reject) => {
		servers[0].once("error", reject).listen(0, "127.0.0.1", () => resolve(servers[0].address().port));
	});
	await new Promise((resolve) => servers[1].once("error", resolve).listen(port, "::1", resolve));

	const redirectUri = `http://localhost:${port}/callback`;
	const authorize = new URL(AUTHORIZE_URL);
	for (const [key, value] of Object.entries({
		code: "true",
		client_id: CLIENT_ID,
		response_type: "code",
		redirect_uri: redirectUri,
		scope: SCOPES.join(" "),
		code_challenge: challenge,
		code_challenge_method: "S256",
		state,
	})) {
		authorize.searchParams.set(key, value);
	}

	console.error(`Opening your browser to sign in to Claude Design. If it does not open, visit:\n\n${authorize}\n`);
	const opener = process.platform === "darwin" ? "open" : "xdg-open";
	spawn(opener, [authorize.toString()], { stdio: "ignore", detached: true }).on("error", () => {}).unref();

	const timeout = setTimeout(() => settle.reject(new Error("timed out after 5 minutes waiting for the browser sign-in")), 300_000);
	try {
		const code = await callback;
		const response = await tokenRequest({
			grant_type: "authorization_code",
			code,
			redirect_uri: redirectUri,
			code_verifier: verifier,
			state,
		});
		writeTokens(toStored(response));
		console.error(`Signed in. Tokens saved to ${TOKEN_FILE}`);
	} finally {
		clearTimeout(timeout);
		for (const server of servers) {
			server.closeAllConnections();
			if (server.listening) server.close();
		}
	}
}

function status() {
	const tokens = readTokens();
	if (!tokens?.access_token) return console.log(`Not signed in (${TOKEN_FILE}); ${LOGIN_HINT}`);
	const minutes = Math.round((tokens.expires_at - Date.now()) / 60_000);
	const expiry = minutes > 0 ? `expires in ${minutes} min` : `expired ${-minutes} min ago (refreshes on next use)`;
	console.log(`Signed in. Access token ${expiry}; refresh token ${tokens.refresh_token ? "present" : "missing"}; scope: ${tokens.scope}`);
}

// --- stdio <-> Streamable HTTP proxy ---------------------------------------

async function serve() {
	let sessionId;
	let protocolVersion;
	const initializeIds = new Set();
	const unanswered = new Set();

	const emit = (payload) => {
		for (const message of [payload].flat()) {
			if (message?.id !== undefined && !message.method) {
				unanswered.delete(message.id);
				if (initializeIds.delete(message.id) && message.result?.protocolVersion) {
					protocolVersion = message.result.protocolVersion;
				}
			}
			process.stdout.write(`${JSON.stringify(message)}\n`);
		}
	};

	const post = (message, token) => {
		const headers = {
			authorization: `Bearer ${token}`,
			"content-type": "application/json",
			accept: "application/json, text/event-stream",
		};
		if (sessionId) headers["mcp-session-id"] = sessionId;
		if (protocolVersion) headers["mcp-protocol-version"] = protocolVersion;
		return fetch(MCP_URL, { method: "POST", headers, body: JSON.stringify(message) });
	};

	const send = async (message) => {
		if ([message].flat().some((m) => m?.method === "initialize")) {
			sessionId = undefined;
			protocolVersion = undefined;
		}
		let res = await post(message, await accessToken());
		if (res.status === 401) {
			await res.body?.cancel();
			res = await post(message, await accessToken({ force: true }));
		}
		sessionId = res.headers.get("mcp-session-id") ?? sessionId;
		return res;
	};

	const relay = async (res) => {
		if (res.status === 202 || res.status === 204) return res.body?.cancel();
		if (!res.ok) {
			const text = await res.text().catch(() => "");
			if (res.status === 404) sessionId = undefined;
			const hint = res.status === 401 || res.status === 403 ? ` (${LOGIN_HINT})` : "";
			throw new Error(`Claude Design returned HTTP ${res.status}${hint}: ${text.slice(0, 300)}`);
		}
		if (!(res.headers.get("content-type") ?? "").includes("text/event-stream")) {
			const text = await res.text();
			if (text.trim()) emit(JSON.parse(text));
			return;
		}
		const decoder = new TextDecoder();
		let buffer = "";
		let data = [];
		const dispatch = () => {
			if (data.length) emit(JSON.parse(data.join("\n")));
			data = [];
		};
		for await (const chunk of res.body) {
			buffer += decoder.decode(chunk, { stream: true });
			for (let newline; (newline = buffer.indexOf("\n")) !== -1; ) {
				const line = buffer.slice(0, newline).replace(/\r$/, "");
				buffer = buffer.slice(newline + 1);
				if (line === "") dispatch();
				else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
			}
		}
		dispatch();
	};

	// Sends go out in order (initialize before initialized before tools/list); response
	// bodies are relayed concurrently so a long tool call does not block others.
	let queue = Promise.resolve();
	const inflight = new Set();
	const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
	rl.on("line", (line) => {
		if (!line.trim()) return;
		let message;
		try {
			message = JSON.parse(line);
		} catch {
			return log("ignoring non-JSON input line");
		}
		const requests = [message].flat().filter((m) => m?.method && m.id !== undefined);
		for (const request of requests) {
			unanswered.add(request.id);
			if (request.method === "initialize") initializeIds.add(request.id);
		}
		const sent = queue.then(() => send(message));
		queue = sent.then(
			() => {},
			() => {},
		);
		const handled = sent
			.then(relay)
			.then(
				() => "Claude Design closed the stream without a response",
				(err) => String(err?.message ?? err),
			)
			.then((reason) => {
				for (const { id } of requests) {
					if (unanswered.has(id)) emit({ jsonrpc: "2.0", id, error: { code: -32603, message: reason } });
				}
			})
			.finally(() => inflight.delete(handled));
		inflight.add(handled);
	});
	rl.on("close", async () => {
		// Flush in-flight replies, but don't let a long tool call hold the process open.
		await Promise.race([Promise.allSettled(inflight), sleep(5_000)]);
		if (sessionId) {
			try {
				await fetch(MCP_URL, {
					method: "DELETE",
					headers: { authorization: `Bearer ${await accessToken()}`, "mcp-session-id": sessionId },
					signal: AbortSignal.timeout(2_000),
				});
			} catch {}
		}
		process.exit(0);
	});
}

const command = process.argv[2];
if (command === "login") {
	await login().then(
		() => process.exit(0),
		(err) => {
			log(err.message);
			process.exit(1);
		},
	);
} else if (command === "status") {
	status();
} else if (!command) {
	await serve();
} else {
	console.error("usage: claude-design-mcp.mjs [login|status]");
	process.exit(2);
}
