import JSON5 from "json5";
import {
	existsSync,
	readFileSync,
	readdirSync,
	mkdirSync,
	rmSync,
	lstatSync
} from "fs";
import {writeFile} from "fs/promises"
import path, { basename, dirname, extname, join } from "path";

/////////////////////////////////////////////////////////////////////////
/////                             CONFIG                            /////

const DEFAULT_LANGUAGE: SupportedLangs = "en";

const OUTPUT_PATH = `./out/`;
const INPUT_PATH = `./translations/`;

// If true, messages will be checked for any possible issues. ATM they're just don't included
const CHECK_MESSAGE = false;

// If true, all messages will be bundled into one single file called "bundle.lua"
const BUNDLE_ALL = true;

// If true, during output will split into the structure similar to INPUT_PATH.
const MULTIFOLDER_MODE = false;


// All files that went wrong will be there
const ODDS_FILE = "_issues_"; 



//////////////////////////////////////////////////////
///                                               ////
///      DON'T TOUCH THE CODE YOU DON'T KNOW      ////
///                                               ////
//////////////////////////////////////////////////////

/**
 * Checks if the translation message should be included in function.
 */
function checkTranslation(translation: LocalizationText): boolean {
	if (!CHECK_MESSAGE) return true; // Never check if we don't want

	const defTranslation = textIDMap.get(translation.textID);

	if (
		DEFAULT_LANGUAGE &&
		defTranslation?.get(DEFAULT_LANGUAGE)?.message === translation.message
	) {
		return false;
	}
	if (!translation.message) {
		if (translation["langCode"] === DEFAULT_LANGUAGE) {
			console.warn(
				`Missing default text at ${translation.textID}, check for "${DEFAULT_LANGUAGE}/${translation.file}" translation`,
			);
		}
		return false;
	}
	return true;
}

/**
 * Localization Object for storing information about translation.
 */
interface LocalizationText {
	langCode: SupportedLangs;
	textID: string;
	message: string;
	file: string;
}
function LocalizationText(
	langCode: SupportedLangs,
	textID: string,
	message: string,
	file: string,
): LocalizationText {
	return { langCode, textID, message, file };
}


const REF_TRANSLATION = '\t["<LANGUAGE_CODE>"] = "<LOCALIZED_TEXT>"'; // semicolon is added later...
const REF_LUATEXT =
	'translate.AddLocalization("<TEXT_ID>", {\n<TRANSLATIONS>\n});\n';
// https://wiki.facepunch.com/gmod/Addon_Localization#supportedlanguages

// tbh, I'd use new Set() for this, as it's faster than arrays... but I couldn't use dynamic typing.
const _supportedLanguages = [
	"bg",
	"cs",
	"da",
	"de",
	"el",
	"en",
	"en-PT",
	"es-ES",
	"et",
	"fi",
	"fr",
	"he",
	"hr",
	"hu",
	"it",
	"ja",
	"ko",
	"lt",
	"nl",
	"no",
	"pl",
	"pt-BR",
	"pt-PT",
	"ru",
	"sk",
	"sv-SE",
	"th",
	"tr",
	"uk",
	"vi",
	"zh-CN",
	"zh-TW",
] as const;

type SupportedLangs = (typeof _supportedLanguages)[number];


// const GModSupportedLangs = new Set(_supportedLanguages); // I'm tired of cluttering this file
function isSupportedLanguage(str: string): str is SupportedLangs {
	return (_supportedLanguages as unknown as string[]).includes(str); // ye, this is slow.
	// return GModSupportedLangs.has(str as any);
}


// textID[] -> lang[] -> message
const textIDMap = new Map<string, Map<SupportedLangs, LocalizationText>>();

/**
 * It reads the file and parses the JSON to Record
 */
function _parseFileToRecord(file: string): Record<string, string> | undefined {
	const extension = path.extname(file);
	if (extension.length === 0 || path.basename(file).charAt(0) === ".") {
		return;
	} // prob is a system file
	const buffer = readFileSync(file, { encoding: "utf8" });
	switch (extension) {
		case ".jsonc":
			return JSON5.parse(buffer);
		case ".json":
			return JSON5.parse(buffer);
		// you can put others parsers, such as YAML, INI or TOML...
		default:
			console.warn(
				`File ${file} was ignored, isn't a compatible extension filename.`,
			);
			return;
	}
}

function AddEntryToDictionary(lzObj: LocalizationText) {
	if (!textIDMap.has(lzObj.textID)) {
		textIDMap.set(lzObj.textID, new Map());
	}
	const langMap = textIDMap.get(lzObj.textID);
	if (langMap) {
		if (!checkTranslation(lzObj)) return false;
		if (langMap.has(lzObj.langCode)) {
			console.warn("Skipping repeated entry in dictionary...");
			return false;
		}
		langMap.set(lzObj.langCode, lzObj);
	}
	return true;
}

const escapeMessage = (str: string) => str.replaceAll("\n", "\\n").replaceAll("\"","\\\"");

/**
 * Generates a lua function that has all localizations included of same textID.
 */
