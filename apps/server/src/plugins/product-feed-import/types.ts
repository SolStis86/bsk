/**
 * Plugin init options — env values are read in vendure-config.ts only.
 */
export interface PluginInitOptions {
    feedUrl: string;
    imageZipUrl: string;
    importCron: string;
    disableMissingFromFeed: boolean;
    /** When > 0, limits import unless overridden by mutation/CLI. 0 = no limit. */
    devImportLimit: number;
}
