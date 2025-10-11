import JSON5 from "json5"
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, appendFileSync, rmSync} from "fs"
import path from "path"

const OUTPUT_PATH = `./out/`;
const INPUT_PATH = `./translations/`;
const COMBINE_ALL_TOGETHER = true; // Will bundle all lines in json into one file, for example: out/en.lua

function isValidRecord(value: any): value is Record<string, unknown> {
	return (typeof value === "object") && (value[0] === undefined); // If this is an array, then it will have an index member.
}

/**
 * It reads the file and parses the JSON into lua text.
 */
function parseFileToRecord(file: string, langCode: string): Record<string, string> | void {
	const extension = path.extname(file);
	if (extension.length === 0 || path.basename(file).charAt(0) === ".") {
		return
	}; // prob is a system file
	const buffer = readFileSync(file, { encoding: "utf8" })
	switch (extension) {
		case ".json":
			return JSON5.parse(buffer)
		// you can put others parsers, such as YAML, INI or TOML...
		default:
			console.warn(`File ${file} was ignored, isn't a compatible extension filename.`)
			return
	}
}

function createLuaString(langCode: string, textID: string, translatedText: string): string {
	return REF_LUATEXT
		.replaceAll("<TEXT_ID>", textID)
		.replaceAll("<LANGUAGE_CODE>", langCode)
		.replaceAll("<TRANSLATED_TEXT>", translatedText.replaceAll("\n", "\\n").replaceAll('\"', "\\\""));
}

const REF_LUATEXT = 'translate.AddLocalization("<TEXT_ID>", {["<LANGUAGE_CODE>"] = "<TRANSLATED_TEXT>"});\n';
function transformToLuaFile(langCode: string, filename: string, i18nTable: Record<string, string>) {
	let strBuffer = "";
	if (!isValidRecord(i18nTable)) {
		throw new Error("Parsing error! Translation file is an array or string (non-object Record).")
	};
	for (const [key, value] of Object.entries(i18nTable)) {
		if (typeof value !== "string") {
			console.warn(`Skipped "${key}", value is not string!`);
			continue
		};
		// another way I could add the langCode is by keeping the placeholder text and 
		// let other functions outside this replace, this would reduce the amount of params...
		strBuffer += createLuaString(langCode, key, value);
	}
	
	if (!existsSync(OUTPUT_PATH)) mkdirSync(OUTPUT_PATH, { recursive: true })
	if (COMBINE_ALL_TOGETHER) {		
		appendFileSync(path.join(OUTPUT_PATH, langCode + ".lua"), strBuffer, { encoding: "utf8" })
		return;
	}
	const root = path.join(OUTPUT_PATH, langCode)
	if (!existsSync(root)) mkdirSync(root, { recursive: true })
	writeFileSync(path.join(root, filename + ".lua"), strBuffer, { encoding: "utf8" })
}

/**
 * Get all files in the folder and process them.
 * @param langCode 
 */
function processTranslationFolder(langCode: string) {
	const absPath = path.join(INPUT_PATH, langCode);
	const jsonFiles = readdirSync(absPath, { recursive: true, encoding: "utf8" })
	jsonFiles.forEach(
		(translation_file) => {
			// Supposing this is a JSON file
			const fullJSONFile = path.join(absPath, translation_file);
			const rec = parseFileToRecord(fullJSONFile, langCode)
			if (rec !== undefined) {
				transformToLuaFile(langCode, path.parse(translation_file).name, rec)
			}
		}
	)
}

function prepareOutputPath() {
	rmSync(OUTPUT_PATH, {recursive: true, force: true}); // This... is dangerous...
	mkdirSync(OUTPUT_PATH);
}

prepareOutputPath();
readdirSync(INPUT_PATH).forEach(processTranslationFolder);