import {ReportLanguage} from 'fflogs'
import _ from 'lodash'

export enum GameEdition {
	GLOBAL,
	KOREAN,
	CHINESE,
}

export function languageToEdition(lang: ReportLanguage): GameEdition {
	switch (lang) {
		case ReportLanguage.JAPANESE:
		case ReportLanguage.ENGLISH:
		case ReportLanguage.GERMAN:
		case ReportLanguage.FRENCH:
			return GameEdition.GLOBAL

		case ReportLanguage.KOREAN:
			return GameEdition.KOREAN

		case ReportLanguage.CHINESE:
			return GameEdition.CHINESE
	}

	throw new Error()
}

export interface Patch {
	// Using global as a source of truth on the order of patch keys
	date: Partial<Record<GameEdition, number>> & {[GameEdition.GLOBAL]: number}
}

// This is all right from /PatchList - should be easy to sync Eventually™
const PATCHES = {
	// Not going to support pre-4.0 at all
	'2.0 - 3.57': {
		date: {
			[GameEdition.GLOBAL]: 0,
			[GameEdition.KOREAN]: 0,
			[GameEdition.CHINESE]: 0,
		},
	},
	'4.0': {
		date: {
			[GameEdition.GLOBAL]: 1497517200,
		},
	},
	'4.01': {
		date: {
			[GameEdition.GLOBAL]: 1499162101,
		},
	},
	'4.05': {
		date: {
			[GameEdition.GLOBAL]: 1500368961,
		},
	},
	'4.06': {
		date: {
			[GameEdition.GLOBAL]: 1501747200,
		},
	},
	'4.1': {
		date: {
			[GameEdition.GLOBAL]: 1507622400,
		},
	},
	'4.11': {
		date: {
			[GameEdition.GLOBAL]: 1508839200,
		},
	},
	'4.15': {
		date: {
			[GameEdition.GLOBAL]: 1511258400,
		},
	},
	'4.2': {
		date: {
			[GameEdition.GLOBAL]: 1517227200,
		},
	},
	'4.25': {
		date: {
			[GameEdition.GLOBAL]: 1520935200,
		},
	},
	'4.3': {
		date: {
			[GameEdition.GLOBAL]: 1526976000,
		},
	},
	'4.31': {
		date: {
			[GameEdition.GLOBAL]: 1528223134,
		},
	},
	'4.35': {
		date: {
			[GameEdition.GLOBAL]: 1530617875,
		},
	},
	'4.36': {
		date: {
			[GameEdition.GLOBAL]: 1533635005,
		},
	},
	'4.4': {
		date: {
			[GameEdition.GLOBAL]: 1537268400,
		},
	},
	'4.5': {
		date: {
			[GameEdition.GLOBAL]: 1546857979,
		},
	},
}

export type PatchNumber = keyof typeof PATCHES
export default PATCHES as Record<PatchNumber, Patch>

interface PatchData {[key: string]: Patch}
const patchData: PatchData = PATCHES

// This is intentionally in newest->oldest order
const sortedPatches = (Object.keys(patchData) as PatchNumber[]).sort(
	(a, b) => patchData[b].date[GameEdition.GLOBAL] - patchData[a].date[GameEdition.GLOBAL],
)

export function getPatch(edition: GameEdition, timestamp: number): PatchNumber {
	const key = sortedPatches.find(key => (patchData[key].date[edition] || Infinity) < timestamp)
	return key || '2.0 - 3.57'
}

export function getPatchDate(edition: GameEdition, patch: PatchNumber) {
	const globalPatchTime = patchData[patch].date[GameEdition.GLOBAL]
	const key = sortedPatches
		.filter(key => patchData[key].date[GameEdition.GLOBAL] > globalPatchTime)
		.find(key => patchData[key].date[edition] !== undefined)
	return patchData[key || '2.0 - 3.57'].date[edition] || 0
}

export function patchSupported(
	edition: GameEdition,
	from: PatchNumber,
	to: PatchNumber,
	at = (new Date()).getTime(),
) {
	if (!from) { return false }

	const nextPatchKey = sortedPatches[sortedPatches.indexOf(to) - 1]
	const nextPatch = patchData[nextPatchKey]

	const fromDate = getPatchDate(edition, from)
	const toDate = nextPatch
		? getPatchDate(edition, nextPatchKey)
		: Infinity

	return _.inRange(at, fromDate, toDate)
}
