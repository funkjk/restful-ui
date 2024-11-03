import { anypointFetch } from '$lib/anypoint'
import { get, writable } from 'svelte/store'

export const applications = writable([] as Application[])

export async function getApplications(force: boolean = false) {
    if (force || get(applications).length == 0) {
        const response = await anypointFetch("cloudhub/api/v2/applications") as Application[];
        applications.set(response)
    }
    return get(applications)
}
export async function getApplication(domain: string, force: boolean = false) {
    if (force || get(applications).length == 0) {
        const response = await anypointFetch(`cloudhub/api/v2/applications/${domain}`) as Application;
        applications.update(store => store.filter(e => e.domain !== domain).concat(response))
    }
    return get(applications).filter(e => e.domain === domain)[0]
}


export interface Application {
    domain: string;
    properties: any;
    propertiesOptions: any;
    status: string;
    workers: {
        type: {
            name: string;
            weight: number;
            cpu: string;
            memory: string;
        };
        amount: number;
        remainingOrgWorkers: number;
        totalOrgWorkers: number;
        recentStatistics: {
            transactions: number;
            cpu: number;
        };
    };
    lastUpdateTime: number;
    userId: number;
    muleVersion: {
        version: string;
    };
    logLevels: any;
    ipAddresses: any;
};