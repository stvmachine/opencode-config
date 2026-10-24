#!/usr/bin/env node
/**
 * build-presets.js — merge oh-my-opencode-slim preset fragments into
 * the root oh-my-opencode-slim.json.
 *
 * oh-my-opencode-slim only reads ~/.config/opencode/oh-my-opencode-slim.json
 * (plus per-project .opencode/oh-my-opencode-slim.json), so per-preset
 * fragments in presets/ must be merged into a single root config.
 *
 * Usage: node scripts/build-presets.js
 * Requires: Node >= 18, zero dependencies.
 */

const { readFileSync, writeFileSync, readdirSync } = require("node:fs");
const { join, dirname } = require("node:path");

const ROOT = join(__dirname, "..");
const PRESETS_DIR = join(ROOT, "presets");
const OUTPUT = join(ROOT, "oh-my-opencode-slim.json");

const SCHEMA = "https://unpkg.com/oh-my-opencode-slim@latest/oh-my-opencode-slim.schema.json";

// Fixed merge order for deterministic output.
const PRESET_ORDER = ["trinity", "openai", "openai-go", "claude-work", "sol-kimi", "go-deep-kimi", "kimi", "kimi-go", "free"];

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
	const { preset, ...restShared } = shared;
	const output = {
		$schema: SCHEMA,
		preset,
		presets,
		...restShared,
	};

	writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");
	console.log(
		`Merged presets: ${merged.join(", ")}${skipped.length ? ` (missing: ${skipped.join(", ")})` : ""}`,
	);
	console.log(`Wrote ${OUTPUT}`);
}

main();
