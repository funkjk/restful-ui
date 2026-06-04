import type { LogMessage } from '$lib/restful/BuiltInPlugins'
import { writable } from 'svelte/store'


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