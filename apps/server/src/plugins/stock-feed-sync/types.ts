/**
 * Plugin init options — env values are read in vendure-config.ts only.
 */
export interface PluginInitOptions {
    feedUrl: string;
    syncCron: string;
    scheduleEnabled: boolean;
    /** When > 0, limits rows processed unless overridden by mutation. 0 = no limit. */
    devSyncLimit: number;
}
