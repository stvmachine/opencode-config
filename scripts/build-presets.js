#!/usr/bin/env node
/**
 * build-presets.js — merge oh-my-opencode-slim preset fragments into the
 * config files OpenCode reads.
 *
 * Emits two kinds of output, then copies ocx/profiles/ into
 * ~/.config/ocx/profiles/ (OCX 3 rejects symlinked profile dirs):
 *   1. The global config at ~/.config/opencode/oh-my-opencode-slim.json —
 *      contains every preset plus the shared fields, used when OpenCode runs
 *      directly (no OCX profile).
 *   2. One self-contained config per profile at
 *      ~/.config/ocx/profiles/<name>/oh-my-opencode-slim.json — contains the
 *      shared fields plus just that profile's preset (with "preset" set to the
 *      profile name). OCX 3 points OpenCode's config dir at the profile
 *      directory (via OPENCODE_CONFIG_DIR), so each profile selects its own
 *      lineup without the old OH_MY_OPENCODE_SLIM_PRESET wrapper scripts.
 *
 * Usage: node scripts/build-presets.js
 * Requires: Node >= 18, zero dependencies.
 */

const { readFileSync, writeFileSync, readdirSync, mkdirSync, lstatSync, unlinkSync, cpSync } = require("node:fs");
const { join } = require("node:path");
const { homedir } = require("node:os");

const ROOT = join(__dirname, "..");
const PRESETS_DIR = join(ROOT, "presets");
const OUTPUT = join(ROOT, "oh-my-opencode-slim.json");
// Profiles live in this monorepo under ocx/profiles/ (a sibling of the opencode
// config at the repo root) and are copied into ~/.config/ocx/profiles/: OCX 3
// rejects symlinks anywhere on its managed path, so it needs real directories.
const OCX_PROFILES_DIR = join(ROOT, "ocx", "profiles");
const OCX_HOME = join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "ocx");

const SCHEMA = "https://unpkg.com/oh-my-opencode-slim@latest/oh-my-opencode-slim.schema.json";

// Fixed merge order for deterministic output.
const PRESET_ORDER = ["claude-work", "trinity"];

function readJson(path) {
	return JSON.parse(readFileSync(path, "utf8"));
}

function main() {
	const shared = readJson(join(PRESETS_DIR, "_shared.json"));

	const available = new Set(
		readdirSync(PRESETS_DIR).filter((f) => f.endsWith(".json") && f !== "_shared.json"),
	);

	const presets = {};
	const merged = [];
	const skipped = [];
	for (const name of PRESET_ORDER) {
		const file = `${name}.json`;
		if (!available.has(file)) {
			skipped.push(name);
			continue;
		}
		presets[name] = readJson(join(PRESETS_DIR, file));
		merged.push(name);
		available.delete(file);
	}
	for (const leftover of available) {
		console.warn(`warning: ${leftover} not in PRESET_ORDER, skipping`);
	}

	// Keep key order stable: $schema, preset, presets, then remaining shared fields.
	const { preset: defaultPreset, ...restShared } = shared;

	// 1. Global config (all presets).
	const globalOutput = {
		$schema: SCHEMA,
		preset: defaultPreset,
		presets,
		...restShared,
	};
	writeFileSync(OUTPUT, JSON.stringify(globalOutput, null, 2) + "\n");

	// 2. Per-profile configs (one preset each, "preset" = profile name).
	for (const name of merged) {
		const dir = join(OCX_PROFILES_DIR, name);
		mkdirSync(dir, { recursive: true });
		const profileOutput = {
			$schema: SCHEMA,
			preset: name,
			presets: { [name]: presets[name] },
			...restShared,
		};
		writeFileSync(join(dir, "oh-my-opencode-slim.json"), JSON.stringify(profileOutput, null, 2) + "\n");
	}

	console.log(
		`Merged presets: ${merged.join(", ")}${skipped.length ? ` (missing: ${skipped.join(", ")})` : ""}`,
	);
	console.log(`Wrote ${OUTPUT} + ${merged.length} profile config(s) under ${OCX_PROFILES_DIR}`);

	syncProfiles();
}

// 3. Copy every repo profile into OCX's real profiles dir. Overwrites files the
// repo owns and leaves everything else (OCX's .ocx/ state, profiles created with
// `ocx profile add`) untouched. Replaces the old ~/.config/ocx symlink if present.
function syncProfiles() {
	try {
		if (lstatSync(OCX_HOME).isSymbolicLink()) unlinkSync(OCX_HOME);
	} catch (err) {
		if (err.code !== "ENOENT") throw err;
	}
	const target = join(OCX_HOME, "profiles");
	const names = readdirSync(OCX_PROFILES_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);
	for (const name of names) {
		cpSync(join(OCX_PROFILES_DIR, name), join(target, name), { recursive: true, force: true });
	}
	console.log(`Synced ${names.length} profile(s) to ${target}`);
}

main();
