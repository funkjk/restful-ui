import type { LogMessage } from '$lib/restful/BuiltInPlugins'
import { persisted } from 'svelte-persisted-store'
import { writable } from 'svelte/store'

export const ui = persisted('cloudhub.ui', {
    cloudhubApplicationsFilterText:"",
    cloudhubApplicationsOnlyFavoriateFilter: false,
    cloudhubApplicationsFavorites: [] as string[],
})

export const loading = writable(false)
export const logMessages = writable([] as LogMessage[])

export const notifyMessage = (()=> {
	const { subscribe, set } = writable("");
    return {
        subscribe,
        notify: (message:string) => {
            set(message)
        }
    }
})()