function createLocalizationFn(textID: string, tList: LocalizationText[]) {
	if (tList.length === 0) {
		return `-- No default message for ${textID}\n`;
	}
	return REF_LUATEXT.replaceAll("<TEXT_ID>", textID).replaceAll(
		"<TRANSLATIONS>",
		tList
			.map((translation) => {
				// const isLast = tList.length === index + 1;
				return REF_TRANSLATION.replaceAll(
					"<LOCALIZED_TEXT>",
					escapeMessage(translation.message),
				).replaceAll("<LANGUAGE_CODE>", translation.langCode); // + (isLast ? ",\n" : "\n")
			})
			.join(",\n"),
	);
}

/**
 * Get all files in the folder and read them to JSON.
 * @param langCode
 */
function readLocalizationFolder(langCode: SupportedLangs) {
	// console.log(`>> Reading messages for "${langCode}" <<`);
	const absPath = path.join(INPUT_PATH, langCode);
	const jsonFiles = readdirSync(absPath, {
		recursive: true,
		encoding: "utf8",
	});

	// Supposing this is a JSON file
	for (const translation_file of jsonFiles) {
		const fullJSONFile = path.join(absPath, translation_file);

		if (lstatSync(fullJSONFile).isDirectory()) {
			// This is a directory, we're running in recursive mode.
			continue
		}
		const rec = _parseFileToRecord(fullJSONFile);
		if (rec === undefined) {
			console.error(
				"Unable to read translation file (%s), do you have enough permissions?",
				fullJSONFile,
			);
			continue;
		}
		for (const key in rec) {
			if (!Object.hasOwn(rec, key)) continue;

			const message = rec[key];
			if (message === undefined) continue;

			const lzObj = LocalizationText(
				langCode,
				key,
				message,
				join(
					dirname(translation_file),
					basename(translation_file, extname(translation_file)),
				)
			);

			AddEntryToDictionary(lzObj);
		}
	}
	// console.log(`<< Finished messages for "${langCode}" >>\n`);
}

function assert(cond: boolean, msg: string) {
	if (cond !== true) throw Error(msg);
}

function prepareOutputPath() {
	// Make sure we aren't deleting system root, right?
	assert(
		existsSync("./node_modules"),
		'Missing node_modules. Did you forgot to run "npm install"?',
	);
	assert(
		existsSync("./package.json"),
		'Missing "package.json". \nAre you really running this script in same directory of repository?\nMake sure you\'ve run "npm install && npm run build".',
	);
	assert(
		existsSync(INPUT_PATH),
		`Missing INPUT_PATH "${INPUT_PATH}"\nMake sure the path is setup correctly.`,
	);
	rmSync(OUTPUT_PATH, { recursive: true, force: true }); // This... is dangerous...
	mkdirSync(OUTPUT_PATH);
}

type FileContentMap = Map<string, string>
function parseAllTranslations(): FileContentMap {
	const strBuffers = new Map<string, string>();
	textIDMap.forEach((vLangMap, kTextID) => {
		
		let file = vLangMap.get(DEFAULT_LANGUAGE)?.file || ODDS_FILE; 
		let fnString: string
		if (BUNDLE_ALL) {
			file = "bundle";
		}
		if (MULTIFOLDER_MODE) {
			vLangMap.forEach((lzObj, curLang) => {
				const mfile = join(curLang, file);
				fnString = createLocalizationFn(kTextID, [lzObj]);
				strBuffers.set(
					mfile,
					(strBuffers.has(mfile) ? strBuffers.get(mfile) : "") + fnString,
				);
			})
		} else {
	
			const allLzObjs = vLangMap.values().toArray(); // This disregards the Key record.
			/**
			 * It will be false if ODDS_FILE is empty.
			 */
			fnString = createLocalizationFn(kTextID, allLzObjs);

			strBuffers.set(
				file,
				(strBuffers.has(file) ? strBuffers.get(file) : "") + fnString,
			);
		}

	});
	if (strBuffers.has(ODDS_FILE)) {
		strBuffers.set(ODDS_FILE, "-- Any warnings from converting translations will be there --\n\n" + strBuffers.get(ODDS_FILE))
	}
	return strBuffers;
}

async function writeAllToOutput(strBuffers: FileContentMap) {
	let errors = 0;

	const prms: Promise<void>[] = [];
	strBuffers.forEach((vLuaCode, kFilename) => {
		const filePath = join(OUTPUT_PATH, `${kFilename}.lua`);
		const dirTree = dirname(filePath);
		if (!existsSync(dirTree)) {
			mkdirSync(dirTree, {recursive: true})
		}
		prms.push(writeFile(filePath, vLuaCode, { encoding: "utf-8" }).catch(
			(reason) => {
				if (typeof reason === "string") {
					console.error(reason);
				}
				errors += 1;
			}
		))
	});

	await Promise.all(prms)
	return errors
}


// Runtime code //

prepareOutputPath();

const langs = readdirSync(INPUT_PATH);
for (const language of langs) {
	if (!lstatSync(join(INPUT_PATH, language)).isDirectory()) {
		console.error("Odd file in input path, expecting directory with message files got file in root.")
		continue
	} 
	if (!isSupportedLanguage(language)) {
		console.error(`Expected one of supported languages in GMod but got ${language}, are you sure you named the folder correctly?\n` + 
			"Please, refer to: https://wiki.facepunch.com/gmod/Addon_Localization#supportedlanguages")
		continue
	} 
	readLocalizationFolder(language)
}

const files = parseAllTranslations();
writeAllToOutput(files);

console.log("Done!")
